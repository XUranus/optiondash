"""
Yahoo Finance data fetching with TTL caching and rate limiting.
"""

import logging
from datetime import datetime, timezone

import pandas as pd
import yfinance as yf

from config import Config
from utils.cache import cache
from utils.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)


# Map yfinance camelCase columns to snake_case for internal consistency
_COLUMN_MAP = {
    "contractsymbol": "contract_symbol",
    "lasttradedate": "last_trade_date",
    "strike": "strike",
    "lastprice": "last_price",
    "bid": "bid",
    "ask": "ask",
    "change": "change",
    "percentchange": "percent_change",
    "volume": "volume",
    "openinterest": "open_interest",
    "impliedvolatility": "implied_volatility",
    "inthemoney": "in_the_money",
    "contractsize": "contract_size",
    "currency": "currency",
}


def _normalize_columns(df: pd.DataFrame) -> None:
    """Rename DataFrame columns from yfinance camelCase to snake_case."""
    lowered = [c.lower().replace(" ", "_") for c in df.columns]
    mapped = [_COLUMN_MAP.get(c, c) for c in lowered]
    df.columns = mapped


def _ticker_obj(ticker: str) -> yf.Ticker:
    return yf.Ticker(ticker)


def get_ticker_info(ticker: str) -> dict:
    """Get current price, daily change, 52-week range for a ticker."""
    cache_key = f"ticker_info:{ticker}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    rate_limiter.wait()
    t = _ticker_obj(ticker)
    info = t.fast_info

    try:
        price = float(info.last_price)
        prev_close = float(info.previous_close) if info.previous_close else price
        daily_change = price - prev_close
        daily_change_pct = (daily_change / prev_close * 100) if prev_close else 0

        result = {
            "ticker": ticker,
            "spot_price": price,
            "daily_change": round(daily_change, 2),
            "daily_change_pct": round(daily_change_pct, 2),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        cache.set(cache_key, result)
        return result
    except Exception as e:
        logger.warning(f"Failed to get ticker info for {ticker}: {e}")
        # Return cached stale data if available, else raise
        if cached:
            return cached
        raise


def get_expirations(ticker: str) -> list[str]:
    """Get available option expiration dates."""
    cache_key = f"expirations:{ticker}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    rate_limiter.wait()
    t = _ticker_obj(ticker)
    try:
        expirations = list(t.options)
        cache.set(cache_key, expirations)
        return expirations
    except Exception as e:
        logger.warning(f"Failed to get expirations for {ticker}: {e}")
        if cached:
            return cached
        raise


def _nearest_expiration(ticker: str) -> str | None:
    """Pick the nearest expiration with >= 3 days to expiry."""
    exps = get_expirations(ticker)
    if not exps:
        return None
    today = datetime.now(timezone.utc).date()
    for exp in exps:
        exp_date = datetime.strptime(exp, "%Y-%m-%d").date()
        if (exp_date - today).days >= 3:
            return exp
    return exps[0]  # fallback to first


def get_options_chain(
    ticker: str, expiration: str | None = None
) -> dict:
    """
    Fetch the full options chain for a ticker.

    Returns dict with keys: calls (DataFrame), puts (DataFrame), spot_price, expiration
    """
    if expiration is None:
        expiration = _nearest_expiration(ticker)
    if expiration is None:
        raise ValueError(f"No valid expiration found for {ticker}")

    cache_key = f"chain:{ticker}:{expiration}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    rate_limiter.wait()
    t = _ticker_obj(ticker)

    try:
        chain = t.option_chain(expiration)
        spot = float(t.fast_info.last_price)
    except Exception as e:
        logger.error(f"Failed to fetch chain for {ticker} {expiration}: {e}")
        if cached:
            return cached
        raise

    calls = chain.calls.copy()
    puts = chain.puts.copy()

    # Normalize columns: yfinance uses camelCase
    _normalize_columns(calls)
    _normalize_columns(puts)

    result = {
        "ticker": ticker,
        "expiration": expiration,
        "spot_price": spot,
        "calls": calls,
        "puts": puts,
    }
    cache.set(cache_key, result)
    return result


def get_historical_prices(ticker: str, period: str = "90d") -> pd.DataFrame:
    """Get historical OHLCV data."""
    cache_key = f"hist_price:{ticker}:{period}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    rate_limiter.wait()
    t = _ticker_obj(ticker)
    try:
        df = t.history(period=period)
        cache.set(cache_key, df)
        return df
    except Exception as e:
        logger.warning(f"Failed to get historical prices for {ticker}: {e}")
        if cached is not None:
            return cached
        raise
