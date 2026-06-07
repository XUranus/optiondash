import type { Ticker } from '../types';

// These are fallback defaults — actual tickers are fetched from GET /api/tickers
export const FALLBACK_TICKERS: Ticker[] = ['SPY', 'QQQ', 'IWM', 'TLT', 'XLF'];

// Default ticker fallback
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

// VIX regime thresholds
export const VIX_LEVELS = {
  LOW: 15,
  MODERATE: 20,
  ELEVATED: 25,
  HIGH: 30,
} as const;

// Macro metric display names
export const MACRO_LABELS: Record<string, string> = {
  vix: 'VIX',
  tnx: '10Y Yield',
  tyx: '30Y Yield',
  irx: '13W T-Bill',
  dxy: 'DXY',
  vvix: 'VVIX',
  spread_10y3m: '10Y-3M Spread',
} as const;

// Macro chart colors
export const MACRO_COLORS = {
  vix: '#ef4444',
  tnx: '#3b82f6',
  tyx: '#8b5cf6',
  irx: '#9ca3af',
  dxy: '#f97316',
  vvix: '#ec4899',
  spread: '#22c55e',
} as const;
