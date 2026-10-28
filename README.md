# PayFlow — Payment Processing & Risk Monitoring

PayFlow is a full-stack payment processing simulator built to explore how transaction systems handle payment requests, prevent duplicate processing, detect potentially suspicious activity, and provide visibility into payment operations through an interactive dashboard.

The project combines a **FastAPI backend, a persistent database, rule-based risk detection, and a React dashboard** to demonstrate core concepts in reliable backend engineering.

> **Note:** PayFlow is an educational simulation. It does not process real payments, connect to Visa or any payment network, or determine actual financial fraud.

## Features

- **Payment Simulation:** Submit payment requests and simulate outcomes such as approvals, declines, blocked transactions, and processing errors.
- **Idempotent Requests:** Use idempotency keys to ensure that retrying the same request returns the original result instead of creating a duplicate transaction.
- **Transaction Monitoring:** Browse transactions, filter results, and inspect individual transaction details.
- **Rule-Based Risk Detection:** Flag configurable patterns such as unusually large payments and bursts of transaction activity.
- **Audit Trail:** Inspect recorded transaction events to understand how a transaction was processed.
- **Interactive Dashboard:** View transaction metrics, approval and decline rates, activity charts, and recent risk alerts.
- **Risk Alert Review:** Review flagged activity and mark alerts as reviewed.
- **Demo Data:** Seed the database with fictional transactions to explore the dashboard without manually creating every record.
- **Automated Backend Tests:** Validate core API behavior with pytest.

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Python, FastAPI |
| Database | SQLite for local development; SQLAlchemy ORM |
| Frontend | React, TypeScript, Vite |
| API | REST, JSON |
| Testing | pytest, FastAPI TestClient |
| Development | Git, npm, Python virtual environment |

*Use only the technologies present in the current repository. If your project also supports PostgreSQL or additional tools, update this table accordingly.*

## Architecture

```text
┌──────────────────────────────┐
│       React Dashboard        │
│                              │
│ Overview · Transactions      │
│ Risk Alerts · Simulation    │
└──────────────┬───────────────┘
               │ HTTP / JSON
               ▼
┌──────────────────────────────┐
│       FastAPI Backend        │
│                              │
│ Payment Simulation           │
│ Idempotency Handling         │
│ Risk Detection Rules         │
│ Transaction & Audit APIs     │
└──────────────┬───────────────┘
               │ SQLAlchemy
               ▼
┌──────────────────────────────┐
│          Database            │
│                              │
│ Transactions · Events        │
│ Risk Alerts                  │
└──────────────────────────────┘
```

The frontend communicates with the backend through API requests. The backend applies the transaction-processing and risk rules, persists records in the database, and returns data for the dashboard to display.

## Getting Started

### Prerequisites

Install the following:

- Python 3
- Node.js and npm
- Git

Docker is not required for the local development workflow described below.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/payflow.git
cd payflow
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

### 3. Seed the demo database

Run the seed script from the `backend` directory:

```bash
DATABASE_URL=sqlite:///./payflow.db python -m scripts.seed_demo
```

The script populates the local database with fictional transaction data for dashboard exploration. It is designed to be safe to rerun without repeatedly adding the same demo dataset.

### 4. Start the backend server

In the same terminal, run:

```bash
DATABASE_URL=sqlite:///./payflow.db python -m uvicorn app.main:app --reload
```

The backend should be available at:

- API base URL: http://localhost:8000
- Interactive API documentation: http://localhost:8000/docs
- OpenAPI schema: http://localhost:8000/openapi.json

Keep this terminal running.

### 5. Set up the frontend

Open a second terminal window:

```bash
cd ~/Downloads/payflow/frontend
npm install
npm run dev
```

If you cloned the repository to a different location, replace the path with your actual project location.

Open the dashboard at:

**http://localhost:5173**

The Vite development server is configured to forward `/api` requests to the FastAPI backend. Both servers must remain running while you use the application.

If `npm` is unavailable on macOS, install Node.js with Homebrew:

```bash
brew install node
```

## Exploring the Dashboard

### Overview
View transaction statistics, approved transaction volume, approval and decline rates, hourly activity, and recent risk alerts.

### Transactions
Browse and filter transactions by supported criteria. Select a transaction to inspect its details and recorded event history.

### Risk Alerts
Review alerts generated by the configured risk rules, understand why each transaction was flagged, and mark alerts as reviewed.

### Simulate
Submit fictional payment requests and explore different processing outcomes, including successful payments, insufficient funds, blocked transactions, large amounts, over-limit scenarios, and processing errors.

### Idempotency Demonstration
1. Submit a simulated payment with an idempotency key.
2. Submit the same request again using the same key.
3. Inspect the response and transaction records.
4. Verify that the retry returns the original result rather than creating another transaction.

This demonstrates an important reliability concept: clients may retry requests when a network response is delayed or lost, so payment systems need a strategy for avoiding duplicate processing.

## Testing

Run the backend test suite from the `backend` directory with your virtual environment activated:

```bash
python -m pytest -q
```

The current development version has passed 12 backend tests. Run the suite again after making changes to verify the current state of the project.

## Current Scope and Limitations

PayFlow is a learning project focused on payment-system concepts and full-stack development.

- Transactions are simulated; no real money moves.
- Risk detection uses predefined rules, not a trained machine-learning fraud model.
- The dashboard is intended for local development and demonstration.
- Frontend automated tests and table sorting are not yet implemented.
- Structured JSON logging and database migration tooling are planned improvements.
- Concurrent duplicate-request behavior still needs dedicated automated testing.
- Docker support should be treated as unverified until tested.

## Future Improvements

- Add automated frontend tests.
- Implement transaction sorting and more advanced filtering.
- Add structured JSON logs and request tracing.
- Introduce Alembic database migrations.
- Test idempotency under concurrent requests.
- Add monitoring and performance tests.
- Evaluate event-driven processing for higher-volume transaction workloads.

## Why PayFlow?

PayFlow is an opportunity to explore engineering challenges that appear in payment and financial technology systems: reliable request handling, database persistence, duplicate prevention, transaction observability, and rule-based risk monitoring.

The goal is not to recreate a production payment network, but to build a working, testable simulation that makes these concepts concrete.

---

**Built as a software engineering portfolio project.**
