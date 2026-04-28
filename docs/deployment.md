# Deployment Guide

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

The Flask dev server runs on `0.0.0.0:5001` with debug mode off by default. Set `FLASK_DEBUG=true` for auto-reload.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite dev server runs on `http://localhost:5173` and proxies `/api` requests to `http://localhost:5001`.

---

## Production Deployment

### Option A: Static Frontend + Flask Backend

**1. Build the frontend**
```bash
cd frontend
npm run build
# Output: dist/
```

**2. Serve static files from Flask**

Update `app.py` to serve the frontend build:

```python
from flask import send_from_directory
import os

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "index.html")
```

**3. Run with a production WSGI server**

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 app:create_app()
```

### Option B: Separate Services

- **Frontend**: Deploy `frontend/dist/` to any static hosting (Nginx, S3 + CloudFront, Vercel, Netlify)
- **Backend**: Run Flask behind Nginx reverse proxy with gunicorn
- **CORS**: Update `CORS_ORIGINS` in config to match your frontend domain

### Option C: Docker

Example `Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Backend
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .

# Frontend build
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json .
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY --from=frontend-build /frontend/dist ./frontend/dist
COPY backend/ .
RUN pip install -r requirements.txt gunicorn
EXPOSE 5001
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "app:create_app()"]
```

---

## Database

SQLite with WAL mode is production-ready for this workload. The database file is at `backend/data/optiondash.db` by default (configurable via `OPTIONDASH_DB`).

### Backup

```bash
cp backend/data/optiondash.db "backups/optiondash-$(date +%Y%m%d).db"
```

### Migration

The schema is applied automatically on first startup via `database/schema.sql`. Adding new tables or columns: update `schema.sql` and restart. For complex migrations, use `ALTER TABLE` statements and bump a schema version.

---

## Scheduling

The APScheduler background job runs inside the Flask process. If you run multiple gunicorn workers, the scheduler should only run in one worker. The current implementation starts the scheduler in `create_app()`, which means every worker will start its own scheduler. For multi-worker deployments, either:

1. Run the scheduler as a separate process
2. Use a distributed scheduler (Redis + RQ, Celery Beat)
3. Use `--preload` with gunicorn and a file lock to ensure only one scheduler starts

For a single-server deployment, this is not an issue.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPTIONDASH_DB` | `backend/data/optiondash.db` | SQLite database path |
| `CACHE_TTL` | `300` | Cache TTL in seconds |
| `CACHE_MAX_SIZE` | `128` | Max cache entries |
| `RATE_LIMIT_RPS` | `2.0` | yfinance max requests/sec |
| `RISK_FREE_RATE` | `0.0525` | Risk-free rate for Black-Scholes |
| `FLASK_DEBUG` | `false` | Enable Flask debug mode |
| `FLASK_HOST` | `0.0.0.0` | Flask bind address |
| `FLASK_PORT` | `5001` | Flask port |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins (comma-separated) |
| `SUPPORTED_TICKERS` | `SPY,QQQ,IWM,TLT,XLF` | Comma-separated ticker list |
| `POLL_INTERVAL_SEC` | `300` | Background poll interval in seconds |
| `LIVE_CACHE_TTL_SEC` | `600` | Live cache staleness threshold |
| `LIVE_CACHE_RETENTION_DAYS` | `7` | Cache cleanup age in days |
| `SNAPSHOT_HOUR` | `16` | Daily snapshot hour (ET, 24h) |
| `SNAPSHOT_MINUTE` | `30` | Daily snapshot minute (ET) |

---

## Monitoring

- **Health check**: `GET /api/health` — suitable for uptime monitoring
- **Logs**: Flask logs to stdout with timestamps and log levels
- **Database size**: Monitor `backend/data/optiondash.db` size. With 5 tickers, expect ~5-10 MB/month

---

## Resource Requirements

| Resource | Light Load | Estimated Monthly |
|----------|-----------|-------------------|
| RAM | ~200 MB | — |
| Disk | ~50 MB | +5-10 MB/month (DB growth) |
| CPU | Minimal | — |
| Network | ~5 MB/day | ~150 MB/month (yfinance calls) |

The platform is designed to run on a $5/month VPS.
