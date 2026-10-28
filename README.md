# PayFlow

A **fictional** payment processing and transaction monitoring backend. It does not use real card data and does not represent any real payment network's protocols.

## Run it
```bash
docker compose up --build        # API docs at http://localhost:8000/docs
# or locally
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && pytest -q
```

## Try it
```bash
curl -X POST localhost:8000/api/v1/transactions \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-key-0001' \
  -d '{"amount_cents":2599,"currency":"USD","merchant_id":"demo-merchant-001","payment_token":"tok_demo_123"}'
```
Re-sending the same key returns the original transaction (HTTP 200) instead of creating a second one.

Simulated behaviour via fictional tokens: `tok_*_insufficient` and `tok_*_blocked` are declined; `tok_demo_error` returns 503 (a processing error, not a decline).

## Design decisions
- **Layers:** routes (HTTP) -> services (payment + risk rules) -> models (persistence).
- **Idempotency:** required `Idempotency-Key` header, enforced by a DB unique constraint. A concurrent duplicate hits `IntegrityError` and returns the winner. Reusing a key with a different payload returns 409.
- **Money:** integer cents end to end; floats are rejected by the schema.
- **Declines vs failures:** business declines are stored with a reason (201). Internal failures return 503 and store nothing, so retrying is safe.
- **Risk rules** (configurable in `core/config.py`): `LARGE_AMOUNT`, `VELOCITY`. One flag = MEDIUM, two = HIGH. Reasons are stored on the transaction.
- **Audit trail:** `transaction_events` records decisions, risk flags and reviews.
- **Tokens only:** payment tokens must match `tok_...`; real-looking card numbers are rejected.

## API
`POST/GET /api/v1/transactions`, `GET /api/v1/transactions/{id}`, `GET /api/v1/metrics/overview`, `GET /api/v1/alerts`, `POST /api/v1/alerts/{id}/review`, `GET /health`.

## Roadmap
React + TypeScript dashboard, seeded demo data, structured JSON logs, Kafka event stream.
