"""
app/main.py
────────────
Entry point for the Sellora FastAPI backend.

To run:
    python -m uvicorn app.main:app --reload --port 8000

Docs:
    http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.database import Base, get_engine, get_session_factory
import app.core.database as db_module

# Import models so SQLAlchemy registers them for table creation
from app.models.user import User                              # noqa: F401
from app.models.store import Store                            # noqa: F401
from app.models.product import Product                        # noqa: F401
from app.models.order import Order                            # noqa: F401
from app.models.abandoned_interest import AbandonedInterest  # noqa: F401

# Import routers
from app.api.routes import auth, store, products, orders, abandoned, subscription , ai

# ── Rate limiter ──────────────────────────────────────────────────
# Limits requests per IP address to prevent brute force attacks
limiter = Limiter(key_func=get_remote_address)


# ── Request size limiter ──────────────────────────────────────────
# Rejects requests larger than 10MB to prevent DoS attacks
class LimitRequestSize(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.headers.get("content-length"):
            if int(request.headers["content-length"]) > 10_000_000:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request too large — max 10MB"}
                )
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # STARTUP
    engine = get_engine(settings.DATABASE_URL)
    db_module.engine = engine
    db_module.AsyncSessionFactory = get_session_factory(engine)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Database connected and tables created")
    yield

    # SHUTDOWN
    await engine.dispose()
    print("🔌 Database disconnected")


# ── Create FastAPI app ────────────────────────────────────────────
app = FastAPI(
    title="Sellora API",
    description="AI-powered social commerce for African sellers",
    version="2.0.0",
    lifespan=lifespan,
    # Hide docs in production
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ── Rate limiter ──────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Security headers ──────────────────────────────────────────────
# Added to every response to protect against common attacks
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    # Enable XSS filter in browsers
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Force HTTPS in production
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # Control referrer information
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Restrict browser features
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# ── CORS ──────────────────────────────────────────────────────────
# Only allow requests from our frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request size limit ────────────────────────────────────────────
app.add_middleware(LimitRequestSize)

# ── Routes ────────────────────────────────────────────────────────
API_PREFIX = "/api"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(store.router, prefix=API_PREFIX)
app.include_router(products.router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(abandoned.router, prefix=API_PREFIX)
app.include_router(subscription.router, prefix=API_PREFIX)
app.include_router(ai.router, prefix=API_PREFIX)


# ── Health check ──────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    """Health check — confirms server is running."""
    return {
        "app": "Sellora API v2",
        "status": "running",
        "environment": settings.APP_ENV,
        "docs": "/docs" if settings.DEBUG else "disabled",
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Dedicated health check for Railway deployment."""
    return {"status": "ok"}
