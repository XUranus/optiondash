import apiClient from './client';
import type { TickersResponse } from '../types';

export async function fetchTickers(): Promise<TickersResponse> {
  const { data } = await apiClient.get('/tickers');
  return data;
}
