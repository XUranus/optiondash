---
sidebar_position: 2
title: 'Backend Architecture'
---

# Backend Architecture

The OptionDash backend uses the Flask application factory pattern, organizes routes through Blueprints, encapsulates business logic in the service layer, and provides infrastructure such as caching and rate limiting in the utility layer.

---

## Application Factory Pattern

The Flask application is created through the `create_app()` factory function located in `backend/app.py`. The factory function performs the following initialization steps:

```mermaid
graph TD
    START["create_app()"] --> CONFIG["Load Config"]
    CONFIG --> CORS["Configure CORS"]
    CORS --> BP["Register 6 Blueprints"]
    BP --> LOG["Configure Logging"]
    LOG --> SCHED["Start APScheduler"]
    SCHED --> APP["Return Flask app instance"]

    SCHED --> SNAPJOB["daily_snapshot_job<br/>Daily snapshot (16:30 ET)"]
    SCHED --> POLLJOB["poll_all_tickers<br/>Background polling (every 5 min)"]
    SCHED --> INITPOLL["poll_all_tickers<br/>Immediate first execution"]
```

**Startup Flow**:

1. Load configuration from the `Config` class (database path, cache TTL, supported tickers, etc.)
2. Configure CORS to allow cross-origin access from the frontend
3. Register 6 Blueprints in order
4. Configure log format and level
5. Start APScheduler and register scheduled tasks
6. Return the Flask application instance

---

## Blueprint Structure

The system has a total of 6 Blueprints, each responsible for a group of related API endpoints:

```mermaid
graph LR
    subgraph "health_bp"
        H1["GET /api/health"]
        H2["GET /api/tickers"]
    end

    subgraph "dashboard_bp"
        D1["GET /api/dashboard/summary"]
        D2["GET /api/dashboard/expirations"]
    end

    subgraph "strikes_bp"
        S1["GET /api/strikes/oi-wall"]
        S2["GET /api/strikes/max-pain-curve"]
        S3["GET /api/strikes/gex-distribution"]
    end

    subgraph "comparison_bp"
        C1["GET /api/comparison/overview"]
    end

    subgraph "historical_bp"
        HI1["GET /api/historical/max-pain-vs-price"]
        HI2["GET /api/historical/pcr-gex"]
        HI3["GET /api/historical/volatility"]
        HI4["GET /api/historical/skew"]
        HI5["POST /api/historical/ingest"]
    end

    subgraph "macro_bp"
        MA1["GET /api/macro/current"]
        MA2["GET /api/macro/history"]
    end
```

| Blueprint | Route Prefix | Endpoint Count | Responsibility |
|-----------|-------------|----------------|----------------|
| `health_bp` | `/api` | 2 | Health check, supported ticker list |
| `dashboard_bp` | `/api/dashboard` | 2 | Dashboard summary, expiration list |
| `strikes_bp` | `/api/strikes` | 3 | OI Wall, Max Pain curve, GEX distribution |
| `comparison_bp` | `/api/comparison` | 1 | Multi-ticker cross comparison |
| `historical_bp` | `/api/historical` | 4 GET + 1 POST | Historical trend data, data ingestion |
| `macro_bp` | `/api/macro` | 2 | Macroeconomic indicators (current and historical) |

---

## Service Layer

The service layer is the core business logic layer of the system. Each service module focuses on calculating a specific type of options analysis indicator:

```mermaid
graph TB
    subgraph "Data Fetching"
        MKD["market_data.py<br/>yfinance wrapper"]
        MACRO["macro_data.py<br/>Macro indicator fetching"]
    end

    subgraph "Indicator Calculation Engines"
        GRK["greeks_engine.py<br/>Black-Scholes Greeks"]
        MP["max_pain.py<br/>Max Pain calculation"]
        PCR["pcr.py<br/>Put/Call Ratio"]
        GEX["gex.py<br/>Gamma Exposure"]
        VOL["volatility.py<br/>HV, VRP, Skew"]
        ANO["anomaly.py<br/>Anomaly detection"]
    end

    subgraph "Cache Service"
        LC["live_cache.py<br/>SQLite cache layer"]
    end

    MKD -- "Raw options chain" --> GRK
    GRK -- "Enriched options chain with Greeks" --> MP
    GRK --> PCR
    GRK --> GEX
    GRK --> VOL
    PCR --> ANO
    GEX --> ANO
    LC -- "Read/Write cache" --> MKD
    LC -- "Read/Write cache" --> MACRO
```

### Service Module Details

| Module | File | Responsibility | Dependencies |
|--------|------|----------------|--------------|
| `market_data` | `services/market_data.py` | yfinance wrapper: fetch ticker info, expirations, options chain, historical prices | `utils/cache`, `utils/rate_limiter` |
| `greeks_engine` | `services/greeks_engine.py` | Batch calculation of Black-Scholes Greeks (delta, gamma, theta, vega, rho) | `py_vollib_vectorized`, `numpy` |
| `max_pain` | `services/max_pain.py` | Calculate Max Pain strike (the strike where option holders have minimum total loss) | `numpy`, `pandas` |
| `pcr` | `services/pcr.py` | Calculate Put/Call Ratio (volume ratio + OI ratio + composite signal) | `utils/helpers` |
| `gex` | `services/gex.py` | Calculate Gamma Exposure (dealer-perspective gamma exposure) | `numpy`, `pandas` |
| `volatility` | `services/volatility.py` | Calculate Historical Volatility (HV), ATM Implied Volatility (ATM IV), Volatility Risk Premium (VRP), 25-Delta Skew | `scipy`, `numpy` |
| `anomaly` | `services/anomaly.py` | Anomaly detection: PCR extremes, large price moves, OI spikes, GEX sign flips | `numpy` |
| `macro_data` | `services/macro_data.py` | Fetch macroeconomic indicators: VIX, TNX, TYX, IRX, DXY, VVIX | `yfinance`, `utils/cache`, `utils/rate_limiter` |
| `live_cache` | `services/live_cache.py` | SQLite cache layer: read, write, expiration check, cleanup old entries | `database.connection` |

---

## Utility Layer

The utility layer provides infrastructure for cross-cutting concerns:

```mermaid
graph LR
    subgraph "utils/"
        CACHE["cache.py<br/>TTLCache wrapper"]
        RL["rate_limiter.py<br/>Token Bucket rate limiting"]
        HELP["helpers.py<br/>Formatting, safe division"]
        ERR["errors.py<br/>Unified error responses"]
    end

    MKD["market_data"] --> CACHE
    MKD --> RL
    MACRO["macro_data"] --> CACHE
    MACRO --> RL
    PCR["pcr"] --> HELP
    GEX["gex"] --> HELP
    API["Blueprints"] --> ERR
```

| Module | File | Responsibility |
|--------|------|----------------|
| `CacheManager` | `utils/cache.py` | In-memory cache based on `cachetools.TTLCache`, TTL 5 minutes, max 128 entries |
| `RateLimiter` | `utils/rate_limiter.py` | Token Bucket algorithm rate limiting, default 2 requests/second, thread-safe |
| `helpers` | `utils/helpers.py` | Utility functions: `safe_divide`, `safe_float`, `safe_int`, `format_large_number`, etc. |
| `errors` | `utils/errors.py` | Unified error response format with error, message, and details fields |

---

## Request Handling Flow

Using `GET /api/dashboard/summary?ticker=SPY` as an example, here is the complete request handling flow:

```mermaid
sequenceDiagram
    participant Client as Client
    participant BP as Blueprint (dashboard_bp)
    participant LC as live_cache (SQLite)
    participant MC as Memory Cache (TTLCache)
    participant MKD as market_data
    participant RL as rate_limiter
    participant YF as Yahoo Finance
    participant SVC as Indicator Calculation Services

    Client->>BP: GET /api/dashboard/summary?ticker=SPY

    Note over BP: 1. Parameter validation<br/>Check if ticker is in SUPPORTED_TICKERS

    BP->>LC: get_cached("SPY", "summary")

    alt Live Cache hit and not expired
        LC-->>BP: Return cached summary JSON
        BP-->>Client: 200 OK (cached data)
    else Live Cache miss or expired
        BP->>MKD: get_ticker_info("SPY")
        MKD->>MC: cache.get("ticker_info:SPY")

        alt Memory cache hit
            MC-->>MKD: Return cached data
        else Memory cache miss
            MKD->>RL: rate_limiter.wait()
            RL-->>MKD: Acquire token
            MKD->>YF: yf.Ticker("SPY").fast_info
            YF-->>MKD: Return ticker info
            MKD->>MKD: Normalize column names (camelCase -> snake_case)
            MKD->>MC: cache.set("ticker_info:SPY", data)
        end

        MKD-->>BP: ticker_info

        BP->>MKD: get_options_chain("SPY")
        Note over MKD: Fetch options chain for the nearest expiration
        MKD-->>BP: chain (calls/puts DataFrames)

        BP->>SVC: compute_chain_greeks(chain)
        Note over SVC: Batch Black-Scholes calculation<br/>delta, gamma, theta, vega, rho
        SVC-->>BP: Enriched chain

        BP->>SVC: calculate_max_pain(calls, puts)
        BP->>SVC: calculate_pcr(calls, puts)
        BP->>SVC: calculate_gex(calls, puts, spot)

        SVC-->>BP: Calculation results

        Note over BP: Assemble summary dict

        BP->>LC: set_cached("SPY", "summary", data)
        BP-->>Client: 200 OK (freshly computed data)
    end
```

---

## Error Handling

The backend uses a unified error response format:

```json
{
  "error": "Bad Request",
  "message": "Ticker 'INVALID' is not supported",
  "details": {
    "supported_tickers": ["SPY", "QQQ", "IWM", "TLT", "XLF"]
  }
}
```

Error handling strategy:

- **Parameter validation errors**: Return 400 Bad Request
- **Data source unavailable**: Attempt to return stale cached data; return 503 if no cache is available
- **Internal errors**: Return 500 Internal Server Error with detailed logging
- **Greeks calculation failure**: Automatically fall back to per-contract calculation (batch -> per-contract fallback)
