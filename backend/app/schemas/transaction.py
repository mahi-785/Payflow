from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, StrictInt


class TransactionCreate(BaseModel):
    amount_cents: StrictInt = Field(gt=0, le=100_000_000)  # StrictInt rejects 25.99
    currency: str = Field(pattern=r"^[A-Z]{3}$", examples=["USD"])
    merchant_id: str = Field(min_length=1, max_length=64)
    payment_token: str = Field(min_length=1, max_length=64, pattern=r"^tok_[A-Za-z0-9_]+$")


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    event_type: str
    detail: str
    created_at: datetime


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    amount_cents: int
    currency: str
    merchant_id: str
    payment_token: str
    status: Literal["APPROVED", "DECLINED"]
    decline_reason: str | None
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    risk_reasons: list[str]
    reviewed: bool
    created_at: datetime


class TransactionDetail(TransactionOut):
    events: list[EventOut]


class TransactionPage(BaseModel):
    items: list[TransactionOut]
    total: int
    limit: int
    offset: int


class OverviewMetrics(BaseModel):
    total_transactions: int
    approved: int
    declined: int
    approval_rate: float
    decline_rate: float
    approved_volume_cents: int
    flagged_count: int
    unreviewed_alerts: int
