import apiClient from './client';
import type { DashboardSummary, ExpirationsResponse } from '../types';

export async function fetchDashboardSummary(
  ticker: string,
  expiration?: string
): Promise<DashboardSummary> {
  const params: Record<string, string> = { ticker };
  if (expiration) params.expiration = expiration;
  const { data } = await apiClient.get('/dashboard/summary', { params });
  return data;
}

export async function fetchExpirations(
  ticker: string
): Promise<ExpirationsResponse> {
  const { data } = await apiClient.get('/dashboard/expirations', {
    params: { ticker },
  });
  return data;
}
