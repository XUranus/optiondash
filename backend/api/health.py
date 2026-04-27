"""
Health check API blueprint.
"""

from datetime import datetime, timezone

from flask import Blueprint, jsonify

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
