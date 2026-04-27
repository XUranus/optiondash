"""
Put/Call Ratio calculations.
"""

import pandas as pd
from utils.helpers import safe_divide


def calculate_pcr(calls: pd.DataFrame, puts: pd.DataFrame) -> dict:
    """
    Calculate volume-based and OI-based Put/Call ratios.

    PCR > 1.2 → bearish (more puts being traded/held)
    PCR < 0.7 → bullish (more calls being traded/held)

    Returns:
        Dict with pcr_volume, pcr_oi, and interpretation signal.
    """
    vol_col_c = _resolve_column(calls, ("volume", "vol"))
    vol_col_p = _resolve_column(puts, ("volume", "vol"))
    oi_col_c = _resolve_column(calls, ("open_interest", "openinterest", "oi"))
    oi_col_p = _resolve_column(puts, ("open_interest", "openinterest", "oi"))

    total_call_vol = float(calls[vol_col_c].fillna(0).sum())
    total_put_vol = float(puts[vol_col_p].fillna(0).sum())
    total_call_oi = float(calls[oi_col_c].fillna(0).sum())
    total_put_oi = float(puts[oi_col_p].fillna(0).sum())

    pcr_volume = safe_divide(total_put_vol, total_call_vol, default=0.0)
    pcr_oi = safe_divide(total_put_oi, total_call_oi, default=0.0)

    signal = _interpret_pcr(pcr_volume, pcr_oi)

    return {
        "pcr_volume": round(pcr_volume, 4),
        "pcr_oi": round(pcr_oi, 4),
        "signal": signal,
        "total_call_volume": int(total_call_vol),
        "total_put_volume": int(total_put_vol),
        "total_call_oi": int(total_call_oi),
        "total_put_oi": int(total_put_oi),
    }


def _interpret_pcr(pcr_vol: float, pcr_oi: float) -> str:
    """Interpret PCR values into bullish/bearish/neutral signal."""
    # Weight OI more heavily for signal
    composite = pcr_oi * 0.6 + pcr_vol * 0.4
    if composite > 1.2:
        return "bearish"
    elif composite < 0.7:
        return "bullish"
    return "neutral"


def _resolve_column(df: pd.DataFrame, candidates: tuple[str, ...]) -> str:
    """Find the first matching column from candidates."""
    for col in candidates:
        if col in df.columns:
            return col
    raise KeyError(f"None of {candidates} found in columns: {df.columns.tolist()}")
