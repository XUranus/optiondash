---
sidebar_position: 5
title: 'Historical API'
---

# Historical API

The Historical API provides historical trend data queries. Data comes from daily snapshots (the `daily_snapshots` table). It supports historical analysis across dimensions such as Max Pain vs. Price, PCR/GEX trends, volatility, and skew.

---

## GET /api/historical/max-pain-vs-price

Returns historical Max Pain and spot price comparison data, used to analyze the trend of price convergence toward Max Pain.

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `days` | integer | No | `90` | Number of historical days to query |

**Request Example:**

```
GET /api/historical/max-pain-vs-price?ticker=SPY&days=30
```

**Response (200):**

```json
{
  "ticker": "SPY",
  "dates": ["2026-05-08", "2026-05-09", "2026-05-12", "2026-05-13"],
  "prices": [570.25, 572.80, 575.10, 578.45],
  "max_pains": [575.0, 575.0, 580.0, 580.0]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Ticker symbol |
| `dates` | string[] | Array of dates in `YYYY-MM-DD` format, sorted in ascending order |
| `prices` | number[] | Spot price on each day |
| `max_pains` | number[] | Max Pain strike price on each day |

**Data Source:** Queried from the `daily_snapshots` table, automatically collected by the background scheduler at 16:30 ET daily. Can also be triggered manually via `POST /api/historical/snapshot`.

---

## GET /api/historical/pcr-gex

Returns historical PCR and GEX trend data, used to analyze changes in market sentiment and Gamma regime.

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `days` | integer | No | `90` | Number of historical days to query |

**Request Example:**

```
GET /api/historical/pcr-gex?ticker=SPY&days=60
```

**Response (200):**

```json
{
  "ticker": "SPY",
  "dates": ["2026-05-08", "2026-05-09", "2026-05-12", "2026-05-13"],
  "pcr_volume": [0.85, 0.92, 1.05, 0.88],
  "pcr_oi": [0.92, 0.95, 1.10, 0.98],
  "gex": [2500000000, 2200000000, -500000000, 1800000000]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Ticker symbol |
| `dates` | string[] | Array of dates, sorted in ascending order |
| `pcr_volume` | number[] | Volume PCR on each day |
| `pcr_oi` | number[] | Open Interest PCR on each day |
| `gex` | number[] | GEX value on each day (in dollars). Positive values indicate positive_gamma, negative values indicate negative_gamma |

**Data Notes:**
- A GEX sign change (positive to negative or vice versa) indicates a Gamma regime reversal, which is an important market structure signal
- PCR consistently above 1.2 may indicate bearish sentiment; consistently below 0.7 may indicate bullish sentiment

---

## GET /api/historical/volatility

Returns historical volatility metrics, including implied volatility, historical volatility, and the volatility risk premium.

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `days` | integer | No | `90` | Number of historical days to query |

**Request Example:**

```
GET /api/historical/volatility?ticker=SPY&days=30
```

**Response (200):**

```json
{
  "ticker": "SPY",
  "dates": ["2026-05-08", "2026-05-09", "2026-05-12", "2026-05-13"],
  "atm_iv": [0.185, 0.192, 0.210, 0.188],
  "hv30": [0.152, 0.155, 0.160, 0.158],
  "vrp": [0.033, 0.037, 0.050, 0.030]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Ticker symbol |
| `dates` | string[] | Array of dates, sorted in ascending order |
| `atm_iv` | number[] | At-the-Money Implied Volatility on each day |
| `hv30` | number[] | 30-day Historical Volatility on each day |
| `vrp` | number[] | Volatility Risk Premium on each day (= ATM IV - HV30) |

**Metric Descriptions:**
- **ATM IV** - The implied volatility of at-the-money options, reflecting the market's expectation of future volatility
- **HV30** - The actual volatility over the past 30 trading days, reflecting historical volatility levels
- **VRP** - The difference between implied volatility and historical volatility, typically positive (the market tends to overestimate volatility). A narrowing VRP may indicate declining volatility

---

## GET /api/historical/skew

Returns historical 25-Delta skew data, used to analyze the implied volatility difference between call and put options.

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `days` | integer | No | `90` | Number of historical days to query |

**Request Example:**

```
GET /api/historical/skew?ticker=SPY&days=30
```

**Response (200):**

```json
{
  "ticker": "SPY",
  "dates": ["2026-05-08", "2026-05-09", "2026-05-12", "2026-05-13"],
  "skew_25d": [3.2, 3.5, 4.1, 3.8]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Ticker symbol |
| `dates` | string[] | Array of dates, sorted in ascending order |
| `skew_25d` | number[] | 25-Delta skew value on each day |

**Metric Descriptions:**
- 25-Delta Skew = 25-Delta Put IV - 25-Delta Call IV
- A positive value indicates put option IV is higher than call option IV (the typical case, as the market prices in more downside risk)
- An expanding skew may indicate rising market panic
- A narrowing skew may indicate improving market sentiment

---

## POST /api/historical/snapshot

Manually triggers snapshot collection, writing current market data to the database. Typically used for debugging or filling in missing daily snapshots.

**Request Method:** `POST`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `date` | string | No | Today's date | Snapshot date, format `YYYY-MM-DD` |

**Request Example:**

```json
{
  "ticker": "SPY",
  "date": "2026-06-07"
}
```

**Response (200):**

```json
{
  "status": "ok",
  "ticker": "SPY",
  "date": "2026-06-07",
  "records_created": 420
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"ok"` |
| `ticker` | string | Ticker symbol |
| `date` | string | Snapshot date |
| `records_created` | number | Number of strike-level records written |

**What Gets Written:**

This endpoint performs the following operations:

1. Fetches the current options chain and calculates Greeks
2. Calculates Max Pain, PCR, GEX, ATM IV
3. Fetches historical prices and calculates HV30, VRP, 25-Delta Skew
4. Writes summary metrics to the `daily_snapshots` table
5. Writes detailed data for each strike to the `strike_snapshots` table

**Note:** If a snapshot already exists for the specified date, it will be overwritten using `INSERT OR REPLACE`.

---

## Common Error Responses

All Historical API endpoints share the following error scenarios:

**400 - Unsupported Ticker:**

```json
{
  "error": "unsupported_ticker",
  "message": "Ticker 'INVALID' is not supported. Supported: SPY, QQQ, IWM, TLT, XLF",
  "timestamp": "2026-06-07T12:00:00Z",
  "details": {
    "ticker": "INVALID",
    "supported": ["SPY", "QQQ", "IWM", "TLT", "XLF"]
  }
}
```

**502 - Data Source Error (POST snapshot only):**

```json
{
  "error": "data_source_error",
  "message": "Failed to fetch snapshot for SPY: <error details>",
  "timestamp": "2026-06-07T12:00:00Z",
  "details": {
    "ticker": "SPY",
    "source": "snapshot",
    "reason": "<original error message>"
  }
}
```

**Notes:**
- GET endpoints query the local SQLite database and do not depend on external APIs, so response times are very fast (< 100ms)
- If there is no historical data in the database (e.g., a fresh deployment), the returned arrays will be empty
- The POST snapshot endpoint needs to call yfinance and may take 1-5 seconds
