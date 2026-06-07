---
sidebar_position: 6
title: 'Macro API'
---

# Macro API

The Macro API provides real-time snapshots and historical data queries for macroeconomic indicators. Indicator data comes from Yahoo Finance (yfinance), covering key macroeconomic variables such as volatility indices, Treasury yields, and the US Dollar Index.

---

## GET /api/macro/current

Retrieves a real-time snapshot of all current macroeconomic indicators.

**Request Parameters:** None

**Request Example:**

```
GET /api/macro/current
```

**Response (200):**

```json
{
  "indicators": {
    "vix": 18.5,
    "tnx": 4.25,
    "tyx": 4.55,
    "irx": 4.10,
    "dxy": 102.3,
    "vvix": 92.5,
    "spread_10y3m": 0.15
  },
  "updated_at": "2026-06-07T12:00:00Z"
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `indicators` | object | Indicator key-value pairs |
| `indicators.vix` | number | CBOE Volatility Index |
| `indicators.tnx` | number | 10-Year US Treasury Yield |
| `indicators.tyx` | number | 30-Year US Treasury Yield |
| `indicators.irx` | number | 3-Month US Treasury Yield |
| `indicators.dxy` | number | US Dollar Index |
| `indicators.vvix` | number | VIX of VIX (volatility of the VIX index) |
| `indicators.spread_10y3m` | number | 10Y-3M yield spread (server-side calculated: TNX - IRX) |
| `updated_at` | string | Data update time |

**Indicator and yfinance Symbol Mapping:**

| Field Name | yfinance Symbol | Description | Typical Range |
|------------|-----------------|-------------|---------------|
| `vix` | `^VIX` | CBOE Volatility Index | 12-30 |
| `tnx` | `^TNX` | 10-Year Treasury Yield (%) | 3.5-5.0 |
| `tyx` | `^TYX` | 30-Year Treasury Yield (%) | 4.0-5.5 |
| `irx` | `^IRX` | 3-Month Treasury Yield (%) | 4.0-5.5 |
| `dxy` | `DX-Y.NYB` | US Dollar Index | 95-110 |
| `vvix` | `^VVIX` | VIX of VIX | 80-120 |

**10Y-3M Spread (spread_10y3m):**

```
spread_10y3m = TNX - IRX
```

- A positive value indicates a normal term structure (long-term yields are higher than short-term)
- A negative value indicates an inverted yield curve, which is typically considered a leading indicator of economic recession

**Caching Behavior:** Data is accelerated through dual caching: yfinance TTL cache (5 minutes) and live cache (10 minutes). If fetching a specific indicator fails, that field's value will be `null` without affecting other indicators.

**Error Responses:**

```json
// 502 - Data source error
{
  "error": "data_source_error",
  "message": "Failed to fetch macro_current for MACRO: <error details>",
  "timestamp": "2026-06-07T12:00:00Z",
  "details": {
    "ticker": "MACRO",
    "source": "macro_current",
    "reason": "<original error message>"
  }
}
```

---

## GET /api/macro/history

Retrieves historical time series data for specified macroeconomic indicators. Supports querying a single or multiple indicators, automatically aligned by date.

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `indicators` | string | No | `VIX` | Comma-separated list of indicator names |
| `days` | integer | No | `90` | Number of historical days |

**Available Indicator Values:**
- `VIX` - CBOE Volatility Index
- `TNX` - 10-Year Treasury Yield
- `TYX` - 30-Year Treasury Yield
- `IRX` - 3-Month Treasury Yield
- `DXY` - US Dollar Index
- `VVIX` - VIX of VIX
- `SPREAD` - 10Y-3M spread (server-side calculated, derived from TNX and IRX)

**Request Example:**

```
GET /api/macro/history?indicators=VIX,TNX,DXY&days=30
```

**Response (200):**

```json
{
  "indicators": ["vix", "tnx", "dxy"],
  "dates": ["2026-05-08", "2026-05-09", "2026-05-12", "2026-05-13"],
  "vix": [18.5, 19.2, 17.8, 18.1],
  "tnx": [4.25, 4.28, 4.22, 4.30],
  "dxy": [102.3, 102.1, 101.8, 102.5],
  "updated_at": "2026-06-07T12:00:00Z"
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `indicators` | string[] | List of requested indicator names (lowercase) |
| `dates` | string[] | Array of dates, sorted in ascending order; all indicators are aligned to this |
| `{indicator}` | number[] | Time series values for each indicator, one-to-one correspondence with `dates` |
| `updated_at` | string | Data update time |

**SPREAD Special Handling:**

When the request includes `SPREAD`, the server separately fetches historical data for TNX and IRX, takes the intersection of dates, and then calculates the spread:

```
spread[date] = TNX[date] - IRX[date]
```

The field name in the response is `spread` (lowercase).

**Request Example (with SPREAD):**

```
GET /api/macro/history?indicators=VIX,SPREAD&days=60
```

**Response:**

```json
{
  "indicators": ["vix", "spread"],
  "dates": ["2026-05-08", "2026-05-09", "2026-05-12"],
  "vix": [18.5, 19.2, 17.8],
  "spread": [0.15, 0.13, 0.12],
  "updated_at": "2026-06-07T12:00:00Z"
}
```

**Error Responses:**

```json
// 400 - Invalid indicators
{
  "error": "invalid_indicators",
  "message": "No valid indicators in: INVALID1,INVALID2. Valid: ['VIX', 'TNX', 'TYX', 'IRX', 'DXY', 'VVIX'], SPREAD",
  "timestamp": "2026-06-07T12:00:00Z"
}

// 502 - Data source error
{
  "error": "data_source_error",
  "message": "Failed to fetch macro_history for MACRO: <error details>",
  "timestamp": "2026-06-07T12:00:00Z",
  "details": {
    "ticker": "MACRO",
    "source": "macro_history",
    "reason": "<original error message>"
  }
}
```

**Caching Behavior:** Historical data for each indicator is accelerated through the yfinance TTL cache (5 minutes). Requests for multiple indicators are cached separately, and results are aligned by date when combined.
