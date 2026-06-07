---
sidebar_position: 2
title: 'Backend Development'
---

# Backend Development

This guide is for developers who need to modify or extend the OptionDash backend.

## Project Structure

```
backend/
├── app.py              # Flask application entry point (factory function create_app)
├── config.py           # Configuration management (all environment variables centrally defined)
├── requirements.txt    # Python dependency list
├── api/                # REST API blueprint layer
│   ├── health.py       #   Health check
│   ├── dashboard.py    #   Dashboard overview
│   ├── strikes.py      #   Strike analysis
│   ├── comparison.py   #   Multi-ticker comparison
│   ├── historical.py   #   Historical data
│   └── macro.py        #   Macro indicators
├── services/           # Business logic layer (core calculations)
│   ├── market_data.py  #   yfinance data fetching and parsing
│   ├── greeks_engine.py#   Black-Scholes Greeks calculation engine
│   ├── max_pain.py     #   Max Pain calculation
│   ├── pcr.py          #   Put/Call Ratio
│   ├── gex.py          #   Gamma Exposure
│   ├── volatility.py   #   Implied and historical volatility
│   ├── anomaly.py      #   Anomaly detection
│   ├── macro_data.py   #   Macroeconomic indicator fetching
│   └── live_cache.py   #   Live cache management
├── scheduler/          # Background task scheduling
│   ├── jobs.py         #   Scheduled task definitions (snapshots, etc.)
│   └── poller.py       #   Poller (keeps cache fresh)
├── database/           # Database layer
│   ├── connection.py   #   Connection management and schema initialization
│   └── schema.sql      #   DDL table creation statements
└── utils/              # Utility functions
    ├── cache.py        #   TTL cache wrapper
    ├── rate_limiter.py #   Request rate limiter
    ├── helpers.py      #   General utilities
    └── errors.py       #   Unified error handling
```

## Adding a New API Endpoint

Using the addition of a new `/api/volatility-smile` endpoint as an example:

### Step 1: Create a Blueprint

Create a new file in the `api/` directory:

```python
# api/volatility_smile.py
from flask import Blueprint, jsonify
from services.volatility import compute_volatility_smile

vol_smile_bp = Blueprint("vol_smile", __name__)


@vol_smile_bp.route("/api/volatility-smile/<ticker>")
def get_volatility_smile(ticker: str):
    try:
        data = compute_volatility_smile(ticker)
        return jsonify({"ticker": ticker, "data": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

### Step 2: Add a Service Function

Add or update the corresponding business logic module in the `services/` directory, keeping the service layer separate from the API layer.

### Step 3: Register the Blueprint

Register it in `create_app()` in `app.py`:

```python
from api.volatility_smile import vol_smile_bp

def create_app() -> Flask:
    # ... other code ...
    app.register_blueprint(vol_smile_bp)
    # ...
```

### Step 4: Add Error Handling

- The service layer raises custom exceptions (defined in `utils/errors.py`)
- The API layer catches exceptions and returns unified JSON error responses
- Use `flask.abort()` or custom error responses

### Step 5: Update Frontend Types

Add the corresponding TypeScript type definitions in `frontend/src/types/index.ts`, and add the API call functions in `frontend/src/api/`.

## Adding a New Metric

Using the addition of a "Volatility Skew Index" metric as an example:

### Step 1: Create a Service Module

```python
# services/skew_index.py
import numpy as np
import pandas as pd


def compute_skew_index(options_chain: pd.DataFrame) -> float:
    """
    Calculate the volatility skew index.

    Uses the implied volatility difference between OTM puts and ATM calls
    to measure the level of market panic.
    """
    # Business logic implementation
    # ...
    return skew_value
```

### Step 2: Integrate into the Dashboard

Call the new metric in `services/live_cache.py` or `api/dashboard.py` and add it to the dashboard overview response data.

### Step 3: Add to Polling Cache

Add the pre-computation logic for the new metric to the polling tasks in `scheduler/poller.py`, ensuring the data is already cached when users request it.

### Step 4: Add to Historical Snapshots

If the metric needs historical tracking, record the metric value to the database in the daily snapshot tasks in `scheduler/jobs.py`.

## Dependency Reference

| Package | Version Constraint | Purpose |
|---------|-------------------|---------|
| `flask` | `>=3.1,<4` | Web framework |
| `flask-cors` | `>=5,<6` | Cross-Origin Resource Sharing support |
| `yfinance` | `>=0.2,<1` | Yahoo Finance options and market data |
| `py_vollib_vectorized` | `>=0.1,<1` | Vectorized Black-Scholes Greeks calculation |
| `numpy` | `>=1,<3` | Numerical computation foundation library |
| `pandas` | `>=2,<3` | Structured data processing |
| `scipy` | `>=1,<2` | Scientific computing (interpolation, optimization, etc.) |
| `apscheduler` | `>=3,<4` | Background task scheduling |
| `cachetools` | `>=5,<6` | TTL cache implementation |

## Code Standards

- Functions and variables use `snake_case`; classes use `PascalCase`
- All public functions must have docstrings
- The service layer does not directly depend on Flask's request context, making unit testing easier
- The API layer is responsible for parameter validation and response formatting, and does not contain business logic
- Use `ruff check` and `ruff format` to maintain consistent code style
