"""
Historical Trends API blueprint.
"""

import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from services.market_data import (
    get_options_chain,
    get_historical_prices,
)
from services.greeks_engine import compute_chain_greeks
from services.max_pain import calculate_max_pain
from services.pcr import calculate_pcr
from services.gex import calculate_gex
from services.volatility import calculate_hv, calculate_atm_iv, calculate_vrp, calculate_skew_25d
from database.connection import db
from utils.helpers import safe_int, safe_float

logger = logging.getLogger(__name__)

historical_bp = Blueprint("historical", __name__)


@historical_bp.route("/api/historical/max-pain-vs-price", methods=["GET"])
def max_pain_vs_price():
    """Get historical max pain vs spot price trend."""
    ticker = request.args.get("ticker", "SPY").upper()
    days = int(request.args.get("days", 90))

    rows = db.execute(
        "SELECT date, spot_price, max_pain FROM daily_snapshots "
        "WHERE ticker = ? AND date >= date('now', ? || ' days') "
        "ORDER BY date ASC",
        (ticker, f"-{days}"),
    )

    return jsonify({
        "ticker": ticker,
        "dates": [r["date"] for r in rows],
        "prices": [r["spot_price"] for r in rows],
        "max_pains": [r["max_pain"] for r in rows],
    })


@historical_bp.route("/api/historical/pcr-gex", methods=["GET"])
def pcr_gex_history():
    """Get historical PCR and GEX trends."""
    ticker = request.args.get("ticker", "SPY").upper()
    days = int(request.args.get("days", 90))

    rows = db.execute(
        "SELECT date, pcr_volume, pcr_oi, gex FROM daily_snapshots "
        "WHERE ticker = ? AND date >= date('now', ? || ' days') "
        "ORDER BY date ASC",
        (ticker, f"-{days}"),
    )

    return jsonify({
        "ticker": ticker,
        "dates": [r["date"] for r in rows],
        "pcr_volume": [r["pcr_volume"] for r in rows],
        "pcr_oi": [r["pcr_oi"] for r in rows],
        "gex": [r["gex"] for r in rows],
    })


@historical_bp.route("/api/historical/volatility", methods=["GET"])
def volatility_history():
    """Get historical volatility metrics."""
    ticker = request.args.get("ticker", "SPY").upper()
    days = int(request.args.get("days", 90))

    rows = db.execute(
        "SELECT date, atm_iv, hv30, vrp FROM daily_snapshots "
        "WHERE ticker = ? AND date >= date('now', ? || ' days') "
        "ORDER BY date ASC",
        (ticker, f"-{days}"),
    )

    return jsonify({
        "ticker": ticker,
        "dates": [r["date"] for r in rows],
        "atm_iv": [r["atm_iv"] for r in rows],
        "hv30": [r["hv30"] for r in rows],
        "vrp": [r["vrp"] for r in rows],
    })


@historical_bp.route("/api/historical/skew", methods=["GET"])
def skew_history():
    """Get historical 25-delta skew."""
    ticker = request.args.get("ticker", "SPY").upper()
    days = int(request.args.get("days", 90))

    rows = db.execute(
        "SELECT date, skew_25d FROM daily_snapshots "
        "WHERE ticker = ? AND date >= date('now', ? || ' days') "
        "ORDER BY date ASC",
        (ticker, f"-{days}"),
    )

    return jsonify({
        "ticker": ticker,
        "dates": [r["date"] for r in rows],
        "skew_25d": [r["skew_25d"] for r in rows],
    })


@historical_bp.route("/api/historical/snapshot", methods=["POST"])
def take_snapshot():
    """Manually trigger a snapshot for a given ticker."""
    data = request.get_json(silent=True) or {}
    ticker = data.get("ticker", "SPY").upper()
    date_str = data.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))

    try:
        chain = get_options_chain(ticker)
        chain = compute_chain_greeks(chain)
        calls = chain["calls"]
        puts = chain["puts"]
        spot = chain["spot_price"]

        max_pain_result = calculate_max_pain(calls, puts)
        pcr_result = calculate_pcr(calls, puts)
        gex_result = calculate_gex(calls, puts, spot)

        atm_iv = calculate_atm_iv(calls, puts, spot)

        prices_df = get_historical_prices(ticker, period="90d")
        hv30 = calculate_hv(prices_df["Close"], window=30)
        vrp = calculate_vrp(atm_iv, hv30)
        skew = calculate_skew_25d(calls, puts, spot)

        # Upsert daily snapshot
        db.execute(
            """
            INSERT OR REPLACE INTO daily_snapshots
            (date, ticker, spot_price, max_pain, pcr_volume, pcr_oi, gex,
             atm_iv, hv30, vrp, skew_25d,
             total_call_volume, total_put_volume, total_call_oi, total_put_oi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                date_str, ticker, spot,
                max_pain_result["max_pain_strike"],
                pcr_result["pcr_volume"], pcr_result["pcr_oi"],
                gex_result["value"],
                atm_iv, hv30, vrp, skew,
                pcr_result["total_call_volume"], pcr_result["total_put_volume"],
                pcr_result["total_call_oi"], pcr_result["total_put_oi"],
            ),
        )

        # Store strike-level data
        strike_rows = []
        for side_key, df in (("calls", calls), ("puts", puts)):
            for _, row in df.iterrows():
                strike_rows.append((
                    date_str, ticker, chain["expiration"],
                    safe_float(row["strike"]),
                    safe_int(row.get("open_interest")) if side_key == "calls" else 0,
                    safe_int(row.get("open_interest")) if side_key == "puts" else 0,
                    safe_int(row.get("volume")) if side_key == "calls" else 0,
                    safe_int(row.get("volume")) if side_key == "puts" else 0,
                    safe_float(row.get("implied_volatility")) if side_key == "calls" else 0.0,
                    safe_float(row.get("implied_volatility")) if side_key == "puts" else 0.0,
                    safe_float(row.get("gamma")) if side_key == "calls" else 0.0,
                    safe_float(row.get("gamma")) if side_key == "puts" else 0.0,
                    safe_float(row.get("delta")) if side_key == "calls" else 0.0,
                    safe_float(row.get("delta")) if side_key == "puts" else 0.0,
                ))

        db.execute_many(
            """
            INSERT OR REPLACE INTO strike_snapshots
            (date, ticker, expiration, strike,
             call_oi, put_oi, call_volume, put_volume,
             call_iv, put_iv, call_gamma, put_gamma, call_delta, put_delta)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            strike_rows,
        )

        return jsonify({
            "status": "ok",
            "ticker": ticker,
            "date": date_str,
            "records_created": len(strike_rows),
        })
    except Exception as e:
        logger.exception(f"Snapshot failed for {ticker}")
        return jsonify({"error": "snapshot_error", "message": str(e)}), 500
