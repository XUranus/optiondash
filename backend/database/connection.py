"""
SQLite connection manager with thread-safe access and WAL mode.
"""

import os
import sqlite3
import threading
from contextlib import contextmanager

from config import Config


class Database:
    """Thread-safe SQLite database manager."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._local = threading.local()
        self._ensure_data_dir()
        self._init_schema()

    def _ensure_data_dir(self):
        """Create the data directory if it doesn't exist."""
        data_dir = os.path.dirname(Config.DATABASE_PATH)
        if data_dir:
            os.makedirs(data_dir, exist_ok=True)

    def _get_connection(self) -> sqlite3.Connection:
        """Get a thread-local database connection."""
        if not hasattr(self._local, "connection") or self._local.connection is None:
            conn = sqlite3.connect(Config.DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA foreign_keys=ON")
            conn.execute("PRAGMA busy_timeout=5000")
            self._local.connection = conn
        return self._local.connection

    def _init_schema(self):
        """Initialize database schema from schema.sql."""
        schema_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "schema.sql"
        )
        with open(schema_path, "r") as f:
            schema_sql = f.read()

        conn = self._get_connection()
        conn.executescript(schema_sql)
        conn.commit()

    @contextmanager
    def get_cursor(self):
        """Context manager for database cursor with auto-commit/rollback."""
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            yield cursor
            conn.commit()
        except Exception:
            conn.rollback()
            raise

    def execute(self, query: str, params: tuple = ()) -> list:
        """Execute a query and return all results as list of dicts."""
        with self.get_cursor() as cursor:
            cursor.execute(query, params)
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
            return []

    def execute_one(self, query: str, params: tuple = ()) -> dict | None:
        """Execute a query and return the first result as a dict."""
        results = self.execute(query, params)
        return results[0] if results else None

    def execute_insert(self, query: str, params: tuple = ()) -> int:
        """Execute an insert and return the last row id."""
        with self.get_cursor() as cursor:
            cursor.execute(query, params)
            return cursor.lastrowid

    def execute_many(self, query: str, params_list: list[tuple]) -> int:
        """Execute a batch insert and return the number of rows affected."""
        with self.get_cursor() as cursor:
            cursor.executemany(query, params_list)
            return cursor.rowcount


# Module-level convenience instance
db = Database()
