# OptionDash

**Options Chain Analysis & Market Sentiment Monitoring Platform**

A lightweight options market analysis platform that analyzes option chain data (Open Interest, Volume, Implied Volatility, Greeks) to predict short-term price movement, support/resistance levels, and market risk. Built with React + Flask + SQLite, using free data from Yahoo Finance.

**📖 Documentation: [xuranus.github.io/option-dash](https://xuranus.github.io/option-dash/)**

---

## Features

- **Dashboard** — At-a-glance view of Spot Price, Max Pain, Put/Call Ratio, and Gamma Exposure for any ticker
- **Strike Analysis** — OI Wall charts, Max Pain curves, and GEX distributions per strike with interactive ECharts
- **Multi-Ticker Comparison** — Side-by-side comparison with anomaly detection (tickers configurable)
- **Historical Trends** — Time-series charts for Max Pain, PCR, GEX, Volatility, and 25-Delta Skew
- **URL-Based Routing** — `/dashboard`, `/strikes`, `/comparison`, `/historical`, `/macro` with `?ticker=` query params
- **Background Polling** — Pre-fetches data every 5 minutes and stores in local SQLite cache for instant API responses
- **Configurable Tickers** — Managed via `SUPPORTED_TICKERS` env var, frontend fetches from `GET /api/tickers`
- **Robust Error Handling** — Consistent JSON error format with error codes, messages, timestamps, and details
- **Auto-Refresh** — 5-minute polling during trading sessions
- **Macro Dashboard** — Real-time VIX, Treasury yields (10Y/30Y), DXY, VVIX with regime shading and trend charts
- **Daily Snapshots** — Automated data collection via APScheduler for historical analysis

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 8, Ant Design 6, ECharts 6, Tailwind CSS 4 |
| **Backend** | Python 3.12+, Flask 3.1, APScheduler 3 |
| **Database** | SQLite (WAL mode, thread-safe) |
| **Options Math** | py_vollib_vectorized (Black-Scholes Greeks), NumPy, SciPy, pandas |
| **Data Source** | Yahoo Finance via yfinance (free, delayed ~15 min) |

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm 10+

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
# API running at http://localhost:5001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Dev server at http://localhost:5173 (proxies /api to :5001)
```

### Verify

```bash
curl http://localhost:5001/api/health
# → {"status":"ok","service":"optiondash-api",...}

curl "http://localhost:5001/api/dashboard/summary?ticker=SPY"
# → full dashboard JSON
```

---

## Project Structure

```
optiondash/
├── backend/
│   ├── app.py                    # Flask application entry
│   ├── config.py                 # Configuration (DB path, cache TTL, tickers)
│   ├── requirements.txt          # Python dependencies
│   ├── api/                      # REST API blueprints
│   │   ├── health.py             # GET /api/health, /api/tickers
│   │   ├── dashboard.py          # GET /api/dashboard/summary, /expirations
│   │   ├── strikes.py            # GET /api/strikes/oi-wall, /max-pain-curve, /gex-distribution
│   │   ├── comparison.py         # GET /api/comparison/overview
│   │   ├── historical.py         # 4 GET endpoints + POST /api/historical/snapshot
│   │   └── macro.py              # GET /api/macro/current, /api/macro/history
│   ├── services/                 # Business logic layer
│   │   ├── market_data.py        # yfinance wrapper with caching & rate limiting
│   │   ├── greeks_engine.py      # Black-Scholes Greeks via py_vollib_vectorized
│   │   ├── max_pain.py           # Max Pain calculation
│   │   ├── pcr.py                # Put/Call Ratio calculation
│   │   ├── gex.py                # Gamma Exposure calculation
│   │   ├── volatility.py         # HV, VRP, 25-Delta Skew
│   │   ├── anomaly.py            # Anomaly detection (OI spikes, PCR extremes, GEX flips)
│   │   ├── macro_data.py         # Macro indicator fetching (VIX, yields, DXY)
│   │   └── live_cache.py         # SQLite-backed cache for pre-fetched data
│   ├── scheduler/
│   │   ├── jobs.py               # APScheduler daily snapshot + live poller
│   │   └── poller.py             # Background poller: fetches all tickers periodically
│   ├── database/
│   │   ├── connection.py         # Thread-safe SQLite with WAL mode
│   │   └── schema.sql            # DDL for daily_snapshots + strike_snapshots
│   └── utils/
│       ├── cache.py              # TTL cache (cachetools)
│       ├── rate_limiter.py       # Token bucket rate limiter
│       ├── helpers.py            # Safe numeric conversions, formatting
│       └── errors.py             # Consistent error response formatting
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Main layout with tab navigation
│   │   ├── api/                  # API client layer (axios, tickers, ...)
│   │   ├── components/           # Reusable UI components
│   │   │   ├── Layout.tsx        # Page shell
│   │   │   ├── MetricCard.tsx    # KPI card
│   │   │   ├── TickerSelector.tsx
│   │   │   ├── ExpirationPicker.tsx
│   │   │   ├── LoadingCard.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── modules/              # Business feature modules
│   │   │   ├── dashboard/        # 4 metric cards
│   │   │   ├── strikes/          # OI Wall, Max Pain curve, GEX distribution
│   │   │   ├── comparison/       # Multi-ticker comparison table
│   │   │   ├── historical/       # 4 time-series charts
│   │   │   └── macro/            # Macro dashboard (VIX, yields, DXY)
│   │   ├── hooks/                # useTickerData, useAutoRefresh
│   │   ├── types/                # TypeScript interfaces
│   │   └── utils/                # Formatters, constants, colors
│   ├── package.json
│   └── vite.config.ts            # Dev proxy to backend
├── docs/                         # Docusaurus documentation site
├── tutorial/                     # Options metrics guidebook
└── PRD.md                        # Product Requirements Document
```

---

## API Quick Reference

| Endpoint | Method | Params | Description |
|----------|--------|--------|-------------|
| `/api/health` | GET | — | Health check |
| `/api/tickers` | GET | — | Supported tickers list |
| `/api/dashboard/summary` | GET | `ticker`, `?expiration=` | Core indicators |
| `/api/dashboard/expirations` | GET | `ticker` | Available expiration dates |
| `/api/strikes/oi-wall` | GET | `ticker`, `?expiration=` | OI by strike |
| `/api/strikes/max-pain-curve` | GET | `ticker`, `?expiration=` | Max Pain curve |
| `/api/strikes/gex-distribution` | GET | `ticker`, `?expiration=` | GEX per strike |
| `/api/comparison/overview` | GET | `tickers`, `?expiration=` | Multi-ticker comparison |
| `/api/historical/max-pain-vs-price` | GET | `ticker`, `?days=90` | Historical trend |
| `/api/historical/pcr-gex` | GET | `ticker`, `?days=90` | Historical trend |
| `/api/historical/volatility` | GET | `ticker`, `?days=90` | Historical trend |
| `/api/historical/skew` | GET | `ticker`, `?days=90` | Historical trend |
| `/api/historical/snapshot` | POST | `{ticker, date?}` | Manual snapshot |
| `/api/macro/current` | GET | — | All macro indicators |
| `/api/macro/history` | GET | `indicators`, `?days=90` | Macro time series |

---

## Supported Tickers

SPY · QQQ · IWM · TLT · XLF

---

## Configuration

Environment variables (all optional, with sensible defaults):

| Variable | Default | Description |
|----------|---------|-------------|
| `OPTIONDASH_DB` | `backend/data/optiondash.db` | SQLite database path |
| `CACHE_TTL` | `300` | Cache TTL in seconds |
| `CACHE_MAX_SIZE` | `128` | Max cache entries |
| `RATE_LIMIT_RPS` | `2.0` | yfinance max requests/sec |
| `RISK_FREE_RATE` | `0.0525` | Risk-free rate for Black-Scholes |
| `FLASK_PORT` | `5001` | Backend server port |
| `SUPPORTED_TICKERS` | `SPY,QQQ,IWM,TLT,XLF` | Comma-separated ticker list |
| `POLL_INTERVAL_SEC` | `300` | Background poll interval (seconds) |
| `LIVE_CACHE_TTL_SEC` | `600` | Live cache staleness threshold |
| `LIVE_CACHE_RETENTION_DAYS` | `7` | Cache cleanup age (days) |
| `SNAPSHOT_HOUR` | `16` | Daily snapshot hour (ET) |
| `SNAPSHOT_MINUTE` | `30` | Daily snapshot minute (ET) |

---

## Data Source

Yahoo Finance via yfinance. Data is delayed approximately 15 minutes. The platform implements token-bucket rate limiting (2 req/sec) and TTL caching (5 min) to avoid IP throttling. See [Data Pipeline](https://xuranus.github.io/option-dash/architecture/data-pipeline/) for details.

---

## License

MIT
