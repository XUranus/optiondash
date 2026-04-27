import apiClient from './client';
import type { ComparisonResponse } from '../types';

export async function fetchComparison(
  tickers: string[],
  expiration?: string
): Promise<ComparisonResponse> {
  const params: Record<string, string> = {
    tickers: tickers.join(','),
  };
  if (expiration) params.expiration = expiration;
  const { data } = await apiClient.get('/comparison/overview', { params });
  return data;
}
