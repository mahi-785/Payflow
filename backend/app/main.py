import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, metrics, transactions
from app.core.config import settings
from app.db.seed import seed_merchants
from app.db.session import Base, SessionLocal, engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_merchants(db)
    yield


app = FastAPI(title="PayFlow", version="0.1.0", lifespan=lifespan,
              description="Fictional payment simulator. Not a real payment network.")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins,
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(transactions.router)
app.include_router(metrics.router)
app.include_router(alerts.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
