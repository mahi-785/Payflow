from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionDetail, TransactionOut, TransactionPage
from app.services.payment_engine import IdempotencyConflict, ProcessingError, UnknownMerchant, process_payment

router = APIRouter(prefix="/api/v1/transactions", tags=["transactions"])


def _err(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status, {"code": code, "message": message})


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(payload: TransactionCreate, response: Response,
                       idempotency_key: str = Header(min_length=8, max_length=128),
                       db: Session = Depends(get_db)):
    try:
        tx, created = process_payment(db, payload, idempotency_key)
    except UnknownMerchant:
        raise _err(422, "UNKNOWN_MERCHANT", "Merchant does not exist or is inactive")
    except IdempotencyConflict as e:
        raise _err(409, "IDEMPOTENCY_CONFLICT", str(e))
    except ProcessingError:
        raise _err(503, "PROCESSING_ERROR", "Temporary processing failure; safe to retry with the same key")
    if not created:
        response.status_code = 200
    return tx


@router.get("", response_model=TransactionPage)
def list_transactions(status: str | None = None, merchant_id: str | None = None,
                      date_from: datetime | None = None, date_to: datetime | None = None,
                      limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0),
                      db: Session = Depends(get_db)):
    q = select(Transaction)
    if status:
        q = q.where(Transaction.status == status.upper())
    if merchant_id:
        q = q.where(Transaction.merchant_id == merchant_id)
    if date_from:
        q = q.where(Transaction.created_at >= date_from)
    if date_to:
        q = q.where(Transaction.created_at <= date_to)
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    items = db.scalars(q.order_by(Transaction.created_at.desc()).limit(limit).offset(offset)).all()
    return TransactionPage(items=items, total=total, limit=limit, offset=offset)


@router.get("/{transaction_id}", response_model=TransactionDetail)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    tx = db.get(Transaction, transaction_id)
    if not tx:
        raise _err(404, "NOT_FOUND", "Transaction not found")
    return tx
