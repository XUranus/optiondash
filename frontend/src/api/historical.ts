import apiClient from './client';
import type {
  MaxPainVsPriceData,
  PCRGEXData,
  VolatilityData,
  SkewData,
} from '../types';

export async function fetchMaxPainVsPrice(
  ticker: string,
  days = 90
): Promise<MaxPainVsPriceData> {
  const { data } = await apiClient.get('/historical/max-pain-vs-price', {
    params: { ticker, days },
  });
  return data;
}

export async function fetchPCRGEX(
  ticker: string,
  days = 90
): Promise<PCRGEXData> {
  const { data } = await apiClient.get('/historical/pcr-gex', {
    params: { ticker, days },
  });
  return data;
}

export async function fetchVolatility(
  ticker: string,
  days = 90
): Promise<VolatilityData> {
  const { data } = await apiClient.get('/historical/volatility', {
    params: { ticker, days },
  });
  return data;
}

export async function fetchSkew(
  ticker: string,
  days = 90
): Promise<SkewData> {
  const { data } = await apiClient.get('/historical/skew', {
    params: { ticker, days },
  });
  return data;
}
