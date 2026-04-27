"""
Max Pain calculation — the strike price where total option holder loss is minimized
(equivalent to where option writers would profit the most).
"""

import numpy as np
import pandas as pd


def calculate_max_pain(calls: pd.DataFrame, puts: pd.DataFrame) -> dict:
    """
    Compute Max Pain from calls and puts DataFrames.

    For each candidate settlement price K:
        total_loss(K) = Sum max(0, K - strike_i) * call_OI_i
                      + Sum max(0, strike_j - K) * put_OI_j

    Returns the strike K that minimizes total_loss.

    Args:
        calls: DataFrame with columns 'strike' and 'open_interest' (or 'oi').
        puts: DataFrame with columns 'strike' and 'open_interest' (or 'oi').

    Returns:
        Dict with max_pain_strike, total_loss at each candidate strike,
        and the full curve for charting.
    """
    if calls.empty and puts.empty:
        return {"max_pain_strike": 0.0, "strikes": [], "total_loss": []}

    oi_col_c = _resolve_oi_column(calls)
    oi_col_p = _resolve_oi_column(puts)

    # Get all unique candidate strikes
    all_strikes = sorted(
        set(calls["strike"].tolist()) | set(puts["strike"].tolist())
    )

    if not all_strikes:
        return {"max_pain_strike": 0.0, "strikes": [], "total_loss": []}

    call_strikes = calls["strike"].values
    call_oi = calls[oi_col_c].fillna(0).values
    put_strikes = puts["strike"].values
    put_oi = puts[oi_col_p].fillna(0).values

    total_losses = []
    for K in all_strikes:
        # Call holders lose if K > strike
        call_loss = np.sum(np.maximum(K - call_strikes, 0) * call_oi * 100)
        # Put holders lose if K < strike
        put_loss = np.sum(np.maximum(put_strikes - K, 0) * put_oi * 100)
        total_losses.append(call_loss + put_loss)

    min_idx = int(np.argmin(total_losses))
    max_pain = all_strikes[min_idx]

    return {
        "max_pain_strike": round(max_pain, 2),
        "strikes": [round(s, 2) for s in all_strikes],
        "total_loss": [round(l, 2) for l in total_losses],
    }


def _resolve_oi_column(df: pd.DataFrame) -> str:
    """Resolve OI column name from the yfinance output."""
    for col in ("open_interest", "oi", "openinterest"):
        if col in df.columns:
            return col
    return df.columns[0]  # fallback — shouldn't happen
