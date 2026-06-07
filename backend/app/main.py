"""
app/main.py
────────────
Entry point for the Sellora FastAPI backend.

This file:
1. Creates the FastAPI application instance
2. Configures CORS (which frontends can call this API)
3. Registers all route modules (auth, stores, products etc.)
4. Manages database startup and shutdown via lifespan

To run the server:
    uvicorn app.main:app --reload --port 8000

API docs available at:
    http://localhost:8000/docs     (Swagger UI)
    http://localhost:8000/redoc    (ReDoc)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, get_engine, get_session_factory
import app.core.database as db_module
from app.api.routes import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages startup and shutdown events for the application.

    This replaces the deprecated @app.on_event("startup") pattern.
    Code before 'yield' runs on startup, code after runs on shutdown.

    On startup:
    - Creates the database engine with connection pool
    - Creates session factory for generating DB sessions
    - Creates all database tables that don't exist yet
      (safe to run on every startup — won't drop existing tables)

    On shutdown:
    - Disposes the engine, closing all pooled connections cleanly
    """
    # ── STARTUP ───────────────────────────────────────────────────
    # Create database engine using URL from settings
    engine = get_engine(settings.DATABASE_URL)

    # Store engine and session factory in the database module
    # so get_db() can access them as module-level variables
    db_module.engine = engine
    db_module.AsyncSessionFactory = get_session_factory(engine)

    # Create all tables defined in models that don't exist yet.
    # checkfirst=True is implicit — won't fail if tables exist.
    # In production, use Alembic migrations instead.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Database connected and tables created")

    yield  # App is now running and serving requests

    # ── SHUTDOWN ──────────────────────────────────────────────────
    # Release all database connections back to the pool
    # and close the pool itself cleanly
    await engine.dispose()
    print("🔌 Database disconnected")


# ── App Instance ──────────────────────────────────────────────────
app = FastAPI(
    title="Sellora API",
    description="AI-powered social commerce platform for African sellers",
    version="2.0.0",
    lifespan=lifespan,  # Register our startup/shutdown handler
)


# ── CORS Middleware ───────────────────────────────────────────────
# CORS controls which websites can call this API.
# Without this, browser security blocks frontend requests.
# In production, replace with the actual deployed frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # From .env ALLOWED_ORIGINS
    allow_credentials=True,    # Allows cookies and auth headers
    allow_methods=["*"],       # Allow GET, POST, PUT, DELETE etc.
    allow_headers=["*"],       # Allow all headers including Authorization
)


# ── Route Registration ────────────────────────────────────────────
# All routes get the /api prefix so they don't conflict with
# any frontend routes if ever served from the same domain.
API_PREFIX = "/api"

# Auth routes: /api/auth/signup, /api/auth/login, etc.
app.include_router(auth.router, prefix=API_PREFIX)

# More routers will be added here as we build them:
# app.include_router(stores.router, prefix=API_PREFIX)
# app.include_router(products.router, prefix=API_PREFIX)
# app.include_router(orders.router, prefix=API_PREFIX)


# ── Health Check ─────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    """
    Simple health check endpoint.
    Returns app info to confirm the server is running.
    Useful for deployment health checks and monitoring.
    """
    return {
        "app": "Sellora API v2",
        "status": "running",
        "environment": settings.APP_ENV,
        "docs": "/docs",
    }