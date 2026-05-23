from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .config import settings
from .routers import auth, password_reset, ledger, tasks, notes, vault, search, settings as settings_router, notifications
from .jobs.rollover_job import rollover_job
from .jobs.push_dispatcher import push_dispatcher

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(rollover_job, 'cron', hour=0, minute=0, id='rollover')
    scheduler.add_job(push_dispatcher, 'interval', seconds=60, id='push_dispatcher')
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
app.include_router(tasks.router, prefix="/api/v1/tasks")
app.include_router(notes.router, prefix="/api/v1/notes")
app.include_router(vault.router, prefix="/api/v1/vault")
app.include_router(search.router, prefix="/api/v1/search")
app.include_router(settings_router.router, prefix="/api/v1/settings")
app.include_router(notifications.router, prefix="/api/v1/notifications")


@app.get("/health")
async def health():
    return {"status": "ok"}
