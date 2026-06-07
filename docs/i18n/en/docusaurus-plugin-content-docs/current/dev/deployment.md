---
sidebar_position: 4
title: 'Deployment Guide'
---

# Deployment Guide

This guide covers multiple deployment strategies for OptionDash, from development to production environments.

## Development Environment Deployment

The simplest way to start locally:

```bash
# Terminal 1 -- Backend
cd backend && python app.py
# Listening on http://localhost:5001

# Terminal 2 -- Frontend
cd frontend && npm run dev
# Listening on http://localhost:5173
```

## Production Deployment

### Option 1: Static Frontend + Flask Reverse Proxy

Suitable for small to medium-scale deployments. Uses Nginx to serve both frontend static assets and backend API proxying.

**Build the frontend:**

```bash
cd frontend
npm run build
# Output to frontend/dist/
```

**Nginx configuration example:**

```nginx
server {
    listen 80;
    server_name optiondash.example.com;

    # Frontend static assets
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # SSE / long connection support (if needed)
        proxy_buffering off;
    }
}
```

**Start the backend (using Gunicorn):**

```bash
pip install gunicorn
gunicorn -w 2 -b 127.0.0.1:5001 "app:create_app()"
```

### Option 2: Docker Deployment

Suitable for containerized deployment with one-click startup.

**Dockerfile (multi-stage build):**

```dockerfile
# === Frontend build stage ===
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# === Backend runtime stage ===
FROM python:3.12-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build artifacts
COPY --from=frontend-build /app/frontend/dist ./static

# Create data directory
RUN mkdir -p /app/backend/data

# Environment variables
ENV FLASK_HOST=0.0.0.0
ENV FLASK_PORT=5001
ENV CORS_ORIGINS="*"
ENV OPTIONDASH_DB=/app/backend/data/optiondash.db

EXPOSE 5001

WORKDIR /app/backend
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5001", "--timeout", "120", "app:create_app()"]
```

**Build and run:**

```bash
docker build -t optiondash .
docker run -d \
  -p 5001:5001 \
  -v optiondash-data:/app/backend/data \
  -e CORS_ORIGINS="https://optiondash.example.com" \
  --name optiondash \
  optiondash
```

### Option 3: Split Deployment

Deploy the frontend and backend to separate platforms:

| Layer | Recommended Platform | Description |
|-------|---------------------|-------------|
| Frontend | Vercel / Netlify / Cloudflare Pages | Static site with global CDN acceleration |
| Backend | Railway / Fly.io / VPS | Python runtime with scheduled task support |

**Frontend deployment notes:**

- Set the build command on the deployment platform: `npm run build`
- Output directory: `dist`
- Configure the environment variable `VITE_API_BASE_URL` to point to the backend API address

**Backend deployment notes:**

- Ensure the platform supports long-running processes (not serverless functions)
- Set `FLASK_DEBUG=false` to disable debug mode
- If scheduled tasks are needed, confirm the platform does not idle-suspend containers

## Environment Variable Configuration

### Required Variables for Production

```bash
# Disable debug mode
export FLASK_DEBUG=false

# Set CORS allowed domains
export CORS_ORIGINS="https://optiondash.example.com"

# Persistent database path
export OPTIONDASH_DB="/data/optiondash.db"
```

### Optional Production Optimization Variables

```bash
# Reduce yfinance request frequency to avoid rate limiting
export RATE_LIMIT_RPS=1.0
export POLL_INTERVAL_SEC=600

# Adjust caching strategy
export CACHE_TTL=600
export LIVE_CACHE_TTL_SEC=1200
```

## Database Management

### Backup

```bash
# Manual backup
cp backend/data/optiondash.db backup/optiondash_$(date +%Y%m%d).db

# Scheduled backup (add to crontab)
# Automatic backup at 2:00 AM daily
0 2 * * * cp /data/optiondash.db /backup/optiondash_$(date +\%Y\%m\%d).db
```

### Restore

```bash
# Stop the backend service
systemctl stop optiondash

# Replace the database file
cp backup/optiondash_20240101.db backend/data/optiondash.db

# Restart the service
systemctl start optiondash
```

## Monitoring

### Health Check

```bash
curl http://localhost:5001/api/health
# Returns: { "status": "ok", "timestamp": "...", "cache_size": 42 }
```

It is recommended to configure the health check endpoint `/api/health` on the deployment platform with a 30-second check interval.

### Logs

Backend log format:

```
2024-01-15 10:30:00 [INFO] api.dashboard: Fetched SPY dashboard in 0.45s
2024-01-15 10:30:05 [WARNING] services.market_data: yfinance rate limited, retrying
2024-01-15 10:30:10 [ERROR] services.greeks_engine: NaN encountered in delta calc
```

In production, it is recommended to output logs to a file and use log collection tools (such as Loki, ELK).

### Resource Usage

| Resource | Estimated Value |
|----------|-----------------|
| Memory | ~200MB (including cache) |
| CPU | Near 0% when idle, peak ~1 core during computation |
| Disk | Database file ~50MB (7 days of data) |
| Network | Only outbound requests to Yahoo Finance, minimal bandwidth |

## Performance Optimization

- **Gzip Compression**: Configure `gzip on;` in Nginx to compress JSON and static assets
- **CDN Acceleration**: Host frontend static assets on a CDN to reduce server load
- **Cache Warmup**: Use `scheduler/poller.py` to warm up the cache before market open, avoiding first-request delays
- **Database Connection Pool**: SQLite supports concurrent reads natively; writes are optimized through WAL mode
- **Gunicorn Workers**: Recommended setting is `CPU cores * 2 + 1`, but since OptionDash is I/O intensive, 2 workers are usually sufficient
