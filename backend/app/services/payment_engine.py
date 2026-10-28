import logging

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.transaction import APPROVED, DECLINED, Merchant, Transaction, TransactionEvent
from app.schemas.transaction import TransactionCreate
from app.services import risk_engine

log = logging.getLogger("payflow.engine")


class UnknownMerchant(Exception): ...
class IdempotencyConflict(Exception): ...
class ProcessingError(Exception):
    """Internal failure -- distinct from a business decline."""


def _decide(data: TransactionCreate) -> tuple[str, str | None]:
    """Simulated authorization. Behaviour is driven by fictional token suffixes."""
    if data.payment_token == "tok_demo_error":
        raise ProcessingError("simulated processor outage")
    if data.payment_token.endswith("_insufficient"):
        return DECLINED, "INSUFFICIENT_FUNDS"
    if data.payment_token.endswith("_blocked"):
        return DECLINED, "CARD_BLOCKED"
    if data.amount_cents > settings.max_amount_cents:
        return DECLINED, "AMOUNT_EXCEEDS_LIMIT"
    return APPROVED, None


def _matches(tx: Transaction, d: TransactionCreate) -> bool:
    return (tx.amount_cents, tx.currency, tx.merchant_id, tx.payment_token) == (
        d.amount_cents, d.currency, d.merchant_id, d.payment_token)


def _replay(tx: Transaction, data: TransactionCreate) -> tuple[Transaction, bool]:
    if not _matches(tx, data):
        raise IdempotencyConflict("Idempotency-Key already used with a different payload")
    return tx, False


def _find(db: Session, key: str) -> Transaction | None:
    return db.scalar(select(Transaction).where(Transaction.idempotency_key == key))


def process_payment(db: Session, data: TransactionCreate, key: str) -> tuple[Transaction, bool]:
    """Returns (transaction, created). created=False means an idempotent replay."""
    if (existing := _find(db, key)):
        return _replay(existing, data)

    merchant = db.get(Merchant, data.merchant_id)
    if not merchant or not merchant.active:
        raise UnknownMerchant(data.merchant_id)

    try:
        status, reason = _decide(data)
    except ProcessingError:
        log.error("processing_failed key=%s merchant=%s", key, data.merchant_id)
        raise
    level, risk_reasons = risk_engine.assess(db, data)

    tx = Transaction(
        amount_cents=data.amount_cents, currency=data.currency, merchant_id=data.merchant_id,
        payment_token=data.payment_token, status=status, decline_reason=reason,
        risk_level=level, risk_reasons=risk_reasons, idempotency_key=key,
    )
    tx.events.append(TransactionEvent(event_type="DECISION", detail=reason or status))
    if risk_reasons:
        tx.events.append(TransactionEvent(event_type="RISK_FLAGGED", detail=",".join(risk_reasons)))
    db.add(tx)
    try:
        db.commit()  # unique constraint on idempotency_key is the real concurrency guard
    except IntegrityError:
        db.rollback()
        winner = _find(db, key)
        if winner is None:
            raise
        return _replay(winner, data)
    log.info("txn id=%s status=%s risk=%s", tx.id, tx.status, tx.risk_level)
    return tx, True
