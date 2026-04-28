"""
Background poller: periodically fetches data from yfinance for all configured
tickers and stores it in the live_cache table. This keeps API responses fast
by avoiding on-demand yfinance calls.
"""

import logging
import traceback
from datetime import datetime, timezone

from config import Config
from services.market_data import (
    get_ticker_info,
    get_expirations,
    get_options_chain,
    get_historical_prices,
    _nearest_expiration,
)
from services.greeks_engine import compute_chain_greeks
from services.max_pain import calculate_max_pain
from services.pcr import calculate_pcr
from services.gex import calculate_gex, calculate_gex_distribution
from services.volatility import calculate_hv, calculate_atm_iv, calculate_vrp, calculate_skew_25d
from services.live_cache import set_cached, cleanup_old
from utils.cache import cache as mem_cache

logger = logging.getLogger(__name__)


def poll_all_tickers():
    """
    Fetch latest data for all configured tickers and store in live_cache.
    Called by the APScheduler background job on a regular interval.
    """
    logger.info(f"Starting background poll for {len(Config.SUPPORTED_TICKERS)} tickers")
    cleanup_old()

    for ticker in Config.SUPPORTED_TICKERS:
        try:
            _poll_ticker(ticker)
        except Exception:
            logger.error(f"Poll failed for {ticker}:\n{traceback.format_exc()}")


def _poll_ticker(ticker: str):
    """Poll a single ticker and cache all derived data."""

    # 1. Ticker info (spot price, daily change)
    try:
        info = get_ticker_info(ticker)
        set_cached(ticker, "info", info)
    except Exception as e:
        logger.warning(f"Poll: ticker info failed for {ticker}: {e}")
        return  # can't proceed without spot price

    # 2. Expirations
    try:
        exps = get_expirations(ticker)
        set_cached(ticker, "expirations", {"ticker": ticker, "expirations": exps})
    except Exception as e:
        logger.warning(f"Poll: expirations failed for {ticker}: {e}")
        return

    # 3. Option chain (nearest expiration)
    try:
        chain = get_options_chain(ticker)
        chain = compute_chain_greeks(chain)
        calls = chain["calls"]
        puts = chain["puts"]
        spot = chain["spot_price"]
        expiration = chain["expiration"]
    except Exception as e:
        logger.warning(f"Poll: option chain failed for {ticker}: {e}")
        return

    # 4. Compute core metrics
    try:
        max_pain_result = calculate_max_pain(calls, puts)
        pcr_result = calculate_pcr(calls, puts)
        gex_result = calculate_gex(calls, puts, spot)
        atm_iv = calculate_atm_iv(calls, puts, spot)
        deviation = round(spot - max_pain_result["max_pain_strike"], 2)

        summary = {
            "ticker": ticker,
            "spot_price": spot,
            "daily_change": info["daily_change"],
            "daily_change_pct": info["daily_change_pct"],
            "max_pain": max_pain_result["max_pain_strike"],
            "deviation_from_max_pain": deviation,
            "pcr": {
                "volume": pcr_result["pcr_volume"],
                "oi": pcr_result["pcr_oi"],
                "signal": pcr_result["signal"],
            },
            "gex": {
                "value": gex_result["value"],
                "formatted": gex_result["formatted"],
                "regime": gex_result["regime"],
            },
            "atm_iv": round(atm_iv, 4),
            "expiration_used": expiration,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        set_cached(ticker, "summary", summary)
    except Exception as e:
        logger.warning(f"Poll: summary computation failed for {ticker}: {e}")

    # 5. Strike-level data
    try:
        oi_col_c = _col(calls, ("open_interest",))
        oi_col_p = _col(puts, ("open_interest",))
        all_strikes = sorted(set(calls["strike"].tolist()) | set(puts["strike"].tolist()))
        call_oi_map = dict(zip(calls["strike"], calls[oi_col_c].fillna(0)))
        put_oi_map = dict(zip(puts["strike"], puts[oi_col_p].fillna(0)))

        oi_wall = {
            "ticker": ticker,
            "expiration": expiration,
            "spot_price": spot,
            "max_pain": max_pain_result["max_pain_strike"],
            "strikes": [round(s, 2) for s in all_strikes],
            "call_oi": [int(call_oi_map.get(s, 0)) for s in all_strikes],
            "put_oi": [int(put_oi_map.get(s, 0)) for s in all_strikes],
        }
        set_cached(ticker, "oi_wall", oi_wall)

        mp_curve = {
            "ticker": ticker,
            "expiration": expiration,
            "strikes": max_pain_result["strikes"],
            "total_loss": max_pain_result["total_loss"],
            "max_pain_strike": max_pain_result["max_pain_strike"],
        }
        set_cached(ticker, "max_pain_curve", mp_curve)

        gex_dist = calculate_gex_distribution(calls, puts, spot)
        gex_dist["ticker"] = ticker
        gex_dist["expiration"] = expiration
        gex_dist["spot_price"] = spot
        set_cached(ticker, "gex_distribution", gex_dist)
    except Exception as e:
        logger.warning(f"Poll: strike data failed for {ticker}: {e}")

    # 6. Historical prices (for HV computation)
    try:
        prices_df = get_historical_prices(ticker, period="90d")
        hv30 = calculate_hv(prices_df["Close"], window=30)
        vrp = calculate_vrp(atm_iv, hv30)
        skew = calculate_skew_25d(calls, puts, spot)

        vol_data = {
            "ticker": ticker,
            "atm_iv": round(atm_iv, 4),
            "hv30": round(hv30, 4),
            "vrp": round(vrp, 4),
            "skew_25d": skew,
        }
        set_cached(ticker, "volatility", vol_data)
    except Exception as e:
        logger.warning(f"Poll: volatility computation failed for {ticker}: {e}")

    # Also clear the in-memory cache so fresh data is picked up
    mem_cache.clear()

    logger.info(f"Poll complete for {ticker}: {len(all_strikes)} strikes, spot={spot}")


def _col(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    raise KeyError(f"None of {candidates} in {df.columns.tolist()}")
