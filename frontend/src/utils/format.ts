/**
 * Format a number with commas and decimal places.
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number as currency.
 */
export function formatCurrency(value: number, decimals = 2): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${formatNumber(Math.abs(value), decimals)}`;
}

/**
 * Format a large number with B/M/K suffix.
 */
export function formatLargeNumber(value: number): string {
  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absVal >= 1e9) {
    return `${sign}$${(absVal / 1e9).toFixed(2)}B`;
  }
  if (absVal >= 1e6) {
    return `${sign}$${(absVal / 1e6).toFixed(2)}M`;
  }
  if (absVal >= 1e3) {
    return `${sign}$${(absVal / 1e3).toFixed(2)}K`;
  }
  return `${sign}$${absVal.toFixed(2)}`;
}

/**
 * Format a percentage value.
 */
export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a percentage that is already in percent form (not decimal).
 */
export function formatPercentRaw(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a date string to a short display format.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a timestamp to a short time display.
 */
export function formatTime(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
