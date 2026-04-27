"""
Strike-level Analysis API blueprint.
"""

import logging

from flask import Blueprint, jsonify, request

from services.market_data import get_options_chain
from services.greeks_engine import compute_chain_greeks
from services.max_pain import calculate_max_pain
from services.gex import calculate_gex_distribution

logger = logging.getLogger(__name__)

strikes_bp = Blueprint("strikes", __name__)


@strikes_bp.route("/api/strikes/oi-wall", methods=["GET"])
def oi_wall():
    """Get OI wall data for a ticker/expiration."""
    ticker = request.args.get("ticker", "SPY").upper()
    expiration = request.args.get("expiration")

    try:
        chain = get_options_chain(ticker, expiration)
        max_pain_result = calculate_max_pain(chain["calls"], chain["puts"])
        chain = compute_chain_greeks(chain)

        oi_col_c = _col(chain["calls"], ("open_interest", "openinterest", "oi"))
        oi_col_p = _col(chain["puts"], ("open_interest", "openinterest", "oi"))

        all_strikes = sorted(
            set(chain["calls"]["strike"].tolist())
            | set(chain["puts"]["strike"].tolist())
        )

        call_oi_map = dict(zip(chain["calls"]["strike"], chain["calls"][oi_col_c].fillna(0)))
        put_oi_map = dict(zip(chain["puts"]["strike"], chain["puts"][oi_col_p].fillna(0)))

        strikes = []
        call_oi = []
        put_oi = []
        for s in all_strikes:
            strikes.append(round(s, 2))
            call_oi.append(int(call_oi_map.get(s, 0)))
            put_oi.append(int(put_oi_map.get(s, 0)))

        return jsonify({
            "ticker": ticker,
            "expiration": chain["expiration"],
            "spot_price": chain["spot_price"],
            "max_pain": max_pain_result["max_pain_strike"],
            "strikes": strikes,
            "call_oi": call_oi,
            "put_oi": put_oi,
        })
    except Exception as e:
        logger.exception(f"OI wall fetch failed for {ticker}")
        return jsonify({"error": "oi_wall_error", "message": str(e)}), 500


@strikes_bp.route("/api/strikes/max-pain-curve", methods=["GET"])
def max_pain_curve():
    """Get max pain curve for a ticker/expiration."""
    ticker = request.args.get("ticker", "SPY").upper()
    expiration = request.args.get("expiration")

    try:
        chain = get_options_chain(ticker, expiration)
        max_pain_result = calculate_max_pain(chain["calls"], chain["puts"])

        return jsonify({
            "ticker": ticker,
            "expiration": chain["expiration"],
            "strikes": max_pain_result["strikes"],
            "total_loss": max_pain_result["total_loss"],
            "max_pain_strike": max_pain_result["max_pain_strike"],
        })
    except Exception as e:
        logger.exception(f"Max pain curve failed for {ticker}")
        return jsonify({"error": "max_pain_curve_error", "message": str(e)}), 500


@strikes_bp.route("/api/strikes/gex-distribution", methods=["GET"])
def gex_distribution():
    """Get GEX distribution per strike for a ticker/expiration."""
    ticker = request.args.get("ticker", "SPY").upper()
    expiration = request.args.get("expiration")

    try:
        chain = get_options_chain(ticker, expiration)
        chain = compute_chain_greeks(chain)

        dist = calculate_gex_distribution(
            chain["calls"], chain["puts"], chain["spot_price"]
        )

        return jsonify({
            "ticker": ticker,
            "expiration": chain["expiration"],
            "spot_price": chain["spot_price"],
            "strikes": dist["strikes"],
            "gex_per_strike": dist["gex_per_strike"],
            "total_gex": dist["total_gex"],
        })
    except Exception as e:
        logger.exception(f"GEX distribution failed for {ticker}")
        return jsonify({"error": "gex_distribution_error", "message": str(e)}), 500


def _col(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    raise KeyError(f"None of {candidates} in {df.columns.tolist()}")
