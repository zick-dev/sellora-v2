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
from app.api.routes import auth, store, products, orders, abandoned


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


# Create FastAPI instance FIRST before any include_router calls
app = FastAPI(
    title="Sellora API",
    description="AI-powered social commerce for African sellers",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes — all prefixed with /api
API_PREFIX = "/api"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(store.router, prefix=API_PREFIX)
app.include_router(products.router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(abandoned.router, prefix=API_PREFIX)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": "Sellora API v2",
        "status": "running",
        "environment": settings.APP_ENV,
        "docs": "/docs",
    }