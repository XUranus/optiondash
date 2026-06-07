"""
Macro-economic indicator data fetching with TTL caching and rate limiting.
"""

import logging
from datetime import datetime, timezone

import pandas as pd
import yfinance as yf

from config import Config
from utils.cache import cache
from utils.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)


def get_macro_indicator(symbol: str) -> dict:
    """Get the current value for a single macro indicator symbol."""
    cache_key = f"macro:{symbol}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    rate_limiter.wait()
    t = yf.Ticker(symbol)

    try:
        price = float(t.fast_info.last_price)
        result = {
            "symbol": symbol,
            "value": round(price, 2),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        cache.set(cache_key, result)
        return result
    except Exception as e:
        logger.warning(f"Failed to fetch macro indicator {symbol}: {e}")
        if cached:
            return cached
        raise


def get_macro_current() -> dict:
    """
    Fetch all macro indicators and compute derived values.
    Returns the full current snapshot.
    """
    indicators = {}
    for name, symbol in Config.MACRO_SYMBOLS.items():
        try:
            result = get_macro_indicator(symbol)
            indicators[name.lower()] = result["value"]
        except Exception as e:
            logger.error(f"Macro indicator {name} ({symbol}) failed: {e}")
            indicators[name.lower()] = None

    # Compute 10Y-3M spread
    tnx_val = indicators.get("tnx")
    irx_val = indicators.get("irx")
    indicators["spread_10y3m"] = round(tnx_val - irx_val, 2) if (tnx_val is not None and irx_val is not None) else None

    return {
        "indicators": indicators,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def get_macro_history(symbol: str, period: str = "90d") -> pd.DataFrame:
    """Get historical OHLCV data for a macro indicator."""
    cache_key = f"macro_hist:{symbol}:{period}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    rate_limiter.wait()
    t = yf.Ticker(symbol)

    try:
        df = t.history(period=period)
        cache.set(cache_key, df)
        return df
    except Exception as e:
        logger.warning(f"Failed to get macro history for {symbol}: {e}")
        if cached is not None:
            return cached
        raise
