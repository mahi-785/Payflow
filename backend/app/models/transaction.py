import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

APPROVED, DECLINED = "APPROVED", "DECLINED"
LOW, MEDIUM, HIGH = "LOW", "MEDIUM", "HIGH"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Merchant(Base):
    __tablename__ = "merchants"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    amount_cents: Mapped[int] = mapped_column(Integer)  # never floats
    currency: Mapped[str] = mapped_column(String(3))
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), index=True)
    payment_token: Mapped[str] = mapped_column(String(64), index=True)  # fictional token only
    status: Mapped[str] = mapped_column(String(16), index=True)
    decline_reason: Mapped[str | None] = mapped_column(String(64), nullable=True)
    risk_level: Mapped[str] = mapped_column(String(8), index=True)
    risk_reasons: Mapped[list] = mapped_column(JSON, default=list)
    reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    idempotency_key: Mapped[str] = mapped_column(String(128), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    events: Mapped[list["TransactionEvent"]] = relationship(
        order_by="TransactionEvent.id", cascade="all, delete-orphan"
    )


class TransactionEvent(Base):
    """Append-only audit trail of decisions and status changes."""
    __tablename__ = "transaction_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[str] = mapped_column(ForeignKey("transactions.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(32))
    detail: Mapped[str] = mapped_column(String(256), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
