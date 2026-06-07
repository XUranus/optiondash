---
sidebar_position: 1
title: 'Development Environment'
---

# Development Environment

This guide helps you set up the OptionDash local development environment from scratch.

## Prerequisites

| Tool | Minimum Version | Recommended Version | Description |
|------|-----------------|---------------------|-------------|
| Python | 3.12+ | 3.12 | Backend runtime |
| Node.js | 20+ | 20 LTS | Frontend build toolchain |
| npm | 10+ | Installed with Node.js | Frontend package manager |
| Git | 2.0+ | Latest stable | Version control |

## Clone the Project

```bash
git clone <repo-url>
cd optiondash
```

## Backend Development Environment

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows (PowerShell)

# Install dependencies
pip install -r requirements.txt
```

Verify the installation:

```bash
python -c "import flask; import yfinance; print('OK')"
```

## Frontend Development Environment

```bash
cd frontend

# Install dependencies
npm install
```

Verify the installation:

```bash
npx tsc --noEmit   # Type check should pass without errors
```

## Start Development Servers

You need to run both the backend and frontend simultaneously, each in a separate terminal:

```bash
# Terminal 1 -- Backend (default http://localhost:5001)
cd backend && python app.py

# Terminal 2 -- Frontend (default http://localhost:5173)
cd frontend && npm run dev
```

After startup, visit `http://localhost:5173` to see the frontend interface. The frontend proxies `/api` requests to the backend on port `5001`.

## Environment Variables

All environment variables can be set via system environment variables or a `.env` file. Here is the complete list:

| Variable Name | Default | Description |
|---------------|---------|-------------|
| `OPTIONDASH_DB` | `backend/data/optiondash.db` | SQLite database file path |
| `SUPPORTED_TICKERS` | `SPY,QQQ,IWM,TLT,XLF` | Supported ticker list (comma-separated) |
| `CACHE_TTL` | `300` | Memory cache TTL (seconds) |
| `CACHE_MAX_SIZE` | `128` | Maximum number of memory cache entries |
| `RATE_LIMIT_RPS` | `2.0` | yfinance request rate limit (requests/second) |
| `RISK_FREE_RATE` | `0.0525` | Risk-free rate (annualized, for Black-Scholes) |
| `FLASK_DEBUG` | `false` | Whether to enable Flask debug mode |
| `FLASK_HOST` | `0.0.0.0` | Flask listen address |
| `FLASK_PORT` | `5001` | Flask listen port |
| `CORS_ORIGINS` | `http://localhost:5173` | CORS allowed origins (comma-separated) |
| `SNAPSHOT_HOUR` | `16` | Daily snapshot hour (Eastern Time) |
| `SNAPSHOT_MINUTE` | `30` | Daily snapshot minute |
| `POLL_INTERVAL_SEC` | `300` | Background polling interval (seconds) |
| `LIVE_CACHE_TTL_SEC` | `600` | Live cache validity period (seconds) |
| `LIVE_CACHE_RETENTION_DAYS` | `7` | Live cache retention days |

## IDE Configuration

### Recommended VS Code Extensions

| Extension | Purpose |
|-----------|---------|
| Python (ms-python) | Python language support |
| Pylance | Python type checking and IntelliSense |
| ESLint | JavaScript / TypeScript code standards |
| Prettier | Code formatting |
| Tailwind CSS IntelliSense | Tailwind class name suggestions |
| ES7+ React Snippets | React code snippets |

### Python Code Standards

The project recommends using `ruff` for linting and formatting:

```bash
pip install ruff
ruff check backend/
ruff format backend/
```

### TypeScript Strict Mode

The frontend `tsconfig.json` has `strict: true` enabled. Make sure all type checks pass before committing code:

```bash
cd frontend && npx tsc --noEmit
```

## Common Issues

### Port 5001 Already in Use

```bash
# Find the process occupying the port
lsof -i :5001          # macOS / Linux
netstat -ano | findstr :5001  # Windows

# Kill the process or change the port
export FLASK_PORT=5002
```

### yfinance Request Rate Limiting

Yahoo Finance has implicit rate limits on requests. If you encounter a `Too Many Requests` error:

- Increase the `RATE_LIMIT_RPS` value (to reduce concurrency) or `POLL_INTERVAL_SEC` (to increase polling interval)
- During development, try to reuse cached data and avoid frequently restarting the backend

### SQLite Database Lock

SQLite may encounter a `database is locked` error during concurrent writes:

- Ensure no multiple backend processes are running simultaneously
- If the database file is corrupted, delete `backend/data/optiondash.db` to regenerate it
- In production, it is recommended to regularly back up the database file
