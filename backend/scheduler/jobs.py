"""
APScheduler jobs for daily snapshot collection.
"""

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from config import Config
from services.market_data import get_options_chain, get_historical_prices
from services.greeks_engine import compute_chain_greeks
from services.max_pain import calculate_max_pain
from services.pcr import calculate_pcr
from services.gex import calculate_gex
from services.volatility import calculate_hv, calculate_atm_iv, calculate_vrp, calculate_skew_25d
from database.connection import db
from utils.helpers import safe_int, safe_float

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def daily_snapshot_job():
    """
    Runs daily after market close.
    Fetches option chain for each supported ticker and stores snapshots.
    """
    from datetime import datetime, timezone

    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    logger.info(f"Starting daily snapshot job for {date_str}")

    for ticker in Config.SUPPORTED_TICKERS:
        try:
            chain = get_options_chain(ticker)
            chain = compute_chain_greeks(chain)
            calls = chain["calls"]
            puts = chain["puts"]
            spot = chain["spot_price"]

            max_pain_result = calculate_max_pain(calls, puts)
            pcr_result = calculate_pcr(calls, puts)
            gex_result = calculate_gex(calls, puts, spot)

            atm_iv = calculate_atm_iv(calls, puts, spot)

            prices_df = get_historical_prices(ticker, period="90d")
            hv30 = calculate_hv(prices_df["Close"], window=30)
            vrp = calculate_vrp(atm_iv, hv30)
            skew = calculate_skew_25d(calls, puts, spot)

            db.execute(
                """
                INSERT OR REPLACE INTO daily_snapshots
                (date, ticker, spot_price, max_pain, pcr_volume, pcr_oi, gex,
                 atm_iv, hv30, vrp, skew_25d,
                 total_call_volume, total_put_volume, total_call_oi, total_put_oi)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    date_str, ticker, spot,
                    max_pain_result["max_pain_strike"],
                    pcr_result["pcr_volume"], pcr_result["pcr_oi"],
                    gex_result["value"],
                    atm_iv, hv30, vrp, skew,
                    pcr_result["total_call_volume"], pcr_result["total_put_volume"],
                    pcr_result["total_call_oi"], pcr_result["total_put_oi"],
                ),
            )

            # Strike-level data
            strike_rows = []
            for side_key, df in (("calls", calls), ("puts", puts)):
                for _, row in df.iterrows():
                    strike_rows.append((
                        date_str, ticker, chain["expiration"],
                        safe_float(row["strike"]),
                        safe_int(row.get("open_interest")) if side_key == "calls" else 0,
                        safe_int(row.get("open_interest")) if side_key == "puts" else 0,
                        safe_int(row.get("volume")) if side_key == "calls" else 0,
                        safe_int(row.get("volume")) if side_key == "puts" else 0,
                        safe_float(row.get("implied_volatility")) if side_key == "calls" else 0.0,
                        safe_float(row.get("implied_volatility")) if side_key == "puts" else 0.0,
                        safe_float(row.get("gamma")) if side_key == "calls" else 0.0,
                        safe_float(row.get("gamma")) if side_key == "puts" else 0.0,
                        safe_float(row.get("delta")) if side_key == "calls" else 0.0,
                        safe_float(row.get("delta")) if side_key == "puts" else 0.0,
                    ))

            db.execute_many(
                """
                INSERT OR REPLACE INTO strike_snapshots
                (date, ticker, expiration, strike,
                 call_oi, put_oi, call_volume, put_volume,
                 call_iv, put_iv, call_gamma, put_gamma, call_delta, put_delta)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                strike_rows,
            )

            logger.info(f"Snapshot saved for {ticker}: {len(strike_rows)} strikes")
        except Exception as e:
            logger.error(f"Snapshot failed for {ticker}: {e}")


def start_scheduler():
    """Start the background scheduler with daily snapshot + live poller."""
    # Daily snapshot at market close
    scheduler.add_job(
        daily_snapshot_job,
        trigger="cron",
        hour=Config.SNAPSHOT_HOUR,
        minute=Config.SNAPSHOT_MINUTE,
        timezone="US/Eastern",
        id="daily_snapshot",
        replace_existing=True,
    )

    # Background poller runs on a regular interval to keep live_cache warm
    from scheduler.poller import poll_all_tickers

    scheduler.add_job(
        poll_all_tickers,
        trigger="interval",
        seconds=Config.POLL_INTERVAL_SEC,
        id="live_poller",
        replace_existing=True,
    )

    # Run an initial poll immediately (non-blocking)
    scheduler.add_job(
        poll_all_tickers,
        trigger="date",
        id="live_poller_initial",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        f"Scheduler started: daily snapshot at {Config.SNAPSHOT_HOUR:02d}:{Config.SNAPSHOT_MINUTE:02d} ET, "
        f"live poller every {Config.POLL_INTERVAL_SEC}s"
    )


def stop_scheduler():
    """Stop the background scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
