from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.transaction import APPROVED, DECLINED, LOW, Transaction
from app.schemas.transaction import OverviewMetrics

router = APIRouter(prefix="/api/v1/metrics", tags=["metrics"])


@router.get("/overview", response_model=OverviewMetrics)
def overview(db: Session = Depends(get_db)):
    def count(*conds):
        return db.scalar(select(func.count(Transaction.id)).where(*conds)) or 0

    total, approved, declined = count(), count(Transaction.status == APPROVED), count(Transaction.status == DECLINED)
    volume = db.scalar(select(func.coalesce(func.sum(Transaction.amount_cents), 0))
                       .where(Transaction.status == APPROVED))
    return OverviewMetrics(
        total_transactions=total, approved=approved, declined=declined,
        approval_rate=round(approved / total, 4) if total else 0.0,
        decline_rate=round(declined / total, 4) if total else 0.0,
        approved_volume_cents=int(volume),
        flagged_count=count(Transaction.risk_level != LOW),
        unreviewed_alerts=count(Transaction.risk_level != LOW, Transaction.reviewed.is_(False)),
    )
