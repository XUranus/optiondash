"""
Token bucket rate limiter for API calls.
"""

import threading
import time

from config import Config


class RateLimiter:
    """Token bucket rate limiter."""

    def __init__(self, rate: float = None):
        """
        Args:
            rate: Maximum requests per second.
        """
        self._rate = rate or Config.RATE_LIMIT_RPS
        self._tokens = self._rate
        self._max_tokens = self._rate
        self._last_refill = time.monotonic()
        self._lock = threading.Lock()

    def _refill(self):
        """Refill tokens based on elapsed time."""
        now = time.monotonic()
        elapsed = now - self._last_refill
        self._tokens = min(self._max_tokens, self._tokens + elapsed * self._rate)
        self._last_refill = now

    def acquire(self, timeout: float = 10.0) -> bool:
        """
        Acquire a token, blocking until one is available or timeout.

        Args:
            timeout: Maximum time to wait in seconds.

        Returns:
            True if token acquired, False if timed out.
        """
        deadline = time.monotonic() + timeout
        while True:
            with self._lock:
                self._refill()
                if self._tokens >= 1.0:
                    self._tokens -= 1.0
                    return True

            if time.monotonic() >= deadline:
                return False

            # Sleep briefly before retrying
            time.sleep(0.05)

    def wait(self):
        """Acquire a token, blocking indefinitely."""
        self.acquire(timeout=float("inf"))


# Module-level shared rate limiter
rate_limiter = RateLimiter()
