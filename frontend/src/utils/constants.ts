import type { Ticker } from '../types';

// Supported tickers
export const SUPPORTED_TICKERS: Ticker[] = ['SPY', 'QQQ', 'IWM', 'TLT', 'XLF'];

// Default ticker
export const DEFAULT_TICKER: Ticker = 'SPY';

// Auto-refresh interval in milliseconds (5 minutes)
export const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

// API base URL (proxied through Vite in dev)
export const API_BASE_URL = '/api';

// Chart colors
export const COLORS = {
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6',
  orange: '#f97316',
  purple: '#a855f7',
  gray: '#6b7280',
  greenLight: 'rgba(34, 197, 94, 0.2)',
  redLight: 'rgba(239, 68, 68, 0.2)',
  blueLight: 'rgba(59, 130, 246, 0.2)',
} as const;

// PCR thresholds
export const PCR_BEARISH_THRESHOLD = 1.2;
export const PCR_BULLISH_THRESHOLD = 0.7;
