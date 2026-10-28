from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.transaction import LOW, Transaction, TransactionEvent
from app.schemas.transaction import TransactionOut

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.get("", response_model=list[TransactionOut])
def list_alerts(reviewed: bool | None = None, db: Session = Depends(get_db)):
    q = select(Transaction).where(Transaction.risk_level != LOW)
    if reviewed is not None:
        q = q.where(Transaction.reviewed.is_(reviewed))
    return db.scalars(q.order_by(Transaction.created_at.desc()).limit(100)).all()


@router.post("/{transaction_id}/review", response_model=TransactionOut)
def mark_reviewed(transaction_id: str, db: Session = Depends(get_db)):
    tx = db.get(Transaction, transaction_id)
    if not tx or tx.risk_level == LOW:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "Alert not found"})
    if not tx.reviewed:
        tx.reviewed = True
        tx.events.append(TransactionEvent(event_type="REVIEWED", detail="marked reviewed"))
        db.commit()
    return tx
