from sqlalchemy.orm import Session

from app.models.transaction import Merchant

DEMO_MERCHANTS = [
    ("demo-merchant-001", "Demo Coffee Co."),
    ("demo-merchant-002", "Demo Electronics"),
    ("demo-merchant-003", "Demo Travel"),
]


def seed_merchants(db: Session) -> None:
    for mid, name in DEMO_MERCHANTS:
        if not db.get(Merchant, mid):
            db.add(Merchant(id=mid, name=name))
    db.commit()
