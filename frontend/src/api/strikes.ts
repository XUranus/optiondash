import apiClient from './client';
import type {
  OIWallData,
  MaxPainCurveData,
  GEXDistributionData,
} from '../types';

export async function fetchOIWall(
  ticker: string,
  expiration?: string
): Promise<OIWallData> {
  const params: Record<string, string> = { ticker };
  if (expiration) params.expiration = expiration;
  const { data } = await apiClient.get('/strikes/oi-wall', { params });
  return data;
}

export async function fetchMaxPainCurve(
  ticker: string,
  expiration?: string
): Promise<MaxPainCurveData> {
  const params: Record<string, string> = { ticker };
  if (expiration) params.expiration = expiration;
  const { data } = await apiClient.get('/strikes/max-pain-curve', { params });
  return data;
}

export async function fetchGEXDistribution(
  ticker: string,
  expiration?: string
): Promise<GEXDistributionData> {
  const params: Record<string, string> = { ticker };
  if (expiration) params.expiration = expiration;
  const { data } = await apiClient.get('/strikes/gex-distribution', { params });
  return data;
}
