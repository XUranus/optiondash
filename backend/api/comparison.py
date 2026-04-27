"""
Multi-ticker Comparison API blueprint.
"""

import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from services.market_data import get_ticker_info, get_options_chain
from services.greeks_engine import compute_chain_greeks
from services.max_pain import calculate_max_pain
from services.pcr import calculate_pcr
from services.gex import calculate_gex
from services.anomaly import detect_anomalies, get_historical_average
from database.connection import db

logger = logging.getLogger(__name__)

comparison_bp = Blueprint("comparison", __name__)


@comparison_bp.route("/api/comparison/overview", methods=["GET"])
def comparison_overview():
    """Multi-ticker comparison overview."""
    tickers_str = request.args.get("tickers", "SPY,QQQ,IWM")
    tickers = [t.strip().upper() for t in tickers_str.split(",") if t.strip()]
    expiration = request.args.get("expiration")

    results = []
    for ticker in tickers:
        try:
            info = get_ticker_info(ticker)
            chain = get_options_chain(ticker, expiration)
            chain = compute_chain_greeks(chain)

            calls = chain["calls"]
            puts = chain["puts"]

            max_pain_result = calculate_max_pain(calls, puts)
            pcr_result = calculate_pcr(calls, puts)
            gex_result = calculate_gex(calls, puts, chain["spot_price"])

            deviation = round(chain["spot_price"] - max_pain_result["max_pain_strike"], 2)

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
                "spot_price": chain["spot_price"],
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
                "total_call_oi": pcr_result["total_call_oi"],
                "total_put_oi": pcr_result["total_put_oi"],
                "total_call_volume": pcr_result["total_call_volume"],
                "total_put_volume": pcr_result["total_put_volume"],
                "anomalies": anomalies,
            })
        except Exception as e:
            logger.warning(f"Comparison fetch failed for {ticker}: {e}")
            results.append({
                "ticker": ticker,
                "error": str(e),
                "anomalies": [],
            })

    return jsonify({
        "data": results,
        "expiration_used": expiration or "nearest",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
