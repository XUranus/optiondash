"""
TTL cache wrapper using cachetools.
"""

from cachetools import TTLCache

from config import Config


class CacheManager:
    """Simple TTL cache manager for market data."""

    def __init__(self, maxsize: int = None, ttl: int = None):
        self._cache = TTLCache(
            maxsize=maxsize or Config.CACHE_MAX_SIZE,
            ttl=ttl or Config.CACHE_TTL,
        )

    def get(self, key: str):
        """Get a value from cache. Returns None if not found or expired."""
        return self._cache.get(key)

    def set(self, key: str, value):
        """Set a value in cache."""
        self._cache[key] = value

    def delete(self, key: str):
        """Delete a value from cache."""
        self._cache.pop(key, None)

    def clear(self):
        """Clear all cached values."""
        self._cache.clear()

    def has(self, key: str) -> bool:
        """Check if a key exists and is not expired."""
        return key in self._cache


# Module-level shared cache instance
cache = CacheManager()
