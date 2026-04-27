// ============================
// API Response Types
// ============================

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

// Dashboard types
export interface PCRData {
  volume: number;
  oi: number;
  signal: 'bullish' | 'bearish' | 'neutral';
}

export interface GEXData {
  value: number;
  formatted: string;
  regime: 'positive_gamma' | 'negative_gamma';
}

export interface DashboardSummary {
  ticker: string;
  spot_price: number;
  daily_change: number;
  daily_change_pct: number;
  max_pain: number;
  deviation_from_max_pain: number;
  pcr: PCRData;
  gex: GEXData;
  atm_iv: number;
  expiration_used: string;
  updated_at: string;
}

export interface ExpirationsResponse {
  ticker: string;
  expirations: string[];
}

// Strike-level types
export interface OIWallData {
  ticker: string;
  expiration: string;
  spot_price: number;
  max_pain: number;
  strikes: number[];
  call_oi: number[];
  put_oi: number[];
}

export interface MaxPainCurveData {
  ticker: string;
  expiration: string;
  strikes: number[];
  total_loss: number[];
  max_pain_strike: number;
}

export interface GEXDistributionData {
  ticker: string;
  expiration: string;
  spot_price: number;
  strikes: number[];
  gex_per_strike: number[];
  total_gex: number;
}

// Comparison types
export interface AnomalyFlag {
  field: string;
  value: number;
  change_pct: number;
  type: 'spike' | 'drop' | 'extreme' | 'flip';
}

export interface ComparisonRow {
  ticker: string;
  spot_price: number;
  daily_change_pct: number;
  max_pain: number;
  deviation_from_max_pain: number;
  pcr: PCRData;
  gex: GEXData;
  total_call_oi: number;
  total_put_oi: number;
  total_call_volume: number;
  total_put_volume: number;
  anomalies: AnomalyFlag[];
}

export interface ComparisonResponse {
  data: ComparisonRow[];
  expiration_used: string;
  updated_at: string;
}

// Historical types
export interface MaxPainVsPriceData {
  ticker: string;
  dates: string[];
  prices: number[];
  max_pains: number[];
}

export interface PCRGEXData {
  ticker: string;
  dates: string[];
  pcr_volume: number[];
  pcr_oi: number[];
  gex: number[];
}

export interface VolatilityData {
  ticker: string;
  dates: string[];
  atm_iv: number[];
  hv30: number[];
  vrp: number[];
}

export interface SkewData {
  ticker: string;
  dates: string[];
  skew_25d: number[];
}

// Common types
export type Ticker = 'SPY' | 'QQQ' | 'IWM' | 'TLT' | 'XLF';

export interface ApiError {
  error: string;
  message: string;
}
