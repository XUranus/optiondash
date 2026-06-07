---
sidebar_position: 3
title: 'Strikes API'
---

# Strikes API

The Strikes API provides strike-level option data analysis, including OI Wall, Max Pain curve, and GEX distribution.

---

## GET /api/strikes/oi-wall

Returns call/put option open interest (OI) data for each strike price, used to draw a dual-sided bar chart (OI Wall).

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `expiration` | string | No | Nearest expiration | Expiration date, format `YYYY-MM-DD` |

**Request Example:**

```
GET /api/strikes/oi-wall?ticker=SPY&expiration=2026-06-20
```

**Response (200):**

```json
{
  "ticker": "SPY",
  "expiration": "2026-06-20",
  "spot_price": 585.42,
  "max_pain": 585.0,
  "strikes": [570, 575, 580, 585, 590, 595, 600],
  "call_oi": [15000, 22000, 35000, 42000, 38000, 25000, 18000],
  "put_oi": [20000, 28000, 32000, 45000, 40000, 30000, 22000]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Ticker symbol |
| `expiration` | string | Expiration date |
| `spot_price` | number | Current spot price |
| `max_pain` | number | Max Pain strike price |
| `strikes` | number[] | Array of strike prices, sorted in ascending order |
| `call_oi` | number[] | Call option open interest at each strike, one-to-one correspondence with `strikes` |
| `put_oi` | number[] | Put option open interest at each strike, one-to-one correspondence with `strikes` |

**Data Notes:**
- `strikes` is the union of call and put option strike prices, sorted in ascending order
- Missing strike prices in `call_oi` and `put_oi` default to 0
- The frontend typically renders this data as a dual-sided horizontal bar chart centered on the spot price

---

## GET /api/strikes/max-pain-curve

Returns the total loss for option buyers at each strike price, used to draw the Max Pain curve. The Max Pain point is the strike price where option buyers' total loss is minimized and option sellers' profit is maximized.

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `expiration` | string | No | Nearest expiration | Expiration date, format `YYYY-MM-DD` |

**Request Example:**

```
GET /api/strikes/max-pain-curve?ticker=SPY&expiration=2026-06-20
```

**Response (200):**

```json
{
  "ticker": "SPY",
  "expiration": "2026-06-20",
  "strikes": [570, 575, 580, 585, 590, 595, 600],
  "total_loss": [125000000, 89000000, 52000000, 35000000, 48000000, 78000000, 115000000],
  "max_pain_strike": 585
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Ticker symbol |
| `expiration` | string | Expiration date |
| `strikes` | number[] | Array of strike prices |
| `total_loss` | number[] | Total loss for option buyers at each strike price (in dollars) |
| `max_pain_strike` | number | Max Pain strike price (the point with the minimum total loss) |

**Data Notes:**
- The `total_loss` array has a one-to-one correspondence with the `strikes` array
- `max_pain_strike` equals the `strikes` value corresponding to the minimum value in `total_loss`
- Max Pain theory suggests that the spot price tends to converge toward the Max Pain strike price before expiration

---

## GET /api/strikes/gex-distribution

Returns the net Gamma Exposure distribution at each strike price, used to draw the GEX distribution chart. Helps identify key areas of Gamma concentration.

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `expiration` | string | No | Nearest expiration | Expiration date, format `YYYY-MM-DD` |

**Request Example:**

```
GET /api/strikes/gex-distribution?ticker=SPY&expiration=2026-06-20
```

**Response (200):**

```json
{
  "ticker": "SPY",
  "expiration": "2026-06-20",
  "spot_price": 585.42,
  "strikes": [570, 575, 580, 585, 590, 595, 600],
  "gex_per_strike": [-5000000, -2000000, 3000000, 8000000, 5000000, -1000000, -4000000],
  "total_gex": 4000000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Ticker symbol |
| `expiration` | string | Expiration date |
| `spot_price` | number | Current spot price |
| `strikes` | number[] | Array of strike prices |
| `gex_per_strike` | number[] | Net GEX at each strike price (in dollars). Positive values indicate long Gamma, negative values indicate short Gamma |
| `total_gex` | number | Sum of GEX across all strike prices |

**GEX Calculation Logic:**

The GEX at each strike price is determined by the Gamma and OI of both call and put options:

```
call_gex = -call_OI x call_gamma x 100 x spot_price
put_gex  = +put_OI  x put_gamma  x 100 x spot_price
net_gex  = call_gex + put_gex
```

- Call option GEX uses a negative sign (from the market maker's perspective, selling calls is short Gamma)
- Put option GEX uses a positive sign (market makers buying puts are long Gamma)
- Multiplied by 100 because each option contract represents 100 shares
- `total_gex` is the sum of `net_gex` across all strike prices

---

## Common Error Responses

All Strikes API endpoints share the following error scenarios:

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

**502 - Data Source Error:**

```json
{
  "error": "data_source_error",
  "message": "Failed to fetch gex_distribution for SPY: <error details>",
  "timestamp": "2026-06-07T12:00:00Z",
  "details": {
    "ticker": "SPY",
    "source": "gex_distribution",
    "reason": "<original error message>"
  }
}
```

**Caching Behavior:** All three endpoints support live caching. If the request specifies an `expiration` but the cached expiration date does not match, the cache is bypassed and data is fetched directly.
