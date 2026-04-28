"""
Health check and configuration API blueprint.
"""

from datetime import datetime, timezone

from flask import Blueprint, jsonify

from config import Config

health_bp = Blueprint("health", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify(
        {
            "status": "ok",
            "service": "optiondash-api",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


@health_bp.route("/api/tickers", methods=["GET"])
def list_tickers():
    """Return the list of configured supported tickers."""
    return jsonify(
        {
            "tickers": Config.SUPPORTED_TICKERS,
            "default": Config.SUPPORTED_TICKERS[0] if Config.SUPPORTED_TICKERS else "SPY",
        }
    )
