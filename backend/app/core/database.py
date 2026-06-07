"""
app/core/database.py
─────────────────────
Database connection setup using SQLAlchemy async engine.

Architecture:
- Uses asyncpg driver for high-performance async PostgreSQL
- AsyncSession ensures non-blocking database queries
- All models inherit from Base to get auto table creation
- get_db() is a FastAPI dependency injected into every route
  that needs database access

Usage in routes:
    async def my_route(db: AsyncSession = Depends(get_db)):
        result = await db.execute(select(User))
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    Every model (User, Store, Product etc.) inherits from this.
    It enables automatic table creation via metadata.create_all()
    """
    pass


def get_engine(database_url: str):
    """
    Create the async database engine.

    pool_pre_ping=True — tests connection before using it,
    prevents 'connection already closed' errors after idle periods.

    echo=True — logs all SQL queries to console in development.
    Set to False in production for cleaner logs.
    """
    return create_async_engine(
        database_url,
        echo=True,        # Log SQL queries (disable in production)
        pool_pre_ping=True,  # Verify connection health before use
    )


def get_session_factory(engine):
    """
    Create a factory that produces AsyncSession instances.

    expire_on_commit=False — keeps model attributes accessible
    after committing without needing to refresh from database.
    This is important for returning data in API responses.
    """
    return sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


# These are module-level variables initialized in main.py lifespan.
# They start as None and get assigned real values on app startup.
engine = None
AsyncSessionFactory = None


async def get_db():
    """
    FastAPI dependency that provides a database session per request.

    This is a generator function (uses yield) so FastAPI handles
    the lifecycle automatically:
    1. Creates a new session for each incoming request
    2. Commits if everything succeeds
    3. Rolls back if an exception occurs
    4. Always closes the session when done

    Usage:
        async def my_route(db: AsyncSession = Depends(get_db)):
    """
    async with AsyncSessionFactory() as session:
        try:
            yield session           # Hand session to the route
            await session.commit()  # Save changes if no errors
        except Exception:
            await session.rollback()  # Undo changes on error
            raise                     # Re-raise so FastAPI handles it
        finally:
            await session.close()   # Always release the connection