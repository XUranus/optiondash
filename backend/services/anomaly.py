"""
Anomaly detection for option activity.
"""

import numpy as np
from typing import Any


def detect_anomalies(
    ticker: str,
    pcr: dict,
    gex: dict,
    daily_change_pct: float,
    calls_oi: int,
    puts_oi: int,
    calls_vol: int,
    puts_vol: int,
    historical_avg: dict | None = None,
) -> list[dict]:
    """
    Flag anomalous data points.

    Checks:
    - OI single-day change > 20% (if historical available)
    - PCR extreme values (> 2.0 or < 0.5)
    - GEX sign flip (if historical available)
    - Price move > 3% (large underlying move)
    """
    anomalies = []

    # Extreme PCR
    if pcr["pcr_volume"] > 2.0 or pcr["pcr_oi"] > 2.0:
        anomalies.append({
            "field": "pcr",
            "value": pcr["pcr_oi"],
            "change_pct": 0,
            "type": "extreme",
        })
    elif pcr["pcr_volume"] < 0.5 and pcr["pcr_oi"] < 0.5:
        anomalies.append({
            "field": "pcr",
            "value": pcr["pcr_oi"],
            "change_pct": 0,
            "type": "extreme",
        })

    # Large price move
    if abs(daily_change_pct) > 3.0:
        anomalies.append({
            "field": "price",
            "value": daily_change_pct,
            "change_pct": daily_change_pct,
            "type": "spike" if daily_change_pct > 0 else "drop",
        })

    # OI change vs historical
    if historical_avg and historical_avg.get("total_call_oi"):
        prev_call_oi = float(historical_avg["total_call_oi"])
        if prev_call_oi > 0:
            change = (calls_oi - prev_call_oi) / prev_call_oi * 100
            if abs(change) > 20:
                anomalies.append({
                    "field": "call_oi",
                    "value": calls_oi,
                    "change_pct": round(change, 1),
                    "type": "spike" if change > 0 else "drop",
                })

    if historical_avg and historical_avg.get("total_put_oi"):
        prev_put_oi = float(historical_avg["total_put_oi"])
        if prev_put_oi > 0:
            change = (puts_oi - prev_put_oi) / prev_put_oi * 100
            if abs(change) > 20:
                anomalies.append({
                    "field": "put_oi",
                    "value": puts_oi,
                    "change_pct": round(change, 1),
                    "type": "spike" if change > 0 else "drop",
                })

    # GEX sign flip
    if historical_avg and historical_avg.get("gex") is not None:
        prev_gex = float(historical_avg["gex"])
        if (prev_gex > 0 and gex["value"] < 0) or (prev_gex < 0 and gex["value"] > 0):
            anomalies.append({
                "field": "gex",
                "value": gex["value"],
                "change_pct": 0,
                "type": "flip",
            })

    return anomalies


def get_historical_average(ticker: str, db) -> dict | None:
    """Get the 5-day average of key metrics for a ticker."""
    row = db.execute_one(
        """
        SELECT AVG(total_call_oi) as total_call_oi,
               AVG(total_put_oi) as total_put_oi,
               AVG(gex) as gex
        FROM daily_snapshots
        WHERE ticker = ?
        ORDER BY date DESC
        LIMIT 5
        """,
        (ticker,),
    )
    if row and row["total_call_oi"] is not None:
        return {
            "total_call_oi": row["total_call_oi"],
            "total_put_oi": row["total_put_oi"],
            "gex": row["gex"],
        }
    return None
