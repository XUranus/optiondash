---
sidebar_position: 1
title: 'API Overview'
---

# API Overview

## Basic Information

| Item | Value |
|------|-------|
| Base URL | `http://localhost:5001/api` |
| Content-Type | `application/json` |
| Protocol | HTTP / HTTPS |
| Encoding | UTF-8 |

All API responses are in JSON format. Error responses follow a unified error structure.

## API Groups

| Group | Prefix | Endpoint Count | Description |
|-------|--------|----------------|-------------|
| Health | `/api/health`, `/api/tickers` | 2 | Health check and configuration |
| Dashboard | `/api/dashboard/*` | 2 | Core metrics overview |
| Strikes | `/api/strikes/*` | 3 | Strike-level analysis |
| Comparison | `/api/comparison/*` | 1 | Multi-ticker comparison |
| Historical | `/api/historical/*` | 5 | Historical trend data |
| Macro | `/api/macro/*` | 2 | Macroeconomic indicators |
| **Total** | | **15** | |

## Common Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ticker` | string | `SPY` | Stock/ETF ticker symbol, must be in the `SUPPORTED_TICKERS` configuration |
| `expiration` | string | Nearest expiration | Option expiration date, format `YYYY-MM-DD` |
| `days` | integer | `90` | Number of days for historical data queries |

## Supported Tickers

The following tickers are supported by default and can be configured via the `SUPPORTED_TICKERS` environment variable:

- `SPY` - S&P 500 ETF
- `QQQ` - Nasdaq 100 ETF
- `IWM` - Russell 2000 ETF
- `TLT` - 20+ Year US Treasury Bond ETF
- `XLF` - Financial Sector ETF

## Common Error Format

All error responses follow this structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error description",
  "timestamp": "2026-06-07T12:00:00Z",
  "details": {
    "ticker": "INVALID",
    "source": "yfinance"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | Error code in UPPER_SNAKE_CASE |
| `message` | string | Error description message |
| `timestamp` | string | ISO 8601 UTC timestamp |
| `details` | object | Optional, contains additional context information |

## Caching Strategy

The system uses a two-layer caching mechanism to accelerate responses:

1. **Live Cache** - A background poller refreshes data every 5 minutes, storing it in memory and the SQLite `live_cache` table with a TTL of 10 minutes.
2. **TTL Memory Cache** - yfinance request results are cached for 5 minutes (`CACHE_TTL=300`) to avoid frequent external API calls.

When cache is hit, response time is < 10ms; when real-time data fetching is needed, response time is 1-5 seconds (depending on Yahoo Finance response speed); historical database queries are < 100ms.

## Authentication

The API currently does not require authentication. CORS is configured to only allow cross-origin requests from `http://localhost:5173` (Vite dev server).

## Error Handling Details

For a complete list of error codes and handling methods, see [Error Handling](./errors.md).
