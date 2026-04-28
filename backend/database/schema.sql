-- OptionDash Database Schema
-- SQLite DDL statements

-- Daily aggregated snapshot (one row per ticker per day)
CREATE TABLE IF NOT EXISTS daily_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,                   -- YYYY-MM-DD
    ticker TEXT NOT NULL,
    spot_price REAL,
    max_pain REAL,
    pcr_volume REAL,                      -- Volume-based Put/Call Ratio
    pcr_oi REAL,                          -- OI-based Put/Call Ratio
    gex REAL,                             -- Gamma Exposure in USD
    atm_iv REAL,                          -- At-the-money implied volatility
    hv30 REAL,                            -- 30-day historical volatility
    vrp REAL,                             -- Volatility risk premium (IV - HV)
    skew_25d REAL,                        -- 25-Delta risk reversal
    total_call_volume INTEGER,
    total_put_volume INTEGER,
    total_call_oi INTEGER,
    total_put_oi INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, ticker)
);

-- Strike-level snapshot (for reconstructing OI Wall / GEX distribution)
CREATE TABLE IF NOT EXISTS strike_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    ticker TEXT NOT NULL,
    expiration TEXT NOT NULL,              -- Expiration date YYYY-MM-DD
    strike REAL NOT NULL,
    call_oi INTEGER DEFAULT 0,
    put_oi INTEGER DEFAULT 0,
    call_volume INTEGER DEFAULT 0,
    put_volume INTEGER DEFAULT 0,
    call_iv REAL,
    put_iv REAL,
    call_gamma REAL,
    put_gamma REAL,
    call_delta REAL,
    put_delta REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, ticker, expiration, strike)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_daily_ticker_date ON daily_snapshots(ticker, date);
CREATE INDEX IF NOT EXISTS idx_strike_ticker_date ON strike_snapshots(ticker, date);
CREATE INDEX IF NOT EXISTS idx_strike_expiration ON strike_snapshots(ticker, expiration);

-- Live cache: pre-fetched data to accelerate API responses
CREATE TABLE IF NOT EXISTS live_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    cache_key TEXT NOT NULL,              -- e.g. 'summary', 'chain:2026-05-01', 'expirations'
    data_json TEXT NOT NULL,              -- JSON-serialized response payload
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticker, cache_key)
);

CREATE INDEX IF NOT EXISTS idx_live_cache_ticker ON live_cache(ticker);
CREATE INDEX IF NOT EXISTS idx_live_cache_updated ON live_cache(updated_at);
