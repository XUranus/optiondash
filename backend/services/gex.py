"""
Gamma Exposure (GEX) calculation.
"""

import numpy as np
import pandas as pd

from utils.helpers import format_large_number


def calculate_gex(
    calls: pd.DataFrame,
    puts: pd.DataFrame,
    spot_price: float,
) -> dict:
    """
    Calculate total Gamma Exposure from the dealer perspective.

    Dealer GEX = -Sum(call_OI * call_gamma) + Sum(put_OI * put_gamma)  [per-share]
    GEX in dollars = dealer_gex * 100 * spot_price

    Positive GEX → dealers are long gamma → they trade against the trend
    (damping volatility).
    Negative GEX → dealers are short gamma → they trade with the trend
    (amplifying volatility).

    Args:
        calls/puts: DataFrames with 'open_interest' (or 'oi') and 'gamma' columns.
        spot_price: Current spot price.

    Returns:
        Dict with GEX value, formatted string, and regime.
    """
    gamma_col_c = _resolve_column(calls, ("gamma",))
    gamma_col_p = _resolve_column(puts, ("gamma",))
    oi_col_c = _resolve_column(calls, ("open_interest", "openinterest", "oi"))
    oi_col_p = _resolve_column(puts, ("open_interest", "openinterest", "oi"))

    call_oi = calls[oi_col_c].fillna(0).values
    call_gamma = calls[gamma_col_c].fillna(0).values
    put_oi = puts[oi_col_p].fillna(0).values
    put_gamma = puts[gamma_col_p].fillna(0).values

    # Per-share dealer GEX
    dealer_gex_per_share = -np.sum(call_oi * call_gamma) + np.sum(put_oi * put_gamma)

    # Dollar GEX
    gex_dollar = float(dealer_gex_per_share * 100 * spot_price)

    regime = "positive_gamma" if gex_dollar > 0 else "negative_gamma"

    return {
        "value": round(gex_dollar, 2),
        "formatted": format_large_number(gex_dollar),
        "regime": regime,
    }


def calculate_gex_distribution(
    calls: pd.DataFrame,
    puts: pd.DataFrame,
    spot_price: float,
) -> dict:
    """
    Calculate GEX per strike level for distribution charting.

    Returns:
        Dict with strikes and gex_per_strike arrays, plus total_gex.
    """
    gamma_col_c = _resolve_column(calls, ("gamma",))
    gamma_col_p = _resolve_column(puts, ("gamma",))
    oi_col_c = _resolve_column(calls, ("open_interest", "openinterest", "oi"))
    oi_col_p = _resolve_column(puts, ("open_interest", "openinterest", "oi"))

    # Aggregate OI and gamma per strike
    call_agg = calls.groupby("strike").agg(
        total_oi=(oi_col_c, "sum"),
        total_gamma=(gamma_col_c, "sum"),
    ).reset_index()
    call_agg["gex"] = -call_agg["total_oi"] * call_agg["total_gamma"] * 100 * spot_price

    put_agg = puts.groupby("strike").agg(
        total_oi=(oi_col_p, "sum"),
        total_gamma=(gamma_col_p, "sum"),
    ).reset_index()
    put_agg["gex"] = put_agg["total_oi"] * put_agg["total_gamma"] * 100 * spot_price

    # Merge on strike
    call_gex_s = call_agg[["strike", "gex"]].rename(columns={"gex": "gex_call"})
    put_gex_s = put_agg[["strike", "gex"]].rename(columns={"gex": "gex_put"})
    combined = pd.merge(call_gex_s, put_gex_s, on="strike", how="outer").fillna(0)
    combined["gex_net"] = combined["gex_call"] + combined["gex_put"]
    combined = combined.sort_values("strike")

    strikes = [round(s, 2) for s in combined["strike"].tolist()]
    gex_net = [round(g, 2) for g in combined["gex_net"].tolist()]

    return {
        "strikes": strikes,
        "gex_per_strike": gex_net,
        "total_gex": round(sum(gex_net), 2),
    }


def _resolve_column(df: pd.DataFrame, candidates: tuple[str, ...]) -> str:
    for col in candidates:
        if col in df.columns:
            return col
    raise KeyError(f"None of {candidates} found in columns: {df.columns.tolist()}")
