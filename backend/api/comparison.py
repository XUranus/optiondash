"""
Multi-ticker Comparison API blueprint.
"""

import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from config import Config
from services.live_cache import get_cached
from services.market_data import get_ticker_info, get_options_chain
from services.greeks_engine import compute_chain_greeks
from services.max_pain import calculate_max_pain
from services.pcr import calculate_pcr
from services.gex import calculate_gex
from services.anomaly import detect_anomalies, get_historical_average
from database.connection import db
from utils.errors import error_response, data_source_error

logger = logging.getLogger(__name__)

comparison_bp = Blueprint("comparison", __name__)


@comparison_bp.route("/api/comparison/overview", methods=["GET"])
def comparison_overview():
    tickers_str = request.args.get("tickers", "SPY,QQQ,IWM")
    tickers = [t.strip().upper() for t in tickers_str.split(",") if t.strip()]
    expiration = request.args.get("expiration")

    # Filter to supported tickers only
    tickers = [t for t in tickers if t in Config.SUPPORTED_TICKERS]
    if not tickers:
        return error_response("no_valid_tickers",
            f"No valid tickers. Supported: {', '.join(Config.SUPPORTED_TICKERS)}",
            status=400)

    results = []
    for ticker in tickers:
        try:
            # Try live cache first
            cached = get_cached(ticker, "summary")
            if cached:
                row = _build_comparison_row_from_cache(ticker, cached)
                if row:
                    results.append(row)
                    continue

            # Fall back to direct fetch
            info = get_ticker_info(ticker)
            chain = get_options_chain(ticker, expiration)
            chain = compute_chain_greeks(chain)
            calls = chain["calls"]
            puts = chain["puts"]
            spot = chain["spot_price"]

            max_pain_result = calculate_max_pain(calls, puts)
            pcr_result = calculate_pcr(calls, puts)
            gex_result = calculate_gex(calls, puts, spot)
            deviation = round(spot - max_pain_result["max_pain_strike"], 2)

            hist_avg = get_historical_average(ticker, db)
            anomalies = detect_anomalies(
                ticker=ticker,
                pcr={"pcr_volume": pcr_result["pcr_volume"], "pcr_oi": pcr_result["pcr_oi"]},
                gex={"value": gex_result["value"]},
                daily_change_pct=info["daily_change_pct"],
                calls_oi=pcr_result["total_call_oi"],
                puts_oi=pcr_result["total_put_oi"],
                calls_vol=pcr_result["total_call_volume"],
                puts_vol=pcr_result["total_put_volume"],
                historical_avg=hist_avg,
            )

            results.append({
                "ticker": ticker,
                "spot_price": spot,
                "daily_change_pct": info["daily_change_pct"],
                "max_pain": max_pain_result["max_pain_strike"],
                "deviation_from_max_pain": deviation,
                "pcr": {"volume": pcr_result["pcr_volume"], "oi": pcr_result["pcr_oi"], "signal": pcr_result["signal"]},
                "gex": {"value": gex_result["value"], "formatted": gex_result["formatted"], "regime": gex_result["regime"]},
                "total_call_oi": pcr_result["total_call_oi"],
                "total_put_oi": pcr_result["total_put_oi"],
                "total_call_volume": pcr_result["total_call_volume"],
                "total_put_volume": pcr_result["total_put_volume"],
                "anomalies": anomalies,
            })
        except Exception as e:
            logger.warning(f"Comparison fetch failed for {ticker}: {e}")
            results.append({"ticker": ticker, "error": str(e), "anomalies": []})

    return jsonify({
        "data": results,
        "expiration_used": expiration or "nearest",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })


def _build_comparison_row_from_cache(ticker: str, cached: dict) -> dict | None:
    """Build a comparison row from a cached summary."""
    try:
        # Also check for anomalies using historical data
        hist_avg = get_historical_average(ticker, db)
        anomalies = detect_anomalies(
            ticker=ticker,
            pcr=cached.get("pcr", {}),
            gex=cached.get("gex", {}),
            daily_change_pct=cached.get("daily_change_pct", 0),
            calls_oi=0,
            puts_oi=0,
            calls_vol=0,
            puts_vol=0,
            historical_avg=hist_avg,
        )
        return {
            "ticker": ticker,
            "spot_price": cached["spot_price"],
            "daily_change_pct": cached.get("daily_change_pct", 0),
            "max_pain": cached["max_pain"],
            "deviation_from_max_pain": cached.get("deviation_from_max_pain", 0),
            "pcr": cached.get("pcr", {}),
            "gex": cached.get("gex", {}),
            "total_call_oi": 0,
            "total_put_oi": 0,
            "total_call_volume": 0,
            "total_put_volume": 0,
            "anomalies": anomalies,
        }
    except Exception:
        return None
