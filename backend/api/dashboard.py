"""
Summary Dashboard API blueprint.
"""

import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from services.market_data import get_ticker_info, get_options_chain, get_expirations
from services.greeks_engine import compute_chain_greeks
from services.max_pain import calculate_max_pain
from services.pcr import calculate_pcr
from services.gex import calculate_gex

logger = logging.getLogger(__name__)

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard/summary", methods=["GET"])
def dashboard_summary():
    """Get core indicator overview for a ticker."""
    ticker = request.args.get("ticker", "SPY").upper()
    expiration = request.args.get("expiration")

    try:
        info = get_ticker_info(ticker)
        chain = get_options_chain(ticker, expiration)
        chain = compute_chain_greeks(chain)

        calls = chain["calls"]
        puts = chain["puts"]

        max_pain_result = calculate_max_pain(calls, puts)
        pcr_result = calculate_pcr(calls, puts)
        gex_result = calculate_gex(calls, puts, chain["spot_price"])

        # ATM IV from the option nearest the spot price
        atm_iv = _get_atm_iv(calls, puts, chain["spot_price"])

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
        return jsonify({"error": "dashboard_error", "message": str(e)}), 500


@dashboard_bp.route("/api/dashboard/expirations", methods=["GET"])
def dashboard_expirations():
    """Get available expiration dates for a ticker."""
    ticker = request.args.get("ticker", "SPY").upper()
    try:
        exps = get_expirations(ticker)
        return jsonify({
            "ticker": ticker,
            "expirations": exps,
        })
    except Exception as e:
        logger.exception(f"Expirations fetch failed for {ticker}")
        return jsonify({"error": "expirations_error", "message": str(e)}), 500


def _get_atm_iv(calls, puts, spot_price) -> float:
    """Get ATM implied volatility by averaging call and put IV nearest spot."""
    iv_col_c = "implied_volatility" if "implied_volatility" in calls.columns else None
    iv_col_p = "implied_volatility" if "implied_volatility" in puts.columns else None

    if iv_col_c is None and iv_col_p is None:
        return 0.0

    ivs = []
    for df, iv_col in ((calls, iv_col_c), (puts, iv_col_p)):
        if iv_col and not df.empty:
            df_sorted = df.iloc[(df["strike"] - spot_price).abs().argsort()]
            ivs.append(float(df_sorted[iv_col].iloc[0]))

    return sum(ivs) / len(ivs) if ivs else 0.0
