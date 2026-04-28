# Data Source

OptionDash uses **Yahoo Finance** as its sole data source via the `yfinance` Python library.

## Data Provided

### Real-Time / Delayed Data (via yfinance)

| Data | Delay | Source |
|------|-------|--------|
| Spot price | Real-time (US equities) | Yahoo Finance |
| Options chain | ~15 minutes delayed | OPRA via Yahoo |
| Historical prices | EOD | Yahoo Finance |
| Expiration dates | Live | Yahoo Finance |

### Metrics We Compute (Not from yfinance)

| Metric | Source |
|--------|--------|
| Greeks (delta, gamma, theta, vega, rho) | Black-Scholes model via py_vollib_vectorized |
| Max Pain | Custom calculation from OI data |
| Put/Call Ratio | Custom calculation from OI/volume |
| Gamma Exposure | Custom calculation from Greeks + OI |
| Historical Volatility (HV30) | 30-day std of log returns × √252 |
| Volatility Risk Premium (VRP) | ATM IV − HV30 |
| 25-Delta Skew | IV(25Δ Put) − IV(25Δ Call) via interpolation |

## Rate Limiting & Caching

To avoid IP blocks from Yahoo Finance, the platform implements:

- **Token bucket rate limiter** — maximum 2 requests per second to yfinance
- **TTL cache** — 5-minute TTL (configurable via `CACHE_TTL`) on all fetched data. Subsequent requests within the TTL window return cached data instantly
- **Cache max size** — 128 entries (configurable via `CACHE_MAX_SIZE`)

This means the frontend can poll aggressively without hammering Yahoo Finance.

## Data Quality Considerations

### ATM IV on near-dated expirations

Options very close to expiration (1-3 days) may show near-zero implied volatility because deep ITM/OTM options have negligible time value. The system automatically selects the nearest expiration with ≥3 days remaining to mitigate this.

### Deep OTM options

Deep out-of-the-money options may have IV = 0 in Yahoo Finance data. The Greeks engine handles this by clamping T (time) to a minimum of 1e-6 and replacing NaN values with 0.

### Pre/Post Market

Yahoo Finance options data may be stale outside of regular US market hours (9:30 AM – 4:00 PM ET). The frontend displays a "Data delayed ~15 min" notice.

## Historical Data

Yahoo Finance does not provide historical options chain data. OptionDash builds its own historical database by:

1. **Daily snapshots** — The scheduler captures the full options chain for each supported ticker every trading day at 16:30 ET (after market close)
2. **Manual backfill** — `POST /api/historical/snapshot` can be called manually to capture a snapshot for any date
3. **Query** — Historical endpoints read from `daily_snapshots` and `strike_snapshots` tables

Data accumulates over time. On first run, historical charts will be empty until snapshots have been collected.

## Live Cache & Background Polling

To accelerate API response times, OptionDash includes a **background poller** that continuously pre-fetches data from Yahoo Finance and stores it in a local SQLite table (`live_cache`). This avoids slow on-demand yfinance calls for every frontend request.

### How It Works

1. On startup, the poller runs an initial fetch for all configured tickers
2. A recurring APScheduler job polls all tickers every `POLL_INTERVAL_SEC` (default: 300s = 5 min)
3. For each ticker, it fetches and computes: spot info, expirations, option chain, Greeks, Max Pain, PCR, GEX, ATM IV, HV30, VRP, and 25Δ Skew
4. Results are stored as JSON in the `live_cache` table
5. API endpoints check the cache first; if data is fresh (within `LIVE_CACHE_TTL_SEC`, default 10 min), it's returned instantly
6. If the cache is stale or missing, the endpoint falls back to a direct yfinance call
7. Entries older than `LIVE_CACHE_RETENTION_DAYS` (default: 7) are automatically cleaned up

### Cache Keys

| Key | Content | Used By |
|-----|---------|---------|
| `info` | Ticker info (spot, daily change) | Dashboard, Comparison |
| `expirations` | Available expiration dates | Expiration pickers |
| `summary` | Full dashboard summary JSON | Dashboard API |
| `oi_wall` | OI by strike | Strikes API |
| `max_pain_curve` | Max Pain curve data | Strikes API |
| `gex_distribution` | GEX per strike | Strikes API |
| `volatility` | IV, HV30, VRP, skew | Volatility display |

### Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `POLL_INTERVAL_SEC` | `300` | Seconds between poll cycles |
| `LIVE_CACHE_TTL_SEC` | `600` | Max age before cache is considered stale |
| `LIVE_CACHE_RETENTION_DAYS` | `7` | Auto-cleanup threshold for old entries |

## Schema

### daily_snapshots

One row per ticker per day. Contains all derived metrics: spot_price, max_pain, pcr_volume, pcr_oi, gex, atm_iv, hv30, vrp, skew_25d, and aggregate OI/volume counts.

### strike_snapshots

One row per strike per expiration per ticker per day. Contains strike-level OI, volume, IV, gamma, and delta. Used to reconstruct OI Wall and GEX distribution charts for historical analysis.

### live_cache

Pre-fetched data cache for instant API responses. Stores JSON-serialized payloads keyed by (ticker, cache_key). Auto-cleaned of entries older than the retention period.
