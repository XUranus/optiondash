import apiClient from './client';
import type { MacroCurrentResponse, MacroHistoryResponse } from '../types';

export async function fetchMacroCurrent(): Promise<MacroCurrentResponse> {
  const { data } = await apiClient.get('/macro/current');
  return data;
}

export async function fetchMacroHistory(
  indicators: string[],
  days = 90
): Promise<MacroHistoryResponse> {
  const { data } = await apiClient.get('/macro/history', {
    params: { indicators: indicators.join(','), days },
  });
  return data;
}
