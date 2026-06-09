"""
Import all models here so SQLAlchemy can discover them
and create their tables on startup.
"""

from app.models.user import User                          # noqa: F401
from app.models.store import Store                        # noqa: F401
from app.models.product import Product                    # noqa: F401
from app.models.order import Order                        # noqa: F401
from app.models.abandoned_interest import AbandonedInterest  # noqa: F401