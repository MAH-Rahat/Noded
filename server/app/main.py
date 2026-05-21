from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .config import settings
from .routers import auth, password_reset, ledger

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Background jobs will be registered here in tasks 5.2 and 12.1
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="NodedAlright API",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(password_reset.router, prefix="/api/v1/auth")
app.include_router(ledger.router, prefix="/api/v1/ledger")


@app.get("/health")
async def health():
    return {"status": "ok"}
