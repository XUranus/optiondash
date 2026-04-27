"""
Application configuration.
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class Config:
    """Base configuration."""

    # Database
    DATABASE_PATH = os.environ.get(
        "OPTIONDASH_DB", os.path.join(BASE_DIR, "data", "optiondash.db")
    )

    # Supported tickers
    SUPPORTED_TICKERS = ["SPY", "QQQ", "IWM", "TLT", "XLF"]

    # Cache TTL in seconds (5 minutes)
    CACHE_TTL = int(os.environ.get("CACHE_TTL", 300))

    # Cache max size
    CACHE_MAX_SIZE = int(os.environ.get("CACHE_MAX_SIZE", 128))

    # Rate limiter: max requests per second to yfinance
    RATE_LIMIT_RPS = float(os.environ.get("RATE_LIMIT_RPS", 2.0))

    # Risk-free rate for Black-Scholes (annualized)
    RISK_FREE_RATE = float(os.environ.get("RISK_FREE_RATE", 0.0525))

    # Flask
    DEBUG = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    HOST = os.environ.get("FLASK_HOST", "0.0.0.0")
    PORT = int(os.environ.get("FLASK_PORT", 5001))

    # CORS
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

    # Scheduler
    SNAPSHOT_HOUR = int(os.environ.get("SNAPSHOT_HOUR", 16))  # ET 16:30
    SNAPSHOT_MINUTE = int(os.environ.get("SNAPSHOT_MINUTE", 30))
