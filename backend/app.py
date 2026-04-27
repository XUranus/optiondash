"""
OptionDash — Options Chain Analysis & Market Sentiment Monitoring Platform.

Flask application entry point.
"""

import logging

from flask import Flask
from flask_cors import CORS

from config import Config
from api.health import health_bp
from api.dashboard import dashboard_bp
from api.comparison import comparison_bp
from api.strikes import strikes_bp
from api.historical import historical_bp
from database.connection import db  # noqa: F401 — triggers schema init
from scheduler.jobs import start_scheduler, stop_scheduler


def create_app() -> Flask:
    """Application factory."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS
    CORS(app, origins=Config.CORS_ORIGINS)

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(comparison_bp)
    app.register_blueprint(strikes_bp)
    app.register_blueprint(historical_bp)

    # Logging
    logging.basicConfig(
        level=logging.DEBUG if Config.DEBUG else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # Start background scheduler for daily snapshots
    try:
        start_scheduler()
    except Exception:
        logging.getLogger(__name__).warning("Scheduler start failed (may already be running)")

    return app


if __name__ == "__main__":
    app = create_app()
    try:
        app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
    finally:
        stop_scheduler()
