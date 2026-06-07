---
sidebar_position: 6
title: 'Database Design'
---

# Database Design

OptionDash uses SQLite as its data storage engine, employing WAL (Write-Ahead Logging) mode to support concurrent reads. The database stores three types of data: daily aggregated snapshots, strike-level snapshots, live cache, and macroeconomic indicator snapshots.

---

## SQLite Configuration

Database connections are managed through the `Database` singleton class in `database/connection.py`, with the following configuration:

```mermaid
graph TB
    subgraph "Database Singleton"
        SINGLE["Double-checked locking singleton<br/>threading.Lock"]
        LOCAL["Thread-local connections<br/>threading.local()"]
    end

    subgraph "SQLite PRAGMA Configuration"
        WAL["journal_mode=WAL<br/>Write-ahead logging, supports concurrent reads"]
        FK["foreign_keys=ON<br/>Enable foreign key constraints"]
        TIMEOUT["busy_timeout=5000<br/>5 second busy wait timeout"]
    end

    subgraph "Connection Properties"
        ROW["row_factory=sqlite3.Row<br/>Results returned as dictionaries"]
        CTX["get_cursor() context manager<br/>Automatic commit/rollback"]
    end

    SINGLE --> LOCAL
    LOCAL --> WAL
    LOCAL --> FK
    LOCAL --> TIMEOUT
    LOCAL --> ROW
    LOCAL --> CTX
```

### WAL Mode Advantages

- **Concurrent reads and writes**: Read operations do not block write operations, and write operations do not block read operations
- **Better performance**: Batch writes perform better than the default rollback journal mode
- **Crash recovery**: WAL files provide better crash recovery capabilities

### Thread Safety Mechanism

```mermaid
sequenceDiagram
    participant T1 as Thread 1 (API request)
    participant T2 as Thread 2 (Poller)
    participant T3 as Thread 3 (API request)
    participant DB as Database Singleton
    participant SQLITE as SQLite File

    T1->>DB: _get_connection()
    DB->>DB: Check thread-local
    DB-->>T1: Create thread-local connection 1

    T2->>DB: _get_connection()
    DB->>DB: Check thread-local
    DB-->>T2: Create thread-local connection 2

    T3->>DB: _get_connection()
    DB->>DB: Check thread-local
    DB-->>T3: Create thread-local connection 3

    T1->>SQLITE: Read (connection 1)
    T2->>SQLITE: Write (connection 2)
    T3->>SQLITE: Read (connection 3)
    Note over SQLITE: WAL mode allows concurrent reads and writes
```

- **Singleton pattern**: Uses double-checked locking to ensure a globally unique instance
- **Thread-local connections**: Each thread has its own independent SQLite connection via `threading.local()`
- **Context manager**: `get_cursor()` automatically handles commit and rollback

---

## Table Structure

### ER Diagram

```mermaid
erDiagram
    daily_snapshots {
        INTEGER id PK "Auto-increment primary key"
        TEXT date "YYYY-MM-DD"
        TEXT ticker "Ticker symbol"
        REAL spot_price "Spot price"
        REAL max_pain "Max Pain strike"
        REAL pcr_volume "Volume-based PCR"
        REAL pcr_oi "OI-based PCR"
        REAL gex "Gamma Exposure (USD)"
        REAL atm_iv "At-the-money implied volatility"
        REAL hv30 "30-day historical volatility"
        REAL vrp "Volatility risk premium"
        REAL skew_25d "25-Delta skew"
        INTEGER total_call_volume "Total call volume"
        INTEGER total_put_volume "Total put volume"
        INTEGER total_call_oi "Total call open interest"
        INTEGER total_put_oi "Total put open interest"
        TIMESTAMP created_at "Creation time"
    }

    strike_snapshots {
        INTEGER id PK "Auto-increment primary key"
        TEXT date "YYYY-MM-DD"
        TEXT ticker "Ticker symbol"
        TEXT expiration "Expiration date YYYY-MM-DD"
        REAL strike "Strike price"
        INTEGER call_oi "Call open interest"
        INTEGER put_oi "Put open interest"
        INTEGER call_volume "Call volume"
        INTEGER put_volume "Put volume"
        REAL call_iv "Call implied volatility"
        REAL put_iv "Put implied volatility"
        REAL call_gamma "Call Gamma"
        REAL put_gamma "Put Gamma"
        REAL call_delta "Call Delta"
        REAL put_delta "Put Delta"
        TIMESTAMP created_at "Creation time"
    }

    live_cache {
        INTEGER id PK "Auto-increment primary key"
        TEXT ticker "Ticker symbol"
        TEXT cache_key "Cache key"
        TEXT data_json "JSON serialized data"
        TIMESTAMP updated_at "Last update time"
    }

    macro_snapshots {
        INTEGER id PK "Auto-increment primary key"
        TEXT date "YYYY-MM-DD"
        REAL vix "VIX Volatility Index"
        REAL tnx "10-Year Treasury Yield"
        REAL tyx "30-Year Treasury Yield"
        REAL irx "13-Week Treasury Yield"
        REAL dxy "US Dollar Index"
        REAL vvix "VVIX"
        REAL spread_10y3m "10Y-3M spread"
        TIMESTAMP created_at "Creation time"
    }

    daily_snapshots ||--o{ strike_snapshots : "Same ticker, same day"
    daily_snapshots }o--|| macro_snapshots : "Same day"
```

### daily_snapshots (Daily Aggregated Snapshot)

Stores one row per ticker per day, recording all aggregated indicators for that day. This is the primary data source for historical trend analysis.

```sql
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
```

| Field | Type | Description |
|-------|------|-------------|
| `date` | TEXT | Snapshot date, format `YYYY-MM-DD` |
| `ticker` | TEXT | Ticker symbol, e.g., `SPY`, `QQQ` |
| `spot_price` | REAL | Daily spot closing price |
| `max_pain` | REAL | Max Pain strike price |
| `pcr_volume` | REAL | Volume-based Put/Call Ratio |
| `pcr_oi` | REAL | OI-based Put/Call Ratio |
| `gex` | REAL | Gamma Exposure in USD |
| `atm_iv` | REAL | At-the-money implied volatility |
| `hv30` | REAL | 30-day historical volatility |
| `vrp` | REAL | Volatility risk premium (atm_iv - hv30) |
| `skew_25d` | REAL | 25-Delta risk reversal (IV_put_25d - IV_call_25d) |
| `total_call_volume` | INTEGER | Total call volume for the day |
| `total_put_volume` | INTEGER | Total put volume for the day |
| `total_call_oi` | INTEGER | Total call open interest for the day |
| `total_put_oi` | INTEGER | Total put open interest for the day |

**Unique constraint**: `(date, ticker)` ensures at most one row per ticker per day.

### strike_snapshots (Strike-Level Snapshot)

Stores one row per strike per day, used to reconstruct OI Wall and GEX distribution charts.

```sql
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
```

| Field | Type | Description |
|-------|------|-------------|
| `date` | TEXT | Snapshot date |
| `ticker` | TEXT | Ticker symbol |
| `expiration` | TEXT | Option expiration date |
| `strike` | REAL | Strike price |
| `call_oi` | INTEGER | Call open interest |
| `put_oi` | INTEGER | Put open interest |
| `call_volume` | INTEGER | Call volume |
| `put_volume` | INTEGER | Put volume |
| `call_iv` | REAL | Call implied volatility |
| `put_iv` | REAL | Put implied volatility |
| `call_gamma` | REAL | Call Gamma |
| `put_gamma` | REAL | Put Gamma |
| `call_delta` | REAL | Call Delta |
| `put_delta` | REAL | Put Delta |

**Unique constraint**: `(date, ticker, expiration, strike)` ensures at most one row per strike per expiration per day.

### live_cache (Live Cache)

Stores pre-computed API response data, populated by the background poller, and read directly by API endpoints.

```sql
CREATE TABLE IF NOT EXISTS live_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    cache_key TEXT NOT NULL,              -- e.g. 'summary', 'chain:2026-05-01', 'expirations'
    data_json TEXT NOT NULL,              -- JSON-serialized response payload
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticker, cache_key)
);
```

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | TEXT | Ticker symbol (macro indicators use `MACRO`) |
| `cache_key` | TEXT | Cache key, e.g., `summary`, `oi_wall`, `volatility` |
| `data_json` | TEXT | JSON serialized response data |
| `updated_at` | TIMESTAMP | Last update time, used for expiration checks |

**Unique constraint**: `(ticker, cache_key)` ensures only one record per cache type per ticker (updated using INSERT OR REPLACE).

### macro_snapshots (Macroeconomic Indicator Snapshot)

Stores one row of macroeconomic indicator data per day.

```sql
CREATE TABLE IF NOT EXISTS macro_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,          -- YYYY-MM-DD
    vix REAL,
    tnx REAL,
    tyx REAL,
    irx REAL,
    dxy REAL,
    vvix REAL,
    spread_10y3m REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);
```

| Field | Type | Description |
|-------|------|-------------|
| `date` | TEXT | Snapshot date |
| `vix` | REAL | VIX Volatility Index (^VIX) |
| `tnx` | REAL | 10-Year US Treasury Yield (^TNX) |
| `tyx` | REAL | 30-Year US Treasury Yield (^TYX) |
| `irx` | REAL | 13-Week US Treasury Yield (^IRX) |
| `dxy` | REAL | US Dollar Index (DX-Y.NYB) |
| `vvix` | REAL | VVIX - Volatility of VIX (^VVIX) |
| `spread_10y3m` | REAL | 10-Year to 3-Month Treasury spread (tnx - irx) |

---

## Indexes

```sql
-- daily_snapshots indexes
CREATE INDEX IF NOT EXISTS idx_daily_ticker_date
    ON daily_snapshots(ticker, date);

-- strike_snapshots indexes
CREATE INDEX IF NOT EXISTS idx_strike_ticker_date
    ON strike_snapshots(ticker, date);
CREATE INDEX IF NOT EXISTS idx_strike_expiration
    ON strike_snapshots(expiration);

-- live_cache indexes
CREATE INDEX IF NOT EXISTS idx_live_cache_ticker
    ON live_cache(ticker);
CREATE INDEX IF NOT EXISTS idx_live_cache_updated
    ON live_cache(updated_at);

-- macro_snapshots indexes
CREATE INDEX IF NOT EXISTS idx_macro_date
    ON macro_snapshots(date);
```

### Index Usage Description

```mermaid
graph LR
    subgraph "Query Patterns -> Indexes"
        Q1["Query ticker historical trend<br/>WHERE ticker=? ORDER BY date"] --> I1["idx_daily_ticker_date"]
        Q2["Query strike data<br/>WHERE ticker=? AND date=?"] --> I2["idx_strike_ticker_date"]
        Q3["Query by expiration<br/>WHERE expiration=?"] --> I3["idx_strike_expiration"]
        Q4["Query cache by ticker<br/>WHERE ticker=?"] --> I4["idx_live_cache_ticker"]
        Q5["Clean expired cache<br/>WHERE updated_at < ?"] --> I5["idx_live_cache_updated"]
        Q6["Query macro history<br/>WHERE date=?"] --> I6["idx_macro_date"]
    end
```

---

## Thread Safety

### Database Singleton Pattern

```mermaid
flowchart TD
    INIT["Database() called"] --> CHECK1{"_instance exists?"}
    CHECK1 -- "Yes" --> RETURN["Return existing instance"]
    CHECK1 -- "No" --> LOCK["Acquire threading.Lock"]
    LOCK --> CHECK2{"_instance still None?"}
    CHECK2 -- "No (another thread created it)" --> RETURN
    CHECK2 -- "Yes" --> CREATE["Create new instance"]
    CREATE --> RELEASE["Release lock"]
    RELEASE --> RETURN
    RETURN --> INIT_DB["__init__()"]
    INIT_DB --> INIT_ONCE{"_initialized?"}
    INIT_ONCE -- "Yes" --> SKIP["Skip initialization"]
    INIT_ONCE -- "No" --> SETUP["Create data directory<br/>Initialize schema"]
```

### Thread-Local Connections

```python
class Database:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self._local = threading.local()  # Independent connection per thread

    def _get_connection(self) -> sqlite3.Connection:
        if not hasattr(self._local, "connection") or self._local.connection is None:
            conn = sqlite3.connect(Config.DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA foreign_keys=ON")
            conn.execute("PRAGMA busy_timeout=5000")
            self._local.connection = conn
        return self._local.connection
```

### Context Manager

```python
@contextmanager
def get_cursor(self):
    """Cursor context manager with automatic commit/rollback."""
    conn = self._get_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
```

**Design Key Points**:

- **Singleton + double-checked locking**: Globally unique Database instance with lazy initialization
- **Thread-local connections**: `threading.local()` ensures each thread uses its own independent SQLite connection
- **WAL mode**: Supports multi-threaded concurrent reads and writes
- **busy_timeout**: 5-second busy wait to avoid `SQLITE_BUSY` errors
- **Context manager**: Automatically commits successful transactions and rolls back failed ones
