"""
Black-Scholes Greeks computation engine using py_vollib_vectorized.
"""

import logging

import numpy as np
import pandas as pd
from py_vollib_vectorized import get_all_greeks

from config import Config

logger = logging.getLogger(__name__)


def compute_greeks(
    S: float,
    K: np.ndarray,
    T: np.ndarray,
    sigma: np.ndarray,
    flag: np.ndarray,
    r: float | None = None,
) -> pd.DataFrame:
    """
    Compute Greeks for an array of option contracts.

    Args:
        S: Spot price (scalar).
        K: Strike prices (array).
        T: Annualized time to expiration (array).
        sigma: Implied volatility (array).
        flag: 'c' for call, 'p' for put (array).
        r: Risk-free rate (annualized). Defaults to Config.RISK_FREE_RATE.

    Returns:
        DataFrame with columns: delta, gamma, theta, vega, rho.
    """
    if r is None:
        r = Config.RISK_FREE_RATE

    # py_vollib_vectorized expects scalar S and vectorized K, T, sigma
    S_arr = np.full_like(K, S, dtype=float)
    T = np.maximum(T, 1e-6 / 365)  # clamp minimum T to ~1 second

    try:
        greeks_df = get_all_greeks(flag, S_arr, K, T, r, sigma, model="black_scholes", return_as="dataframe")
    except Exception as e:
        logger.warning(f"Batch Greeks computation failed: {e}, falling back to per-contract")
        return _compute_greeks_fallback(S, K, T, sigma, flag, r)

    # Ensure we have the columns we expect
    result = pd.DataFrame()
    result["delta"] = greeks_df.get("delta", 0.0)
    result["gamma"] = greeks_df.get("gamma", 0.0)
    result["theta"] = greeks_df.get("theta", 0.0)
    result["vega"] = greeks_df.get("vega", 0.0)
    result["rho"] = greeks_df.get("rho", 0.0)

    # Replace NaN/Inf with 0
    result = result.fillna(0.0).replace([np.inf, -np.inf], 0.0)
    return result


def _compute_greeks_fallback(
    S: float, K: np.ndarray, T: np.ndarray, sigma: np.ndarray, flag: np.ndarray, r: float
) -> pd.DataFrame:
    """Per-contract fallback when batch computation fails."""
    results = {"delta": [], "gamma": [], "theta": [], "vega": [], "rho": []}

    for i in range(len(K)):
        try:
            greeks = get_all_greeks(
                np.array([flag[i]]),
                np.array([S]),
                np.array([K[i]]),
                np.array([T[i]]),
                r,
                np.array([sigma[i]]),
                model="black_scholes",
                return_as="dict",
            )
            results["delta"].append(float(greeks.get("delta", [0])[0]) if "delta" in greeks else 0.0)
            results["gamma"].append(float(greeks.get("gamma", [0])[0]) if "gamma" in greeks else 0.0)
            results["theta"].append(float(greeks.get("theta", [0])[0]) if "theta" in greeks else 0.0)
            results["vega"].append(float(greeks.get("vega", [0])[0]) if "vega" in greeks else 0.0)
            results["rho"].append(float(greeks.get("rho", [0])[0]) if "rho" in greeks else 0.0)
        except Exception:
            results["delta"].append(0.0)
            results["gamma"].append(0.0)
            results["theta"].append(0.0)
            results["vega"].append(0.0)
            results["rho"].append(0.0)

    return pd.DataFrame(results)


def compute_chain_greeks(
    chain: dict, r: float | None = None
) -> dict:
    """
    Compute Greeks for all options in a chain.

    Args:
        chain: Dict from market_data.get_options_chain() with 'calls' and 'puts' DataFrames.
        r: Risk-free rate.

    Returns:
        The input chain dict with Greeks columns added to calls/puts DataFrames.
    """
    from datetime import datetime, timezone

    if r is None:
        r = Config.RISK_FREE_RATE

    S = chain["spot_price"]
    exp_str = chain["expiration"]
    exp_date = datetime.strptime(exp_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    T_years = max((exp_date - now).days / 365.0, 1e-6)

    for side in ("calls", "puts"):
        df = chain[side]
        if df.empty:
            continue

        strikes = df["strike"].values
        T_arr = np.full(len(strikes), T_years)
        iv_col = "implied_volatility" if "implied_volatility" in df.columns else None

        if iv_col is None:
            sigma_arr = np.full(len(strikes), 0.2)  # fallback IV
        else:
            sigma_arr = df[iv_col].fillna(0.2).values

        flag = "c" if side == "calls" else "p"
        flag_arr = np.full(len(strikes), flag)

        greeks = compute_greeks(S, strikes, T_arr, sigma_arr, flag_arr, r)

        for col in ("delta", "gamma", "theta", "vega", "rho"):
            df[col] = greeks[col].values

    return chain
