"""
Summary Dashboard API blueprint.
"""

import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from config import Config
from services.live_cache import get_cached
from services.market_data import get_ticker_info, get_options_chain, get_expirations
from services.greeks_engine import compute_chain_greeks
from services.max_pain import calculate_max_pain
from services.pcr import calculate_pcr
from services.gex import calculate_gex
from services.volatility import calculate_atm_iv
from utils.errors import error_response, ticker_not_supported, data_source_error

logger = logging.getLogger(__name__)

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard/summary", methods=["GET"])
def dashboard_summary():
    """Get core indicator overview for a ticker."""
    ticker = request.args.get("ticker", "SPY").upper()
    expiration = request.args.get("expiration")

    if ticker not in Config.SUPPORTED_TICKERS:
        return ticker_not_supported(ticker)

    # 1. Try live cache
    cached = get_cached(ticker, "summary")
    if cached:
        if not expiration or cached.get("expiration_used") == expiration:
            return jsonify(cached)

    # 2. Fall back to direct fetch
    try:
        info = get_ticker_info(ticker)
        chain = get_options_chain(ticker, expiration)
        chain = compute_chain_greeks(chain)

        calls = chain["calls"]
        puts = chain["puts"]

        max_pain_result = calculate_max_pain(calls, puts)
        pcr_result = calculate_pcr(calls, puts)
        gex_result = calculate_gex(calls, puts, chain["spot_price"])
        atm_iv = calculate_atm_iv(calls, puts, chain["spot_price"])
        deviation = round(chain["spot_price"] - max_pain_result["max_pain_strike"], 2)

        return jsonify({
            "ticker": ticker,
            "spot_price": chain["spot_price"],
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
            "expiration_used": chain["expiration"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.exception(f"Dashboard summary failed for {ticker}")
        return data_source_error(ticker, "dashboard_summary", e)


@dashboard_bp.route("/api/dashboard/expirations", methods=["GET"])
def dashboard_expirations():
    """Get available expiration dates for a ticker."""
    ticker = request.args.get("ticker", "SPY").upper()

    if ticker not in Config.SUPPORTED_TICKERS:
        return ticker_not_supported(ticker)

    # 1. Try live cache
    cached = get_cached(ticker, "expirations")
    if cached:
        return jsonify(cached)

    # 2. Fall back to direct fetch
    try:
        exps = get_expirations(ticker)
        return jsonify({"ticker": ticker, "expirations": exps})
    except Exception as e:
        logger.exception(f"Expirations fetch failed for {ticker}")
        return data_source_error(ticker, "expirations", e)
