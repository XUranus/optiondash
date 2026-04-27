# API Reference

Base URL: `http://localhost:5001/api`

All endpoints return JSON. Dates are `YYYY-MM-DD` format. Timestamps are ISO 8601.

---

## Health

### `GET /api/health`

Health check endpoint.

**Response**
```json
{
  "status": "ok",
  "service": "optiondash-api",
  "timestamp": "2026-04-27T12:00:00.000000+00:00"
}
```

---

## Dashboard

### `GET /api/dashboard/summary`

Core indicator overview for a single ticker.

**Parameters**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol (SPY, QQQ, IWM, TLT, XLF) |
| `expiration` | string | No | nearest ≥3d | Option expiration date (YYYY-MM-DD) |

**Response**
```json
{
  "ticker": "SPY",
  "spot_price": 542.31,
  "daily_change": -0.82,
  "daily_change_pct": -0.15,
  "max_pain": 540.00,
  "deviation_from_max_pain": 2.31,
  "pcr": {
    "volume": 1.23,
    "oi": 0.87,
    "signal": "neutral"
  },
  "gex": {
    "value": -1010000000,
    "formatted": "-$1.01B",
    "regime": "negative_gamma"
  },
  "atm_iv": 0.1845,
  "expiration_used": "2026-05-01",
  "updated_at": "2026-04-26T15:30:00Z"
}
```

**PCR signal thresholds**

| Condition | Signal |
|-----------|--------|
| Composite > 1.2 | `bearish` |
| Composite < 0.7 | `bullish` |
| Otherwise | `neutral` |

Composite = `pcr_oi × 0.6 + pcr_volume × 0.4`

**GEX regime**

| Condition | Regime | Meaning |
|-----------|--------|---------|
| GEX > 0 | `positive_gamma` | Dealers dampen volatility |
| GEX < 0 | `negative_gamma` | Dealers amplify volatility |

---

### `GET /api/dashboard/expirations`

List available option expiration dates.

**Parameters**

| Param | Type | Required | Default |
|-------|------|----------|---------|
| `ticker` | string | No | `SPY` |

**Response**
```json
{
  "ticker": "SPY",
  "expirations": ["2026-04-30", "2026-05-01", "2026-05-08", "..."]
}
```

---

## Strike Analysis

All strike endpoints accept the same parameters.

**Parameters**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `expiration` | string | No | nearest ≥3d | Option expiration date |

### `GET /api/strikes/oi-wall`

Open Interest by strike for bidirectional bar chart.

**Response**
```json
{
  "ticker": "SPY",
  "expiration": "2026-05-01",
  "spot_price": 542.31,
  "max_pain": 540.00,
  "strikes": [500.0, 505.0, 510.0, "..."],
  "call_oi": [5000, 12000, 8000, "..."],
  "put_oi": [3000, 9000, 15000, "..."]
}
```

### `GET /api/strikes/max-pain-curve`

Total option holder loss at each possible settlement price. The lowest point is Max Pain.

**Response**
```json
{
  "ticker": "SPY",
  "expiration": "2026-05-01",
  "strikes": [500.0, 505.0, 510.0, "..."],
  "total_loss": [1250000000, 1100000000, 980000000, "..."],
  "max_pain_strike": 540.00
}
```

### `GET /api/strikes/gex-distribution`

Gamma Exposure net value per strike.

**Response**
```json
{
  "ticker": "SPY",
  "expiration": "2026-05-01",
  "spot_price": 542.31,
  "strikes": [500.0, 505.0, 510.0, "..."],
  "gex_per_strike": [-50000000, -20000000, 15000000, "..."],
  "total_gex": -1010000000
}
```

---

## Comparison

### `GET /api/comparison/overview`

Multi-ticker comparison with anomaly detection.

**Parameters**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `tickers` | string | No | `SPY,QQQ,IWM` | Comma-separated tickers |
| `expiration` | string | No | nearest ≥3d | Option expiration date |

**Response**
```json
{
  "data": [
    {
      "ticker": "SPY",
      "spot_price": 542.31,
      "daily_change_pct": -0.15,
      "max_pain": 540.00,
      "deviation_from_max_pain": 2.31,
      "pcr": { "volume": 1.23, "oi": 0.87, "signal": "neutral" },
      "gex": { "value": -1010000000, "formatted": "-$1.01B", "regime": "negative_gamma" },
      "total_call_oi": 500000,
      "total_put_oi": 435000,
      "total_call_volume": 120000,
      "total_put_volume": 147600,
      "anomalies": [
        { "field": "pcr", "value": 0.87, "change_pct": 0, "type": "extreme" }
      ]
    }
  ],
  "expiration_used": "nearest",
  "updated_at": "2026-04-27T12:00:00Z"
}
```

**Anomaly types**

| Type | Trigger |
|------|---------|
| `extreme` | PCR > 2.0 or PCR < 0.5 |
| `spike` | OI increase > 20% vs 5-day avg, or price up > 3% |
| `drop` | OI decrease > 20% vs 5-day avg, or price down < -3% |
| `flip` | GEX sign changed (positive → negative, or vice versa) |

---

## Historical

All historical endpoints share these parameters:

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `days` | int | No | `90` | Lookback window |

### `GET /api/historical/max-pain-vs-price`

**Response**
```json
{
  "ticker": "SPY",
  "dates": ["2026-04-01", "2026-04-02", "..."],
  "prices": [535.20, 537.10, "..."],
  "max_pains": [537.00, 537.50, "..."]
}
```

### `GET /api/historical/pcr-gex`

**Response**
```json
{
  "ticker": "SPY",
  "dates": ["2026-04-01", "2026-04-02", "..."],
  "pcr_volume": [1.15, 1.20, "..."],
  "pcr_oi": [0.88, 0.90, "..."],
  "gex": [-950000000, -1010000000, "..."]
}
```

### `GET /api/historical/volatility`

**Response**
```json
{
  "ticker": "SPY",
  "dates": ["2026-04-01", "2026-04-02", "..."],
  "atm_iv": [0.1850, 0.1920, "..."],
  "hv30": [0.1620, 0.1650, "..."],
  "vrp": [0.0230, 0.0270, "..."]
}
```

All volatility values are decimal (multiply by 100 for percent). VRP = ATM_IV − HV30.

### `GET /api/historical/skew`

**Response**
```json
{
  "ticker": "SPY",
  "dates": ["2026-04-01", "2026-04-02", "..."],
  "skew_25d": [0.0320, 0.0350, "..."]
}
```

Skew values are decimal. Positive skew = puts more expensive than calls (bearish skew).

### `POST /api/historical/snapshot`

Manually trigger a data snapshot capture for a ticker.

**Request Body**
```json
{
  "ticker": "SPY",
  "date": "2026-04-27"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `ticker` | string | No | `SPY` | Ticker symbol |
| `date` | string | No | today (UTC) | Snapshot date (YYYY-MM-DD) |

**Response**
```json
{
  "status": "ok",
  "ticker": "SPY",
  "date": "2026-04-27",
  "records_created": 406
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "error_code",
  "message": "Human-readable description"
}
```

HTTP status codes: `200` (success), `500` (server error).
