---
sidebar_position: 4
title: 'Comparison API'
---

# Comparison API

The Comparison API provides cross-ticker comparison functionality with anomaly detection support, helping identify unusual signals in the market.

---

## GET /api/comparison/overview

Batch-fetches core metrics for multiple tickers and performs cross-comparison. Supports automatic anomaly detection, marking anomalies in the response when metrics trigger thresholds.

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tickers` | string | No | `SPY,QQQ,IWM` | Comma-separated list of ticker symbols |
| `expiration` | string | No | Nearest expiration | Expiration date, format `YYYY-MM-DD` |

**Request Example:**

```
GET /api/comparison/overview?tickers=SPY,QQQ,IWM&expiration=2026-06-20
```

**Response (200):**

```json
{
  "data": [
    {
      "ticker": "SPY",
      "spot_price": 585.42,
      "daily_change_pct": 0.37,
      "max_pain": 585.0,
      "deviation_from_max_pain": 0.42,
      "pcr": {
        "volume": 0.85,
        "oi": 0.92,
        "signal": "neutral"
      },
      "gex": {
        "value": 2500000000.0,
        "formatted": "$2.50B",
        "regime": "positive_gamma"
      },
      "total_call_oi": 250000,
      "total_put_oi": 280000,
      "total_call_volume": 1800000,
      "total_put_volume": 1600000,
      "anomalies": []
    },
    {
      "ticker": "QQQ",
      "spot_price": 495.20,
      "daily_change_pct": -3.5,
      "max_pain": 500.0,
      "deviation_from_max_pain": -4.80,
      "pcr": {
        "volume": 1.35,
        "oi": 1.28,
        "signal": "bearish"
      },
      "gex": {
        "value": -800000000.0,
        "formatted": "-$800.00M",
        "regime": "negative_gamma"
      },
      "total_call_oi": 180000,
      "total_put_oi": 220000,
      "total_call_volume": 1200000,
      "total_put_volume": 1500000,
      "anomalies": [
        {
          "field": "pcr",
          "value": 1.28,
          "change_pct": 0,
          "type": "extreme"
        },
        {
          "field": "price",
          "value": -3.5,
          "change_pct": -3.5,
          "type": "drop"
        }
      ]
    }
  ],
  "expiration_used": "2026-06-20",
  "updated_at": "2026-06-07T12:00:00Z"
}
```

**Top-Level Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `data` | object[] | Array of comparison data for each ticker |
| `expiration_used` | string | Expiration date used (`"nearest"` means the nearest expiration date was used) |
| `updated_at` | string | Data update time |

**data Array Element Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Ticker symbol |
| `spot_price` | number | Current spot price |
| `daily_change_pct` | number | Intraday change percentage |
| `max_pain` | number | Max Pain strike price |
| `deviation_from_max_pain` | number | Deviation of spot price from Max Pain |
| `pcr` | object | PCR data (same structure as Dashboard API) |
| `gex` | object | GEX data (same structure as Dashboard API) |
| `total_call_oi` | number | Total call option open interest |
| `total_put_oi` | number | Total put option open interest |
| `total_call_volume` | number | Total call option volume |
| `total_put_volume` | number | Total put option volume |
| `anomalies` | object[] | Array of anomaly markers; an empty array means no anomalies detected |

**Anomaly Types:**

The system automatically detects anomalies using the following rules:

| Type | Trigger Condition | Description |
|------|-------------------|-------------|
| `extreme` | `PCR > 2.0 or PCR < 0.5` | Extreme sentiment signal |
| `spike` | `Intraday gain > 3%` | Significant price increase |
| `drop` | `Intraday decline > 3%` | Significant price decrease |
| `spike` | `OI increase > 20% vs 5-day average` | Abnormal increase in open interest |
| `drop` | `OI decrease > 20% vs 5-day average` | Abnormal decrease in open interest |
| `flip` | GEX sign changed | Gamma regime reversal |

**anomalies Array Element Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `field` | string | Anomaly indicator: `"pcr"` / `"price"` / `"call_oi"` / `"put_oi"` / `"gex"` |
| `value` | number | Current value |
| `change_pct` | number | Change percentage (valid for OI anomalies) |
| `type` | string | Anomaly type: `"extreme"` / `"spike"` / `"drop"` / `"flip"` |

**Anomaly Detection Logic:**

1. **PCR Extreme Values** - Triggered when `pcr_volume` or `pcr_oi` exceeds 2.0, or both are below 0.5
2. **Large Price Movements** - Triggered when the absolute value of `daily_change_pct` exceeds 3%
3. **Abnormal OI Changes** - Compared to the average of the last 5 trading days, triggered when the change exceeds 20%
4. **GEX Sign Flip** - Triggered when the current GEX sign is opposite to the 5-day average

**Partial Failure Handling:** If data fetching fails for a specific ticker, that ticker's `error` field will contain the error message, while other tickers are returned normally. A single ticker failure will not cause the entire request to fail.

**Error Responses:**

```json
// 400 - No valid tickers
{
  "error": "no_valid_tickers",
  "message": "No valid tickers. Supported: SPY, QQQ, IWM, TLT, XLF",
  "timestamp": "2026-06-07T12:00:00Z"
}
```

**Caching Behavior:** Live cache summary data is used with priority for each ticker. If the cache misses, the system falls back to calling yfinance directly.
