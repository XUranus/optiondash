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

## Schema

### daily_snapshots

One row per ticker per day. Contains all derived metrics: spot_price, max_pain, pcr_volume, pcr_oi, gex, atm_iv, hv30, vrp, skew_25d, and aggregate OI/volume counts.

### strike_snapshots

One row per strike per expiration per ticker per day. Contains strike-level OI, volume, IV, gamma, and delta. Used to reconstruct OI Wall and GEX distribution charts for historical analysis.
