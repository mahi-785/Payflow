import itertools

_n = itertools.count(1)


def pay(client, amount=2599, token="tok_demo_123", merchant="demo-merchant-001", key=None, **kw):
    key = key or f"key-{next(_n):06d}"
    body = {"amount_cents": amount, "currency": "USD", "merchant_id": merchant, "payment_token": token}
    return client.post("/api/v1/transactions", json={**body, **kw}, headers={"Idempotency-Key": key})


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_approved_and_retrievable(client):
    r = pay(client)
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "APPROVED" and body["amount_cents"] == 2599 and body["risk_level"] == "LOW"
    detail = client.get(f"/api/v1/transactions/{body['id']}").json()
    assert detail["events"][0]["event_type"] == "DECISION"


def test_declines_have_reasons(client):
    assert pay(client, token="tok_demo_insufficient").json()["decline_reason"] == "INSUFFICIENT_FUNDS"
    assert pay(client, token="tok_demo_blocked").json()["decline_reason"] == "CARD_BLOCKED"
    assert pay(client, amount=500_001).json()["decline_reason"] == "AMOUNT_EXCEEDS_LIMIT"
    assert pay(client, amount=500_000).json()["status"] == "APPROVED"  # boundary


def test_idempotent_replay_creates_one_row(client):
    first = pay(client, key="idem-key-0001")
    second = pay(client, key="idem-key-0001")
    assert (first.status_code, second.status_code) == (201, 200)
    assert first.json()["id"] == second.json()["id"]
    assert client.get("/api/v1/metrics/overview").json()["total_transactions"] == 1


def test_idempotency_key_reuse_with_different_payload_conflicts(client):
    pay(client, key="idem-key-0002")
    r = pay(client, amount=999, key="idem-key-0002")
    assert r.status_code == 409 and r.json()["detail"]["code"] == "IDEMPOTENCY_CONFLICT"


def test_validation_rejects_bad_input(client):
    assert pay(client, amount=25.99).status_code == 422      # floats rejected
    assert pay(client, amount=0).status_code == 422
    assert pay(client, amount=-5).status_code == 422
    assert pay(client, currency="usd").status_code == 422
    assert pay(client, token="4111111111111111").status_code == 422  # real-looking card number rejected
    assert pay(client, merchant="nope").json()["detail"]["code"] == "UNKNOWN_MERCHANT"
    r = client.post("/api/v1/transactions", json={"amount_cents": 100, "currency": "USD",
                    "merchant_id": "demo-merchant-001", "payment_token": "tok_x"})
    assert r.status_code == 422  # missing Idempotency-Key


def test_processing_error_is_503_and_retry_safe(client):
    r = pay(client, token="tok_demo_error", key="idem-key-0003")
    assert r.status_code == 503 and r.json()["detail"]["code"] == "PROCESSING_ERROR"
    assert client.get("/api/v1/metrics/overview").json()["total_transactions"] == 0


def test_large_amount_flagged(client):
    body = pay(client, amount=150_000).json()
    assert body["risk_level"] == "MEDIUM" and body["risk_reasons"] == ["LARGE_AMOUNT"]


def test_velocity_flagged_and_high_when_combined(client):
    for _ in range(3):
        assert pay(client, token="tok_fast").json()["risk_level"] == "LOW"
    fourth = pay(client, token="tok_fast").json()
    assert fourth["risk_reasons"] == ["VELOCITY"]
    both = pay(client, token="tok_fast", amount=200_000).json()
    assert both["risk_level"] == "HIGH" and set(both["risk_reasons"]) == {"VELOCITY", "LARGE_AMOUNT"}


def test_list_filter_paginate(client):
    pay(client); pay(client, token="tok_demo_insufficient"); pay(client, merchant="demo-merchant-002")
    page = client.get("/api/v1/transactions", params={"limit": 2}).json()
    assert page["total"] == 3 and len(page["items"]) == 2
    declined = client.get("/api/v1/transactions", params={"status": "declined"}).json()
    assert declined["total"] == 1
    m2 = client.get("/api/v1/transactions", params={"merchant_id": "demo-merchant-002"}).json()
    assert m2["total"] == 1
    assert client.get("/api/v1/transactions", params={"limit": 0}).status_code == 422


def test_metrics_use_integer_cents(client):
    pay(client, amount=1000); pay(client, amount=2599); pay(client, token="tok_demo_insufficient", amount=5000)
    m = client.get("/api/v1/metrics/overview").json()
    assert m["approved_volume_cents"] == 3599 and m["approval_rate"] == 0.6667 and m["declined"] == 1


def test_alert_review_flow(client):
    tx = pay(client, amount=150_000).json()
    pay(client)  # low risk, not an alert
    alerts = client.get("/api/v1/alerts", params={"reviewed": False}).json()
    assert [a["id"] for a in alerts] == [tx["id"]]
    assert client.post(f"/api/v1/alerts/{tx['id']}/review").json()["reviewed"] is True
    assert client.get("/api/v1/alerts", params={"reviewed": False}).json() == []
    events = client.get(f"/api/v1/transactions/{tx['id']}").json()["events"]
    assert events[-1]["event_type"] == "REVIEWED"
    assert client.get("/api/v1/metrics/overview").json()["unreviewed_alerts"] == 0
