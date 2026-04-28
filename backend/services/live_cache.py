"""
Live cache backed by SQLite — pre-fetched data to accelerate API responses.

The background poller populates this table. API endpoints read from it first,
falling back to direct yfinance calls if the cache is stale or missing.
"""

import json
import logging
from datetime import datetime, timedelta, timezone

from config import Config
from database.connection import db

logger = logging.getLogger(__name__)


def get_cached(ticker: str, cache_key: str) -> dict | None:
    """Retrieve a cached payload. Returns None if not found or stale."""
    row = db.execute_one(
        "SELECT data_json, updated_at FROM live_cache WHERE ticker = ? AND cache_key = ?",
        (ticker.upper(), cache_key),
    )
    if not row:
        return None

    # Check staleness
    updated_at = datetime.fromisoformat(row["updated_at"])
    age = (datetime.now(timezone.utc) - updated_at).total_seconds()
    if age > Config.LIVE_CACHE_TTL_SEC:
        return None

    try:
        return json.loads(row["data_json"])
    except json.JSONDecodeError:
        logger.warning(f"Corrupt cache entry for {ticker}/{cache_key}")
        return None


def set_cached(ticker: str, cache_key: str, data: dict) -> None:
    """Store a payload in the live cache."""
    try:
        data_json = json.dumps(data, default=str)
        db.execute(
            "INSERT OR REPLACE INTO live_cache (ticker, cache_key, data_json, updated_at) "
            "VALUES (?, ?, ?, ?)",
            (ticker.upper(), cache_key, data_json, datetime.now(timezone.utc).isoformat()),
        )
    except Exception:
        logger.exception(f"Failed to write cache for {ticker}/{cache_key}")


def is_fresh(ticker: str, cache_key: str) -> bool:
    """Check if a cache entry exists and is within TTL."""
    row = db.execute_one(
        "SELECT updated_at FROM live_cache WHERE ticker = ? AND cache_key = ?",
        (ticker.upper(), cache_key),
    )
    if not row:
        return False
    updated_at = datetime.fromisoformat(row["updated_at"])
    age = (datetime.now(timezone.utc) - updated_at).total_seconds()
    return age <= Config.LIVE_CACHE_TTL_SEC


def cleanup_old() -> int:
    """Delete cache entries older than the retention period. Returns count deleted."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=Config.LIVE_CACHE_RETENTION_DAYS)).isoformat()
    with db.get_cursor() as cursor:
        cursor.execute("DELETE FROM live_cache WHERE updated_at < ?", (cutoff,))
        deleted = cursor.rowcount
    if deleted:
        logger.info(f"Cleaned up {deleted} stale live_cache entries")
    return deleted
