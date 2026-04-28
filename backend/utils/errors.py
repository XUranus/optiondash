"""
Consistent error response formatting for all API endpoints.
"""

import logging
from datetime import datetime, timezone

from flask import jsonify

logger = logging.getLogger(__name__)


def error_response(error_code: str, message: str, status: int = 500, details: dict | None = None):
    """Return a consistent error JSON response with proper logging."""
    payload = {
        "error": error_code,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if details:
        payload["details"] = details

    logger.error(f"[{error_code}] {message}" + (f" details={details}" if details else ""))

    return jsonify(payload), status


def data_source_error(ticker: str, source: str, original_error: Exception) -> tuple:
    """Standard error when yfinance data is unavailable."""
    msg = f"Failed to fetch {source} for {ticker}: {original_error}"
    return error_response("data_source_error", msg, 502, {
        "ticker": ticker,
        "source": source,
        "reason": str(original_error),
    })


def ticker_not_supported(ticker: str) -> tuple:
    """Error when a ticker is not in the configured list."""
    from config import Config
    return error_response("unsupported_ticker",
        f"Ticker '{ticker}' is not supported. Supported: {', '.join(Config.SUPPORTED_TICKERS)}",
        status=400,
        details={"ticker": ticker, "supported": Config.SUPPORTED_TICKERS},
    )


def no_data_available(ticker: str, endpoint: str) -> tuple:
    """Error when no data could be retrieved for a ticker."""
    return error_response("no_data",
        f"No data available for {ticker} at {endpoint}. The data source may be unavailable or the ticker may have no options data.",
        status=404,
        details={"ticker": ticker},
    )
