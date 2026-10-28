# PayFlow — Payment Processing & Transaction Monitoring

**PayFlow** is a fictional payment processing backend built to explore transaction reliability, idempotent API design, risk detection, and operational monitoring. It simulates payment authorization and decline scenarios, detects suspicious transaction patterns using configurable rules, and maintains an audit trail of transaction decisions.

> **Disclaimer:** PayFlow is an educational simulation. It does not process real payments, use real card data, or implement any real payment network's protocols.

## Key Features

- **Payment Processing API:** Submit simulated payments and retrieve transaction records through REST endpoints.
- **Idempotent Requests:** Prevent duplicate transactions when clients retry requests, including concurrent requests.
- **Rule-Based Risk Detection:** Flag large transactions and high transaction velocity with explainable risk levels and reasons.
- **Transaction Auditing:** Record processing decisions, risk flags, and review actions in an event log.
- **Reliable Error Handling:** Distinguish business declines from internal processing failures, with safe retry behavior.
- **Input Validation:** Use fictional payment tokens and reject real-looking card numbers.
- **Transaction Monitoring:** Expose endpoints for transaction history, operational metrics, and risk alerts.
- **Automated Testing:** Use `pytest` to verify API behavior and important edge cases.

## Tech Stack

| Component | Technology |
|---|---|
| Language | Python |
| Backend | FastAPI |
| Database | SQLAlchemy |
| Validation | Pydantic |
| Testing | pytest |
| Infrastructure | Docker Compose |
| API Documentation | OpenAPI / Swagger UI |

## Getting Started

### Prerequisites

- Python 3.10 or newer, compatible with the project's dependencies
- Docker and Docker Compose, if running the containerized setup

### Option 1: Run with Docker

From the project root, run:

```bash
docker compose up --build
```

Once the application starts, open:

- **Interactive API documentation:** http://localhost:8000/docs
- **Health check:** http://localhost:8000/health

### Option 2: Run locally

Create a virtual environment and install the backend dependencies:

```bash
cd backend

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

Run the automated tests:

```bash
pytest -q
```

To start the API locally, run the following from the `backend` directory:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

## Try It Out

Submit a simulated payment using `curl`:

```bash
curl -X POST http://localhost:8000/api/v1/transactions \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-key-0001' \
  -d '{
    "amount_cents": 2599,
    "currency": "USD",
    "merchant_id": "demo-merchant-001",
    "payment_token": "tok_demo_123"
  }'
```

The request represents a fictional payment of **$25.99 USD**. The API returns the transaction result and its recorded details.

### Simulated Payment Scenarios

| Token | Simulated behavior |
|---|---|
| `tok_demo_123` | Standard simulated payment |
| `tok_demo_insufficient` | Business decline due to insufficient simulated funds |
| `tok_demo_blocked` | Business decline due to a blocked simulated token |
| `tok_demo_error` | Simulated processing failure returning HTTP 503 |

These are fictional test scenarios, not real payment authorization responses.

### Verify Idempotency

Send the same request again using the same `Idempotency-Key`.

- The original transaction is returned instead of creating a duplicate.
- A repeated request with the same key and a different payload returns HTTP 409.
- Concurrent requests using the same key are protected by a database uniqueness constraint.

This models an important reliability concern in payment systems: a client retry should not accidentally create a second transaction.

## Engineering Design Decisions

### 1. Layered Architecture

The backend separates HTTP handling, business logic, and persistence:

```text
API Routes
    |
    v
Service Layer
(Payment Processing & Risk Rules)
    |
    v
Database Models
    |
    v
Persistent Storage
```

This separation makes business rules easier to test, maintain, and extend independently of the API layer.

### 2. Idempotency and Concurrency

Every payment request requires an `Idempotency-Key`. A database uniqueness constraint protects against duplicate records, including concurrent requests. Reusing a key with a different payload is rejected with a conflict response.

### 3. Precise Monetary Calculations

All amounts are represented as integer cents rather than floating-point values. Request validation rejects floating-point monetary inputs, avoiding common precision issues in financial calculations.

### 4. Declines Versus Processing Failures

Business declines are recorded as transaction outcomes with explanatory reasons. Simulated internal processing failures return HTTP 503 without persisting a transaction, allowing the client to retry safely.

### 5. Explainable Risk Rules

Configurable rules identify suspicious transaction patterns, including:

- `LARGE_AMOUNT` — a transaction exceeds a configured amount threshold.
- `VELOCITY` — transaction activity exceeds a configured frequency threshold.

One triggered rule produces a `MEDIUM` risk level; two triggered rules produce a `HIGH` risk level. Risk reasons are stored alongside the transaction for transparency.

### 6. Auditability

The `transaction_events` table records transaction decisions, risk flags, and review actions. This provides a traceable history of important events for debugging and monitoring.

### 7. Input Validation and Safe Simulation

Payment tokens must follow the fictional `tok_...` format. Real-looking card numbers are rejected, and no real card credentials are required to explore the application.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/transactions` | Submit a simulated payment |
| `GET` | `/api/v1/transactions` | List and filter transactions |
| `GET` | `/api/v1/transactions/{id}` | Retrieve transaction details |
| `GET` | `/api/v1/metrics/overview` | Retrieve transaction metrics |
| `GET` | `/api/v1/alerts` | Retrieve risk alerts |
| `POST` | `/api/v1/alerts/{id}/review` | Record an alert review |
| `GET` | `/health` | Check API health |

For request schemas, response examples, and interactive endpoint testing, see the Swagger UI at `/docs`.

## Roadmap

Planned enhancements include:

- **React + TypeScript dashboard** for transaction analytics, search, and risk monitoring.
- **Seeded demo data** to make the application easy to explore locally.
- **Structured JSON logging** for improved debugging and operational visibility.
- **Kafka event streaming** to explore asynchronous transaction-event processing.

These enhancements are planned and are not represented as completed features.

## Project Goals

PayFlow is a portfolio project focused on practical software engineering concepts relevant to payment infrastructure:

- Designing reliable REST APIs.
- Handling retries, concurrency, and duplicate requests.
- Separating business declines from system failures.
- Writing testable business logic and automated tests.
- Building explainable risk rules and auditable transaction workflows.

