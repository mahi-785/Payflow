from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.transaction import HIGH, LOW, MEDIUM, Transaction, utcnow
from app.schemas.transaction import TransactionCreate

LARGE_AMOUNT = "LARGE_AMOUNT"
VELOCITY = "VELOCITY"


def assess(db: Session, data: TransactionCreate) -> tuple[str, list[str]]:
    """Return (risk_level, reasons). Each triggered rule adds an explainable reason."""
    reasons: list[str] = []
    if data.amount_cents >= settings.large_amount_cents:
        reasons.append(LARGE_AMOUNT)

    cutoff = utcnow() - timedelta(seconds=settings.velocity_window_seconds)
    prior = db.scalar(
        select(func.count(Transaction.id)).where(
            Transaction.payment_token == data.payment_token,
            Transaction.created_at >= cutoff,
        )
    )
    if prior >= settings.velocity_max_prior:
        reasons.append(VELOCITY)

    level = LOW if not reasons else MEDIUM if len(reasons) == 1 else HIGH
    return level, reasons
