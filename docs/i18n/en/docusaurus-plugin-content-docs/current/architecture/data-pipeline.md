---
sidebar_position: 4
title: 'Data Pipeline'
---

# Data Pipeline

The OptionDash data pipeline is responsible for fetching raw market data from Yahoo Finance, processing it through cleaning, Greeks calculation, and indicator aggregation, and ultimately returning structured JSON responses to the frontend or storing data in cache/historical tables.

---

## Full Data Fetching Flow

```mermaid
flowchart TD
    YF["Yahoo Finance API<br/>(yfinance library)"]
    RAW["Raw data<br/>(camelCase column names)"]
    NORM["Column name normalization<br/>camelCase -> snake_case"]
    CHAIN["Options chain DataFrame<br/>(calls + puts)"]
    GREEKS["Greeks calculation engine<br/>(py_vollib_vectorized)"]
    ENRICHED["Enriched options chain<br/>(with delta, gamma, theta, vega, rho)"]
    METRICS["Indicator calculation services"]
    MP["Max Pain"]
    PCR["Put/Call Ratio"]
    GEX["Gamma Exposure"]
    VOL["Volatility indicators<br/>(HV, IV, VRP, Skew)"]
    RESPONSE["API JSON response"]
    CACHE["live_cache storage"]
    SNAPSHOT["Daily snapshot storage"]

    YF --> RAW
    RAW --> NORM
    NORM --> CHAIN
    CHAIN --> GREEKS
    GREEKS --> ENRICHED
    ENRICHED --> METRICS
    METRICS --> MP
    METRICS --> PCR
    METRICS --> GEX
    METRICS --> VOL
    MP --> RESPONSE
    PCR --> RESPONSE
    GEX --> RESPONSE
    VOL --> RESPONSE
    RESPONSE --> CACHE
    MP --> SNAPSHOT
    PCR --> SNAPSHOT
    GEX --> SNAPSHOT
    VOL --> SNAPSHOT
```

---

## Yahoo Finance Integration

OptionDash accesses Yahoo Finance data through the `yfinance` library. The integration layer is encapsulated in `services/market_data.py` and provides the following core functions:

| Function | Return Value | Description |
|----------|-------------|-------------|
| `get_ticker_info(ticker)` | `dict` | Current price, intraday change, 52-week range |
| `get_expirations(ticker)` | `list[str]` | List of available option expiration dates |
| `get_options_chain(ticker, expiration)` | `dict` | Complete options chain (calls/puts DataFrame + spot_price) |
| `get_historical_prices(ticker, period)` | `DataFrame` | Historical OHLCV data |

### Column Name Normalization

DataFrames returned by yfinance use camelCase column names. The system uniformly converts them to snake_case:

```mermaid
graph LR
    subgraph "yfinance raw column names"
        A1["contractSymbol"]
        A2["lastTradeDate"]
        A3["openInterest"]
        A4["impliedVolatility"]
        A5["inTheMoney"]
        A6["percentChange"]
    end

    subgraph "Normalized column names"
        B1["contract_symbol"]
        B2["last_trade_date"]
        B3["open_interest"]
        B4["implied_volatility"]
        B5["in_the_money"]
        B6["percent_change"]
    end

    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B4
    A5 --> B5
    A6 --> B6
```

### Rate Limiting

All requests to Yahoo Finance pass through a Token Bucket rate limiter:

```mermaid
sequenceDiagram
    participant REQ as Requester
    participant RL as RateLimiter
    participant TB as Token Bucket
    participant YF as Yahoo Finance

    REQ->>RL: rate_limiter.wait()
    RL->>TB: Check available tokens

    alt Tokens available
        TB-->>RL: Consume 1 token
        RL-->>REQ: Allow request
    else No tokens available
        loop Retry every 50ms
            RL->>TB: Check tokens
        end
        TB-->>RL: Token refill (2/s)
        RL-->>REQ: Allow request
    end

    REQ->>YF: Send HTTP request
    YF-->>REQ: Return data
```

- **Algorithm**: Token Bucket
- **Rate**: 2 requests/second (configurable via `RATE_LIMIT_RPS` environment variable)
- **Timeout**: 10 seconds
- **Thread-safe**: Uses `threading.Lock` to protect token state

---

## Greeks Calculation Engine

The Greeks calculation engine is located in `services/greeks_engine.py` and uses the `py_vollib_vectorized` library for batch Black-Scholes Greeks calculation.

### Calculation Flow

```mermaid
flowchart TD
    INPUT["Input parameters"]
    S["S: Spot price (scalar)"]
    K["K: Strike prices (array)"]
    T["T: Time to expiration (annualized array)"]
    SIGMA["sigma: Implied volatility (array)"]
    FLAG["flag: c/p (array)"]
    R["r: Risk-free rate (0.0525)"]

    INPUT --> S
    INPUT --> K
    INPUT --> T
    INPUT --> SIGMA
    INPUT --> FLAG
    INPUT --> R

    BATCH["py_vollib_vectorized<br/>get_all_greeks()"]

    S --> BATCH
    K --> BATCH
    T --> BATCH
    SIGMA --> BATCH
    FLAG --> BATCH
    R --> BATCH

    BATCH --> SUCCESS{"Calculation succeeded?"}
    SUCCESS -- "Yes" --> RESULT["DataFrame:<br/>delta, gamma, theta, vega, rho"]
    SUCCESS -- "No" --> FALLBACK["Per-contract fallback calculation<br/>_compute_greeks_fallback()"]
    FALLBACK --> RESULT

    RESULT --> CLEAN["Clean NaN/Inf<br/>Replace with 0"]
    CLEAN --> OUTPUT["Output Greeks DataFrame"]
```

### The Five Greeks

| Greek | Symbol | Meaning | Application |
|-------|--------|---------|-------------|
| Delta | Sensitivity of option price to changes in the underlying price | Measures directional risk |
| Gamma | Sensitivity of Delta to changes in the underlying price | Core input for GEX calculation |
| Theta | Rate of time decay of option price | Measures time value erosion |
| Vega | Sensitivity of option price to changes in volatility | Reference for volatility trading |
| Rho | Sensitivity of option price to changes in interest rates | Interest rate environment impact assessment |

### Fault Tolerance Mechanisms

- **Batch calculation priority**: Uses `py_vollib_vectorized` vectorized calculation for optimal performance
- **Per-contract fallback**: If batch calculation throws an exception, automatically switches to a per-contract calculation loop
- **NaN/Inf cleanup**: NaN and Inf values in calculation results are uniformly replaced with 0.0
- **Minimum time protection**: T value is clamped to `1e-6 / 365` (approximately 1 second) to avoid division by zero errors

---

## Indicator Calculation

### Max Pain

Max Pain is the strike price where option holders have the minimum total loss, equivalent to the strike where option sellers have the maximum profit.

```mermaid
flowchart LR
    INPUT["calls + puts DataFrame"] --> ITER["Iterate over each candidate strike K"]
    ITER --> CALC["total_loss(K) =<br/>Sum max(0, K - strike_i) * call_OI_i * 100<br/>+ Sum max(0, strike_j - K) * put_OI_j * 100"]
    CALC --> MIN["Take K with minimum total_loss"]
    MIN --> OUTPUT["max_pain_strike"]
```

### Put/Call Ratio (PCR)

PCR measures market bearish/bullish sentiment:

```mermaid
flowchart TD
    CALLS["calls DataFrame"] --> CV["total_call_volume"]
    CALLS --> COI["total_call_oi"]
    PUTS["puts DataFrame"] --> PV["total_put_volume"]
    PUTS --> POI["total_put_oi"]

    CV --> PCR_VOL["pcr_volume = PV / CV"]
    COI --> PCR_OI["pcr_oi = POI / COI"]

    PCR_OI --> SIGNAL["Composite signal<br/>composite = 0.6 * pcr_oi + 0.4 * pcr_vol"]
    PCR_VOL --> SIGNAL

    SIGNAL --> BULL{"composite < 0.7?"}
    SIGNAL --> BEAR{"composite > 1.2?"}

    BULL -- "Yes" --> BULLISH["bullish"]
    BEAR -- "Yes" --> BEARISH["bearish"]
    BULL -- "No" --> NEUTRAL["neutral"]
    BEAR -- "No" --> NEUTRAL
```

### Gamma Exposure (GEX)

GEX measures gamma exposure from the dealer's perspective:

```mermaid
flowchart LR
    subgraph "Calculation formula"
        F1["dealer_gex_per_share =<br/>-Sum(call_OI * call_gamma)<br/>+ Sum(put_OI * put_gamma)"]
        F2["gex_dollar =<br/>dealer_gex_per_share * 100 * spot_price"]
    end

    subgraph "GEX regime"
        POS["Positive GEX: Dealers are long gamma<br/>-> Counter-trend trading -> Suppresses volatility"]
        NEG["Negative GEX: Dealers are short gamma<br/>-> Trend-following trading -> Amplifies volatility"]
    end

    F1 --> F2
    F2 --> POS
    F2 --> NEG
```

### Volatility Indicators

```mermaid
flowchart TD
    PRICES["Historical prices (90 days)"] --> LOG["log_returns = diff(log(prices))"]
    LOG --> HV["HV30 = std(log_returns, 30) * sqrt(252)"]

    CALLS["calls DataFrame"] --> ATM["Find strike closest to spot"]
    PUTS["puts DataFrame"] --> ATM
    ATM --> ATM_IV["ATM IV = avg(call_IV, put_IV)"]

    ATM_IV --> VRP["VRP = ATM IV - HV30<br/>Positive value = options overpriced relative to history"]
    HV --> VRP

    CALLS --> SKEW["25D Skew = IV(25delta Put) - IV(25delta Call)<br/>Linear interpolation to find IV at delta=0.25"]
    PUTS --> SKEW
```

---

## Background Poller

The background poller is located in `scheduler/poller.py`, triggered by APScheduler on a schedule, and is responsible for cache warming:

```mermaid
flowchart TD
    TRIGGER["APScheduler trigger<br/>(every 5 min)"] --> CLEANUP["cleanup_old()<br/>Delete live_cache entries older than 7 days"]
    CLEANUP --> LOOP["Iterate over SUPPORTED_TICKERS<br/>(SPY, QQQ, IWM, TLT, XLF)"]
    LOOP --> POLL["_poll_ticker(ticker)"]

    POLL --> STEP1["1. get_ticker_info<br/>Fetch ticker info"]
    STEP1 --> STEP2["2. get_expirations<br/>Fetch expiration list"]
    STEP2 --> STEP3["3. get_options_chain<br/>Fetch options chain"]
    STEP3 --> STEP4["4. compute_chain_greeks<br/>Calculate Greeks"]
    STEP4 --> STEP5["5. Calculate all indicators<br/>MaxPain, PCR, GEX, IV, VRP, Skew"]
    STEP5 --> STEP6["6. Assemble summary, oi_wall,<br/>max_pain_curve, gex_distribution,<br/>volatility data"]
    STEP6 --> STEP7["7. Write to live_cache"]
    STEP7 --> STEP8["8. Clear memory cache"]

    LOOP --> MACRO["_poll_macro()"]
    MACRO --> MACRO1["get_macro_current()<br/>VIX, TNX, TYX, IRX, DXY, VVIX"]
    MACRO1 --> MACRO2["Write to live_cache<br/>(key: MACRO:current)"]

    STEP8 --> NEXT["Next ticker"]
    NEXT --> LOOP
```

**Poller's Role**:

- **Cache warming**: Periodically fetches data from Yahoo Finance and stores it in live_cache, ensuring API requests can hit the cache
- **Cleanup expired data**: Cleans up cache entries older than 7 days at the start of each poll cycle
- **Error isolation**: Failure in polling a single ticker does not affect other tickers

---

## Daily Snapshot

The daily snapshot task is in the `daily_snapshot_job()` function in `scheduler/jobs.py`, triggered at 16:30 Eastern Time (after market close):

```mermaid
sequenceDiagram
    participant SCHED as APScheduler
    participant JOB as daily_snapshot_job
    participant MKD as market_data
    participant SVC as Indicator Calculation Services
    participant DB as SQLite

    SCHED->>JOB: Trigger (cron: 16:30 ET)

    loop For each ticker (SPY, QQQ, IWM, TLT, XLF)
        JOB->>MKD: get_options_chain(ticker)
        MKD-->>JOB: chain (calls/puts)

        JOB->>JOB: compute_chain_greeks(chain)

        JOB->>SVC: calculate_max_pain(calls, puts)
        JOB->>SVC: calculate_pcr(calls, puts)
        JOB->>SVC: calculate_gex(calls, puts, spot)
        JOB->>SVC: calculate_atm_iv(calls, puts, spot)

        JOB->>MKD: get_historical_prices(ticker, "90d")
        JOB->>SVC: calculate_hv(prices, 30)
        JOB->>SVC: calculate_vrp(atm_iv, hv30)
        JOB->>SVC: calculate_skew_25d(calls, puts, spot)

        JOB->>DB: INSERT INTO daily_snapshots
        Note over DB: Store aggregated indicator snapshot

        JOB->>DB: INSERT INTO strike_snapshots
        Note over DB: Store detailed data for each strike
    end

    JOB->>SVC: get_macro_current()
    JOB->>DB: INSERT INTO macro_snapshots
    Note over DB: Store macroeconomic indicator snapshot
```

**Snapshot Storage Contents**:

| Table | Granularity | Storage Content |
|-------|------------|-----------------|
| `daily_snapshots` | 1 row per ticker per day | spot_price, max_pain, pcr_volume, pcr_oi, gex, atm_iv, hv30, vrp, skew_25d, volume/OI summary |
| `strike_snapshots` | 1 row per strike per day | call_oi, put_oi, call_volume, put_volume, call_iv, put_iv, call_gamma, put_gamma, call_delta, put_delta |
| `macro_snapshots` | 1 row per day | vix, tnx, tyx, irx, dxy, vvix, spread_10y3m |

---

## Macro Indicator Data Flow

```mermaid
flowchart LR
    subgraph "Yahoo Finance Symbol Mapping"
        VIX["^VIX<br/>Volatility Index"]
        TNX["^TNX<br/>10-Year Treasury Yield"]
        TYX["^TYX<br/>30-Year Treasury Yield"]
        IRX["^IRX<br/>13-Week Treasury Yield"]
        DXY["DX-Y.NYB<br/>US Dollar Index"]
        VVIX["^VVIX<br/>VVIX (Volatility of VIX)"]
    end

    subgraph "macro_data.py"
        FETCH["get_macro_indicator()"]
        DERIVED["Calculate derived indicators<br/>spread_10y3m = TNX - IRX"]
    end

    subgraph "Output"
        CURRENT["Current snapshot<br/>(live_cache)"]
        HISTORY["Historical snapshot<br/>(macro_snapshots)"]
    end

    VIX --> FETCH
    TNX --> FETCH
    TYX --> FETCH
    IRX --> FETCH
    DXY --> FETCH
    VVIX --> FETCH

    FETCH --> DERIVED
    DERIVED --> CURRENT
    DERIVED --> HISTORY
```
