---
sidebar_position: 5
title: 'Caching Strategy'
---

# Caching Strategy

OptionDash uses a three-layer cache architecture that balances data freshness, access speed, and persistence. Fetching data from Yahoo Finance has high latency (including network and rate limiting), so caching is critical for ensuring fast API responses.

---

## Three-Layer Cache Architecture

```mermaid
graph TB
    subgraph "Layer 1: Memory Cache (Fastest)"
        L1["cachetools.TTLCache<br/>TTL: 5 min | Max 128 entries<br/>In-process, lost on restart"]
    end

    subgraph "Layer 2: SQLite Live Cache (Moderate)"
        L2["live_cache table<br/>TTL: 10 min | No entry limit<br/>Shared across threads, persists after restart"]
    end

    subgraph "Layer 3: Historical Storage (Permanent)"
        L3["daily_snapshots<br/>strike_snapshots<br/>macro_snapshots<br/>Permanent storage, used for trend analysis"]
    end

    API["API Request"] --> L2
    L2 -- "Miss/Expired" --> L1
    L1 -- "Miss/Expired" --> YF["Yahoo Finance real-time fetch"]
    YF -- "Update" --> L1
    YF -- "Update" --> L2

    POLLER["Background Poller"] -- "Periodic warming" --> L2
    DAILY["Daily Snapshot"] -- "Write" --> L3
    L3 -- "Historical queries" --> HISTAPI["Historical API"]
```

---

## Layer 1: In-Memory TTL Cache

The memory cache is the fastest cache layer, residing in process memory, used to avoid redundant yfinance calls.

### Implementation

```python
# utils/cache.py
from cachetools import TTLCache

class CacheManager:
    def __init__(self, maxsize=128, ttl=300):
        self._cache = TTLCache(maxsize=maxsize, ttl=ttl)
```

### Properties

| Attribute | Value | Description |
|-----------|-------|-------------|
| Technology | `cachetools.TTLCache` | Time-based automatic expiration cache |
| TTL | 300 seconds (5 minutes) | Configurable via `CACHE_TTL` environment variable |
| Max entries | 128 | Configurable via `CACHE_MAX_SIZE` environment variable |
| Thread-safe | No (single-thread access) | Each request thread accesses independently |
| Persistence | None | Lost on process restart |

### Cache Key Format

| Key Format | Data | Used By |
|------------|------|---------|
| `ticker_info:{ticker}` | Ticker info (price, change) | `market_data.get_ticker_info()` |
| `expirations:{ticker}` | Expiration date list | `market_data.get_expirations()` |
| `chain:{ticker}:{expiration}` | Complete options chain | `market_data.get_options_chain()` |
| `hist_price:{ticker}:{period}` | Historical prices | `market_data.get_historical_prices()` |
| `macro:{symbol}` | Current macro indicator value | `macro_data.get_macro_indicator()` |
| `macro_hist:{symbol}:{period}` | Macro indicator historical data | `macro_data.get_macro_history()` |

---

## Layer 2: SQLite Live Cache

Live Cache is the intermediate cache layer stored in the SQLite database. API endpoints read directly from it to avoid calling the service layer for every request.

### Implementation

```python
# services/live_cache.py
def get_cached(ticker: str, cache_key: str) -> dict | None:
    """Read from live_cache table, return None if expired."""
    row = db.execute_one(
        "SELECT data_json, updated_at FROM live_cache WHERE ticker = ? AND cache_key = ?",
        (ticker.upper(), cache_key),
    )
    if not row:
        return None
    age = (datetime.now(timezone.utc) - updated_at).total_seconds()
    if age > Config.LIVE_CACHE_TTL_SEC:
        return None
    return json.loads(row["data_json"])
```

### Properties

| Attribute | Value | Description |
|-----------|-------|-------------|
| Technology | SQLite `live_cache` table | JSON serialized storage |
| TTL | 600 seconds (10 minutes) | Configurable via `LIVE_CACHE_TTL_SEC` environment variable |
| Entry limit | Unlimited | Controlled through periodic cleanup |
| Retention period | 7 days | Entries older than 7 days are automatically deleted |
| Thread-safe | Yes | SQLite WAL mode supports concurrent reads |

### Cache Key Format

| Key Format | Data | Description |
|------------|------|-------------|
| `{ticker}:summary` | Dashboard summary | Includes spot_price, max_pain, pcr, gex, etc. |
| `{ticker}:info` | Ticker info | Price, change percentage |
| `{ticker}:expirations` | Expiration date list | Available option expiration dates |
| `{ticker}:oi_wall` | OI Wall data | Call/put open interest at each strike |
| `{ticker}:max_pain_curve` | Max Pain curve | Total loss at each strike |
| `{ticker}:gex_distribution` | GEX distribution | Gamma exposure at each strike |
| `{ticker}:volatility` | Volatility indicators | ATM IV, HV30, VRP, Skew |
| `MACRO:current` | Macro indicators | VIX, TNX, DXY, etc. |

### Cleanup Mechanism

```mermaid
flowchart TD
    POLLER["Poller triggers"] --> CLEANUP["cleanup_old()"]
    CLEANUP --> QUERY["DELETE FROM live_cache<br/>WHERE updated_at < now - 7 days"]
    QUERY --> LOG["Log number of deleted entries"]
```

- Cleanup is executed at the start of each polling cycle
- Deletes entries older than `LIVE_CACHE_RETENTION_DAYS` (default 7 days)
- The `idx_live_cache_updated` index speeds up cleanup queries

---

## Layer 3: Historical Storage

Historical storage is the lowest persistence layer, used to store daily snapshot data and support historical trend analysis.

### Storage Tables

| Table | Granularity | Purpose |
|-------|------------|---------|
| `daily_snapshots` | 1 row per ticker per day | Aggregated indicator trends (max_pain, pcr, gex, iv) |
| `strike_snapshots` | 1 row per strike per day | Strike-level OI, volume, IV, Greeks |
| `macro_snapshots` | 1 row per day | Macroeconomic indicator trends |

### Write Timing

- **Daily snapshot task**: Automatically triggered at 16:30 Eastern Time (after market close)
- **Manual write**: The `POST /api/historical/ingest` endpoint supports manual data ingestion

---

## Cache Hit Flow

```mermaid
flowchart TD
    REQ["API request<br/>GET /api/dashboard/summary?ticker=SPY"] --> L2_CHECK{"Layer 2: live_cache<br/>Does SPY:summary exist and is it not expired?"}

    L2_CHECK -- "Hit and not expired" --> L2_HIT["Return live_cache data<br/>(fastest path)"]
    L2_HIT --> RESP["JSON response"]

    L2_CHECK -- "Miss or expired" --> L1_CHECK{"Layer 1: Memory cache<br/>Does ticker_info:SPY exist?"}

    L1_CHECK -- "Hit" --> L1_HIT["Assemble data from memory cache"]
    L1_HIT --> L2_UPDATE["Update live_cache"]
    L2_UPDATE --> RESP

    L1_CHECK -- "Miss" --> FETCH["Fetch from Yahoo Finance"]
    FETCH --> L1_UPDATE["Update memory cache"]
    L1_UPDATE --> L2_UPDATE2["Update live_cache"]
    L2_UPDATE2 --> RESP

    RESP --> CLIENT["Return to client"]
```

### Cache Strategy Decision Matrix

| Scenario | Layer 1 (Memory) | Layer 2 (Live Cache) | Layer 3 (History) | Behavior |
|----------|-----------------|---------------------|-------------------|----------|
| High-frequency API request | Hit | Hit | - | Return Layer 2 data directly |
| First request after polling | May hit | Hit | - | Return Layer 2 data |
| Cache expired | May hit | Expired | - | Fetch from Layer 1 or real-time, update Layer 2 |
| All misses | Miss | Miss | - | Real-time fetch, update all layers |
| Historical trend query | - | - | Query | Query historical tables directly |

---

## Background Polling and Cache Warming

The background poller is an important part of the caching strategy, ensuring high API hit rates through periodic warming:

```mermaid
sequenceDiagram
    participant SCHED as APScheduler
    participant POLL as poll_all_tickers
    participant YF as Yahoo Finance
    participant L1 as Memory Cache
    participant L2 as live_cache

    SCHED->>POLL: Trigger every 5 minutes
    POLL->>L2: cleanup_old() clean old entries

    loop For each ticker
        POLL->>YF: get_ticker_info(ticker)
        YF-->>POLL: Return data
        POLL->>L2: set_cached(ticker, "info", data)

        POLL->>YF: get_options_chain(ticker)
        YF-->>POLL: Return options chain
        POLL->>POLL: compute_chain_greeks()
        POLL->>POLL: Calculate all indicators
        POLL->>L2: set_cached(ticker, "summary", ...)
        POLL->>L2: set_cached(ticker, "oi_wall", ...)
        POLL->>L2: set_cached(ticker, "max_pain_curve", ...)
        POLL->>L2: set_cached(ticker, "gex_distribution", ...)
        POLL->>L2: set_cached(ticker, "volatility", ...)
    end

    POLL->>L1: mem_cache.clear()
    Note over L1: Clear memory cache to ensure<br/>next request uses latest data
```

---

## Configuration Parameters

All cache-related parameters can be configured via environment variables:

| Parameter | Environment Variable | Default Value | Description |
|-----------|---------------------|---------------|-------------|
| Memory cache TTL | `CACHE_TTL` | 300 (5 minutes) | Layer 1 expiration time |
| Memory cache capacity | `CACHE_MAX_SIZE` | 128 | Layer 1 maximum number of entries |
| Live Cache TTL | `LIVE_CACHE_TTL_SEC` | 600 (10 minutes) | Layer 2 expiration threshold |
| Live Cache retention | `LIVE_CACHE_RETENTION_DAYS` | 7 (days) | Entries older than this are cleaned up |
| Polling interval | `POLL_INTERVAL_SEC` | 300 (5 minutes) | Background poller trigger interval |
