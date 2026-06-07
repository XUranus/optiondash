"""
Macro-economic indicators API blueprint.
"""

import logging
from datetime import datetime, timezone

import pandas as pd
from flask import Blueprint, jsonify, request

from config import Config
from services.live_cache import get_cached
from services.macro_data import get_macro_current, get_macro_history
from utils.errors import error_response, data_source_error

logger = logging.getLogger(__name__)

macro_bp = Blueprint("macro", __name__)

MACRO_CACHE_TICKER = "MACRO"


@macro_bp.route("/api/macro/current", methods=["GET"])
def macro_current():
    """Get current snapshot of all macro-economic indicators."""
    # 1. Try live cache
    cached = get_cached(MACRO_CACHE_TICKER, "current")
    if cached:
        return jsonify(cached)

    # 2. Fall back to direct fetch
    try:
        data = get_macro_current()
        return jsonify(data)
    except Exception as e:
        logger.exception("Macro current fetch failed")
        return data_source_error(MACRO_CACHE_TICKER, "macro_current", e)


@macro_bp.route("/api/macro/history", methods=["GET"])
def macro_history():
    """Get historical time series for requested macro indicators."""
    indicators_str = request.args.get("indicators", "VIX").upper()
    days = int(request.args.get("days", 90))

    requested = [name.strip() for name in indicators_str.split(",") if name.strip()]
    valid_indicators = []
    for name in requested:
        if name == "SPREAD":
            valid_indicators.append(name)
        elif name in Config.MACRO_SYMBOLS:
            valid_indicators.append(name)

    if not valid_indicators:
        return error_response(
            "invalid_indicators",
            f"No valid indicators in: {indicators_str}. Valid: {list(Config.MACRO_SYMBOLS.keys())}, SPREAD",
            status=400,
        )

    try:
        # Fetch history for each indicator, align on dates
        series = {}
        all_dates = set()

        for name in valid_indicators:
            if name == "SPREAD":
                tnx_df = get_macro_history(Config.MACRO_SYMBOLS["TNX"], f"{days}d")
                irx_df = get_macro_history(Config.MACRO_SYMBOLS["IRX"], f"{days}d")
                common = tnx_df.index.intersection(irx_df.index)
                values = {}
                for dt in common:
                    values[dt.strftime("%Y-%m-%d")] = round(float(tnx_df.loc[dt, "Close"]) - float(irx_df.loc[dt, "Close"]), 2)
                series["spread"] = values
                all_dates.update(values.keys())
            else:
                symbol = Config.MACRO_SYMBOLS[name]
                df = get_macro_history(symbol, f"{days}d")
                values = {}
                for dt in df.index:
                    values[dt.strftime("%Y-%m-%d")] = round(float(df.loc[dt, "Close"]), 2)
                series[name.lower()] = values
                all_dates.update(values.keys())

        # Build aligned arrays
        sorted_dates = sorted(all_dates)
        response = {
            "indicators": [name.lower() if name != "SPREAD" else "spread" for name in valid_indicators],
            "dates": sorted_dates,
        }

        for key, date_map in series.items():
            response[key] = [date_map.get(d) for d in sorted_dates]

        response["updated_at"] = datetime.now(timezone.utc).isoformat()
        return jsonify(response)

    except Exception as e:
        logger.exception("Macro history fetch failed")
        return data_source_error(MACRO_CACHE_TICKER, "macro_history", e)
