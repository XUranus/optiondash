"""
Volatility calculations: Historical Volatility, VRP, 25-Delta Skew.
"""

import numpy as np
import pandas as pd
from scipy import interpolate


def calculate_hv(prices: pd.Series | np.ndarray, window: int = 30) -> float:
    """
    Calculate historical volatility (HV) over a window.

    HV = std(log_returns, window) * sqrt(252)
    """
    if isinstance(prices, pd.Series):
        prices = prices.values
    if len(prices) < window + 1:
        return 0.0
    log_returns = np.diff(np.log(prices[-window - 1:]))
    return float(np.std(log_returns) * np.sqrt(252))


def calculate_atm_iv(calls: pd.DataFrame, puts: pd.DataFrame, spot: float) -> float:
    """Get ATM IV by averaging the IV of call and put nearest to spot."""
    iv_col_c = "implied_volatility" if "implied_volatility" in calls.columns else None
    iv_col_p = "implied_volatility" if "implied_volatility" in puts.columns else None

    ivs = []
    for df, iv_col in ((calls, iv_col_c), (puts, iv_col_p)):
        if iv_col and not df.empty:
            idx = (df["strike"] - spot).abs().idxmin()
            ivs.append(float(df.loc[idx, iv_col]))

    return sum(ivs) / len(ivs) if ivs else 0.0


def calculate_vrp(atm_iv: float, hv30: float) -> float:
    """VRP = ATM IV - HV30. Positive = options overvalued relative to history."""
    return atm_iv - hv30


def calculate_skew_25d(calls: pd.DataFrame, puts: pd.DataFrame, spot: float) -> float:
    """
    Calculate 25-Delta risk reversal.

    25D Skew = IV(25Δ Put) - IV(25Δ Call)
    Uses linear interpolation to find IV at delta ≈ 0.25.
    """
    delta_col_c = "delta" if "delta" in calls.columns else None
    delta_col_p = "delta" if "delta" in puts.columns else None
    iv_col_c = "implied_volatility" if "implied_volatility" in calls.columns else None
    iv_col_p = "implied_volatility" if "implied_volatility" in puts.columns else None

    iv_25d_call = _interpolate_iv_at_delta(calls, delta_col_c, iv_col_c, 0.25)
    iv_25d_put = _interpolate_iv_at_delta(puts, delta_col_p, iv_col_p, -0.25)

    if iv_25d_call is None or iv_25d_put is None:
        return 0.0

    return round(iv_25d_put - iv_25d_call, 4)


def _interpolate_iv_at_delta(
    df: pd.DataFrame, delta_col: str | None, iv_col: str | None, target_delta: float
) -> float | None:
    """Interpolate IV at a given delta value."""
    if df.empty or delta_col is None or iv_col is None:
        return None

    df = df.dropna(subset=[delta_col, iv_col]).sort_values(delta_col)
    if df.empty or len(df) < 2:
        return None

    deltas = df[delta_col].values
    ivs = df[iv_col].values

    # For calls: delta is positive (0 to 1). We want delta ≈ 0.25
    # For puts: delta is negative (-1 to 0). We want delta ≈ -0.25
    if target_delta > 0:
        mask = deltas > 0
    else:
        mask = deltas < 0

    deltas_f = deltas[mask]
    ivs_f = ivs[mask]
    if len(deltas_f) < 2:
        return None

    try:
        f = interpolate.interp1d(deltas_f, ivs_f, kind="linear", bounds_error=False, fill_value="extrapolate")
        return float(f(target_delta))
    except Exception:
        return None
