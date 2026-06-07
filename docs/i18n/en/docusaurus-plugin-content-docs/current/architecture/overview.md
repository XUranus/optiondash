---
sidebar_position: 1
title: 'Architecture Overview'
---

# Architecture Overview

OptionDash is an options chain analysis and market sentiment monitoring platform that uses a separated frontend-backend architecture. The frontend is a single-page application built with React + Vite, the backend provides RESTful APIs using Flask, the data source is Yahoo Finance, and historical snapshots and live cache are persistently stored in SQLite.

---

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Browser"
        UI["React + Vite Frontend<br/>(Ant Design + ECharts + Tailwind CSS)"]
    end

    subgraph "Backend Service (Flask)"
        API["Flask API Server<br/>(6 Blueprints)"]
        SVC["Service Layer<br/>(Greeks, MaxPain, PCR, GEX, Volatility)"]
        CACHE["Cache Layer<br/>(In-memory TTL + SQLite Live Cache)"]
        SCHED["Scheduler (APScheduler)"]
        POLLER["Background Poller"]
    end

    subgraph "Data Layer"
        SQLITE["SQLite Database<br/>(WAL Mode)"]
        YF["Yahoo Finance<br/>(yfinance)"]
    end

    UI -- "HTTP /api/*" --> API
    API --> CACHE
    API --> SVC
    SVC --> CACHE
    SVC -- "rate_limiter.wait()" --> YF
    CACHE --> SQLITE
    SCHED -- "interval: 5min" --> POLLER
    SCHED -- "cron: 16:30 ET" --> POLLER
    POLLER --> SVC
    POLLER --> CACHE
    POLLER --> SQLITE
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | React 19, TypeScript, Vite 8 | UI framework and build tool |
| UI Component Library | Ant Design 6 | Forms, tables, tabs, and other UI components |
| Chart Visualization | ECharts 6 | Options data chart rendering |
| Styling | Tailwind CSS 4 | Utility-first atomic CSS |
| Backend Framework | Python 3.12+, Flask 3.1 | API server |
| Background Scheduling | APScheduler 3 | Scheduled tasks (polling + daily snapshots) |
| Database | SQLite (WAL Mode) | Data persistence |
| Options Math | py_vollib_vectorized | Batch Black-Scholes Greeks calculation |
| Data Source | yfinance (Yahoo Finance) | Market quotes and options chain data |
| HTTP Client | Axios | Frontend API requests |
| Rate Control | Custom Token Bucket | Rate-limiting yfinance requests (2 req/s) |

---

## Data Flow Overview

```mermaid
sequenceDiagram
    participant U as User Browser
    participant FE as React Frontend
    participant API as Flask API
    participant LC as Live Cache (SQLite)
    participant MC as Memory Cache (TTLCache)
    participant YF as Yahoo Finance

    U->>FE: Open page
    FE->>API: GET /api/dashboard/summary?ticker=SPY
    API->>LC: Query live_cache (SPY:summary)

    alt Cache hit and not expired (<= 10 min)
        LC-->>API: Return cached data
    else Cache miss or expired
        API->>MC: Query memory cache
        alt Memory cache hit
            MC-->>API: Return data
            API->>LC: Update live_cache
        else All misses
            API->>YF: rate_limiter.wait() + fetch data
            YF-->>API: Return raw data
            API->>API: Calculate Greeks, MaxPain, PCR, GEX
            API->>MC: Write to memory cache
            API->>LC: Write to live_cache
        end
    end

    API-->>FE: JSON response
    FE->>U: Render charts and cards
```

---

## Cache Layers

The system uses a three-layer cache architecture, ordered from fastest to slowest:

```mermaid
graph LR
    subgraph "Layer 1: Memory Cache"
        L1["TTLCache<br/>TTL: 5 min<br/>Max 128 entries<br/>In-process, lost on restart"]
    end

    subgraph "Layer 2: SQLite Live Cache"
        L2["live_cache table<br/>TTL: 10 min<br/>Shared across threads<br/>Persists after restart"]
    end

    subgraph "Layer 3: Historical Storage"
        L3["daily_snapshots<br/>strike_snapshots<br/>macro_snapshots<br/>Permanent storage"]
    end

    L1 -- "Miss/Expired" --> L2
    L2 -- "Miss/Expired" --> L3
    L3 -- "Used for historical queries" --> L3
```

| Layer | Technology | TTL | Max Capacity | Characteristics |
|-------|-----------|-----|-------------|-----------------|
| Layer 1 | `cachetools.TTLCache` | 5 min (300s) | 128 entries | Fastest access, lost on process restart |
| Layer 2 | SQLite `live_cache` table | 10 min (600s) | Unlimited | Shared across threads, persists after restart |
| Layer 3 | SQLite historical tables | Permanent | Unlimited | Daily snapshots, supports historical trend queries |

---

## Deployment Architecture

### Development Environment

```mermaid
graph LR
    DEV["Developer Browser"] --> VITE["Vite Dev Server<br/>localhost:5173"]
    VITE -- "Proxy /api/*" --> FLASK["Flask API Server<br/>localhost:5001"]
    FLASK --> DB["SQLite<br/>backend/data/optiondash.db"]
    FLASK --> YF["Yahoo Finance"]
```

- **Frontend**: Vite dev server runs at `localhost:5173` with Hot Module Replacement (HMR)
- **Backend**: Flask dev server runs at `localhost:5001` with debug mode enabled
- **Proxy**: Vite is configured with proxy rules to forward `/api/*` requests to the Flask backend
- **Database**: SQLite file stored at `backend/data/optiondash.db`

### Production Environment

```mermaid
graph LR
    USER["User Browser"] --> STATIC["Static File Server<br/>(Frontend build artifacts)"]
    USER --> FLASK["Flask API Server<br/>Gunicorn / uWSGI"]
    FLASK --> DB["SQLite<br/>(WAL Mode)"]
    FLASK --> YF["Yahoo Finance"]
    SCHED["APScheduler<br/>(Polling + Daily Snapshots)"] --> FLASK
```

- **Frontend**: Vite builds static files, hosted by Nginx or another web server
- **Backend**: Flask application deployed via Gunicorn or another WSGI server
- **Scheduler**: APScheduler starts with the Flask process, executing background polling and daily snapshot tasks

---

## Core Modules Overview

```mermaid
graph TB
    subgraph "Frontend Modules"
        DASH["Dashboard"]
        STRIKE["Strikes<br/>Strike Analysis"]
        COMP["Comparison<br/>Multi-ticker Comparison"]
        HIST["Historical<br/>Historical Trends"]
        MACRO["Macro<br/>Macro Indicators"]
    end

    subgraph "Backend APIs"
        API_DASH["/api/dashboard/*"]
        API_STRIKE["/api/strikes/*"]
        API_COMP["/api/comparison/*"]
        API_HIST["/api/historical/*"]
        API_MACRO["/api/macro/*"]
    end

    subgraph "Service Layer"
        SVC_MK["market_data"]
        SVC_GR["greeks_engine"]
        SVC_MP["max_pain"]
        SVC_PCR["pcr"]
        SVC_GEX["gex"]
        SVC_VOL["volatility"]
        SVC_ANO["anomaly"]
        SVC_MACRO["macro_data"]
        SVC_LC["live_cache"]
    end

    DASH --> API_DASH
    STRIKE --> API_STRIKE
    COMP --> API_COMP
    HIST --> API_HIST
    MACRO --> API_MACRO

    API_DASH --> SVC_MK
    API_DASH --> SVC_GR
    API_DASH --> SVC_MP
    API_DASH --> SVC_PCR
    API_DASH --> SVC_GEX

    API_STRIKE --> SVC_MK
    API_STRIKE --> SVC_GR
    API_STRIKE --> SVC_GEX

    API_COMP --> SVC_ANO
    API_HIST --> SVC_LC
    API_MACRO --> SVC_MACRO
```
