---
sidebar_position: 2
title: 'Dashboard API'
---

# Dashboard API

The Dashboard API provides a core metrics overview, including health checks, supported ticker list, real-time summaries, and expiration date queries.

---

## GET /api/health

A health check endpoint used to confirm the service is running normally.

**Request Example:**

```
GET /api/health
```

**Response (200):**

```json
{
  "status": "ok",
  "service": "optiondash-api",
  "timestamp": "2026-06-07T12:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"ok"` |
| `service` | string | Service name `"optiondash-api"` |
| `timestamp` | string | Current UTC time in ISO 8601 format |

---

## GET /api/tickers

Returns the list of tickers supported by the current configuration.

**Request Example:**

```
GET /api/tickers
```

**Response (200):**

```json
{
  "tickers": ["SPY", "QQQ", "IWM", "TLT", "XLF"],
  "default": "SPY"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tickers` | string[] | Array of supported ticker symbols |
| `default` | string | Default ticker (first element of the array) |

**Note:** The ticker list is configured by the `SUPPORTED_TICKERS` environment variable, with a default value of `SPY,QQQ,IWM,TLT,XLF`. The frontend requests this endpoint at startup; if the request fails, it falls back to the built-in `FALLBACK_TICKERS` constant.

---

## GET /api/dashboard/summary

The core dashboard endpoint that returns all key metrics for a given ticker. This is the primary data source for the frontend homepage.

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `expiration` | string | No | Nearest expiration | Expiration date, format `YYYY-MM-DD` |

**Request Example:**

```
GET /api/dashboard/summary?ticker=SPY&expiration=2026-06-20
```

**Response (200):**

```json
{
  "ticker": "SPY",
  "spot_price": 585.42,
  "daily_change": 2.15,
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
  "atm_iv": 0.185,
  "expiration_used": "2026-06-20",
  "updated_at": "2026-06-07T12:00:00Z"
}
```

**Response Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Requested ticker symbol |
| `spot_price` | number | Current spot price |
| `daily_change` | number | Intraday price change (absolute value) |
| `daily_change_pct` | number | Intraday price change percentage |
| `max_pain` | number | Max Pain strike price |
| `deviation_from_max_pain` | number | Deviation of spot price from Max Pain (`spot_price - max_pain`) |
| `pcr` | object | Put/Call Ratio data |
| `pcr.volume` | number | Volume PCR |
| `pcr.oi` | number | Open Interest PCR |
| `pcr.signal` | string | Signal: `"bullish"` / `"neutral"` / `"bearish"` |
| `gex` | object | Gamma Exposure data |
| `gex.value` | number | GEX absolute value (in dollars) |
| `gex.formatted` | string | Formatted GEX (e.g., `$2.50B`, `-$800.00M`) |
| `gex.regime` | string | GEX regime: `"positive_gamma"` / `"negative_gamma"` |
| `atm_iv` | number | At-the-money implied volatility |
| `expiration_used` | string | Expiration date actually used |
| `updated_at` | string | Data update time |

**PCR Signal Logic:**

The signal is determined by a weighted composite of `pcr.oi` and `pcr.volume`:

```
composite = pcr_oi x 0.6 + pcr_volume x 0.4
```

| Condition | Signal | Meaning |
|-----------|--------|---------|
| `composite > 1.2` | `"bearish"` | Bearish sentiment dominates |
| `composite < 0.7` | `"bullish"` | Bullish sentiment dominates |
| `0.7 <= composite <= 1.2` | `"neutral"` | Neutral |

**GEX Regime Logic:**

| Condition | Regime | Meaning |
|-----------|--------|---------|
| `GEX > 0` | `"positive_gamma"` | Market makers are long Gamma, dampening volatility |
| `GEX <= 0` | `"negative_gamma"` | Market makers are short Gamma, amplifying volatility |

**Caching Behavior:** Live cache data is returned with priority. If the request specifies an `expiration` but the cached expiration date does not match, the system falls back to fetching data directly from yfinance.

**Error Responses:**

```json
// 400 - Unsupported ticker
{
  "error": "unsupported_ticker",
  "message": "Ticker 'INVALID' is not supported. Supported: SPY, QQQ, IWM, TLT, XLF",
  "timestamp": "2026-06-07T12:00:00Z",
  "details": {
    "ticker": "INVALID",
    "supported": ["SPY", "QQQ", "IWM", "TLT", "XLF"]
  }
}

// 502 - Data source error
{
  "error": "data_source_error",
  "message": "Failed to fetch dashboard_summary for SPY: <error details>",
  "timestamp": "2026-06-07T12:00:00Z",
  "details": {
    "ticker": "SPY",
    "source": "dashboard_summary",
    "reason": "<original error message>"
  }
}
```

---

## GET /api/dashboard/expirations

Returns the list of available option expiration dates for a given ticker.

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |

**Request Example:**

```
GET /api/dashboard/expirations?ticker=SPY
```

**Response (200):**

```json
{
  "ticker": "SPY",
  "expirations": [
    "2026-06-13",
    "2026-06-20",
    "2026-06-27",
    "2026-07-03",
    "2026-07-11",
    "2026-07-18",
    "2026-08-15"
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Requested ticker symbol |
| `expirations` | string[] | Array of available expiration dates, sorted in ascending order |

**Note:** The expiration date list comes from Yahoo Finance and depends on currently available option contracts in the market. Data is accelerated through live caching. The frontend uses this list to populate the expiration date picker.

**Error Responses:**

```json
// 400 - Unsupported ticker
{
  "error": "unsupported_ticker",
  "message": "Ticker 'INVALID' is not supported. Supported: SPY, QQQ, IWM, TLT, XLF",
  "timestamp": "2026-06-07T12:00:00Z",
  "details": {
    "ticker": "INVALID",
    "supported": ["SPY", "QQQ", "IWM", "TLT", "XLF"]
  }
}

// 502 - Data source error
{
  "error": "data_source_error",
  "message": "Failed to fetch expirations for SPY: <error details>",
  "timestamp": "2026-06-07T12:00:00Z",
  "details": {
    "ticker": "SPY",
    "source": "expirations",
    "reason": "<original error message>"
  }
}
```
