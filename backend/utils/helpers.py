"""
General utility / helper functions.
"""

import math
from datetime import datetime, timezone


def utc_now_iso() -> str:
    """Return current UTC time as ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()


def format_large_number(value: float) -> str:
    """
    Format a large number with B/M/K suffix.

    Examples:
        1_500_000_000 -> "$1.50B"
        -1_010_000_000 -> "-$1.01B"
        250_000_000 -> "$250.00M"
        1_500_000 -> "$1.50M"
        50_000 -> "$50.00K"
    """
    abs_val = abs(value)
    sign = "-" if value < 0 else ""

    if abs_val >= 1e9:
        return f"{sign}${abs_val / 1e9:.2f}B"
    elif abs_val >= 1e6:
        return f"{sign}${abs_val / 1e6:.2f}M"
    elif abs_val >= 1e3:
        return f"{sign}${abs_val / 1e3:.2f}K"
    else:
        return f"{sign}${abs_val:.2f}"


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safe division that returns default on zero denominator."""
    if denominator == 0:
        return default
    return numerator / denominator


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp a value between min and max."""
    return max(min_val, min(max_val, value))


def safe_int(value, default: int = 0) -> int:
    """Convert a value to int, handling NaN and None."""
    if value is None:
        return default
    try:
        fv = float(value)
        if math.isnan(fv) or math.isinf(fv):
            return default
        return int(fv)
    except (ValueError, TypeError):
        return default


def safe_float(value, default: float = 0.0) -> float:
    """Convert a value to float, handling NaN and None."""
    if value is None:
        return default
    try:
        fv = float(value)
        if math.isnan(fv) or math.isinf(fv):
            return default
        return fv
    except (ValueError, TypeError):
        return default
