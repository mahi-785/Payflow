"""Seed clearly fictional demo transactions: `python -m scripts.seed_demo` (run from backend/)."""
import random
from datetime import timedelta

from app.db.seed import seed_merchants
from app.db.session import Base, SessionLocal, engine
from app.models.transaction import utcnow
from app.schemas.transaction import TransactionCreate
from app.services.payment_engine import IdempotencyConflict, ProcessingError, process_payment

rng = random.Random(42)  # deterministic, so re-running is a no-op
MERCHANTS = ["demo-merchant-001", "demo-merchant-002", "demo-merchant-003"]


def main() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_merchants(db)
        plan = []
        for i in range(70):
            r = rng.random()
            token = f"tok_demo_{rng.randrange(40):02d}"
            amount = rng.randrange(500, 30_000)
            if r < 0.12: token += "_insufficient"
            elif r < 0.17: token += "_blocked"
            elif r < 0.22: amount = rng.randrange(100_000, 480_000)   # large -> risk flag
            elif r < 0.24: amount = rng.randrange(500_001, 700_000)   # over limit -> decline
            plan.append((f"seed-{i:04d}", token, amount))
        plan += [(f"seed-burst-{i}", "tok_demo_burst", 1500) for i in range(5)]  # velocity alert
        made = 0
        for key, token, amount in plan:
            data = TransactionCreate(amount_cents=amount, currency="USD",
                                     merchant_id=rng.choice(MERCHANTS), payment_token=token)
            try:
                tx, created = process_payment(db, data, key)
            except (IdempotencyConflict, ProcessingError):
                continue
            if created and not key.startswith("seed-burst"):
                tx.created_at = utcnow() - timedelta(minutes=rng.randrange(0, 12 * 60))
                db.commit()
            made += created
        print(f"Seeded {made} new transactions.")


if __name__ == "__main__":
    main()
