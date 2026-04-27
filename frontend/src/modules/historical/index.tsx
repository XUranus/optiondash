import React, { useCallback, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTickerData } from '../../hooks/useTickerData';
import {
  fetchMaxPainVsPrice,
  fetchPCRGEX,
  fetchVolatility,
  fetchSkew,
} from '../../api/historical';
import LoadingCard from '../../components/LoadingCard';
import { COLORS } from '../../utils/constants';
import type {
  MaxPainVsPriceData,
  PCRGEXData,
  VolatilityData,
  SkewData,
} from '../../types';

interface Props {
  ticker?: string;
}

const HistoricalModule: React.FC<Props> = ({ ticker = 'SPY' }) => {
  const days = 90;

  const mpFetchFn = useCallback(
    () => fetchMaxPainVsPrice(ticker, days),
    [ticker],
  );
  const { data: mpData, loading: mpLoading } = useTickerData<MaxPainVsPriceData>(mpFetchFn);

  const pcrFetchFn = useCallback(
    () => fetchPCRGEX(ticker, days),
    [ticker],
  );
  const { data: pcrData, loading: pcrLoading } = useTickerData<PCRGEXData>(pcrFetchFn);

  const volFetchFn = useCallback(
    () => fetchVolatility(ticker, days),
    [ticker],
  );
  const { data: volData, loading: volLoading } = useTickerData<VolatilityData>(volFetchFn);

  const skewFetchFn = useCallback(
    () => fetchSkew(ticker, days),
    [ticker],
  );
  const { data: skewData, loading: skewLoading } = useTickerData<SkewData>(skewFetchFn);

  const mpvsPriceOption = useMemo(() => {
    if (!mpData) return {};
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Spot Price', 'Max Pain'], top: 0 },
      grid: { top: 40, right: 20, bottom: 40, left: 60 },
      xAxis: {
        type: 'category',
        data: mpData.dates,
      },
      yAxis: {
        type: 'value',
        name: 'Price ($)',
      },
      series: [
        {
          name: 'Spot Price',
          type: 'line',
          data: mpData.prices,
          smooth: true,
          lineStyle: { color: COLORS.blue, width: 2 },
          itemStyle: { color: COLORS.blue },
        },
        {
          name: 'Max Pain',
          type: 'line',
          data: mpData.max_pains,
          smooth: true,
          lineStyle: { color: COLORS.orange, width: 2, type: 'dashed' },
          itemStyle: { color: COLORS.orange },
        },
      ],
    };
  }, [mpData]);

  const pcrGexOption = useMemo(() => {
    if (!pcrData) return {};
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['PCR Volume', 'PCR OI', 'GEX'], top: 0 },
      grid: { top: 40, right: 80, bottom: 40, left: 60 },
      xAxis: {
        type: 'category',
        data: pcrData.dates,
      },
      yAxis: [
        {
          type: 'value',
          name: 'PCR',
          min: 0,
        },
        {
          type: 'value',
          name: 'GEX ($)',
          axisLabel: {
            formatter: (v: number) => {
              if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
              if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
              return `$${v}`;
            },
          },
        },
      ],
      series: [
        {
          name: 'PCR Volume',
          type: 'line',
          data: pcrData.pcr_volume,
          yAxisIndex: 0,
          smooth: true,
          lineStyle: { color: COLORS.purple },
        },
        {
          name: 'PCR OI',
          type: 'line',
          data: pcrData.pcr_oi,
          yAxisIndex: 0,
          smooth: true,
          lineStyle: { color: COLORS.gray, type: 'dashed' },
        },
        {
          name: 'GEX',
          type: 'bar',
          data: pcrData.gex,
          yAxisIndex: 1,
          itemStyle: {
            color: (params: any) =>
              params.value >= 0 ? COLORS.green : COLORS.red,
          },
        },
      ],
    };
  }, [pcrData]);

  const volOption = useMemo(() => {
    if (!volData) return {};
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['ATM IV', 'HV30', 'VRP'], top: 0 },
      grid: { top: 40, right: 20, bottom: 40, left: 60 },
      xAxis: {
        type: 'category',
        data: volData.dates,
      },
      yAxis: {
        type: 'value',
        name: 'Volatility',
        axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
      },
      series: [
        {
          name: 'ATM IV',
          type: 'line',
          data: volData.atm_iv,
          smooth: true,
          lineStyle: { color: COLORS.blue, width: 2 },
        },
        {
          name: 'HV30',
          type: 'line',
          data: volData.hv30,
          smooth: true,
          lineStyle: { color: COLORS.gray, width: 1.5, type: 'dashed' },
        },
        {
          name: 'VRP',
          type: 'line',
          data: volData.vrp,
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                { offset: 0.5, color: 'rgba(107, 114, 128, 0.1)' },
                { offset: 1, color: 'rgba(34, 197, 94, 0.3)' },
              ],
            },
          },
          lineStyle: { color: COLORS.orange, width: 1 },
          itemStyle: { color: COLORS.orange },
        },
      ],
    };
  }, [volData]);

  const skewOption = useMemo(() => {
    if (!skewData) return {};
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const val = params[0]?.value;
          return `Date: ${params[0]?.axisValue}<br/>Skew: ${(val * 100).toFixed(2)}%`;
        },
      },
      legend: { data: ['25Δ Skew'], top: 0 },
      grid: { top: 40, right: 20, bottom: 40, left: 60 },
      xAxis: {
        type: 'category',
        data: skewData.dates,
      },
      yAxis: {
        type: 'value',
        name: 'Skew',
        axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(1)}%` },
      },
      series: [
        {
          name: '25Δ Skew',
          type: 'line',
          data: skewData.skew_25d,
          smooth: true,
          areaStyle: {
            color: 'rgba(168, 85, 247, 0.15)',
          },
          lineStyle: { color: COLORS.purple, width: 2 },
          itemStyle: { color: COLORS.purple },
          markArea: {
            silent: true,
            data: [
              [
                { yAxis: 0.05, itemStyle: { color: 'rgba(239, 68, 68, 0.1)' } },
                { itemStyle: { color: 'rgba(239, 68, 68, 0.1)' } },
              ],
              [
                { itemStyle: { color: 'rgba(239, 68, 68, 0.1)' } },
                { yAxis: -0.05, itemStyle: { color: 'rgba(239, 68, 68, 0.1)' } },
              ],
            ],
          },
        },
      ],
    };
  }, [skewData]);

  const hasNoData = !mpData?.dates?.length
    && !pcrData?.dates?.length
    && !volData?.dates?.length
    && !skewData?.dates?.length;

  return (
    <div>
      {hasNoData && !mpLoading && !pcrLoading && !volLoading && !skewLoading && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded text-sm">
          No historical data yet. Data is accumulated daily via the scheduler. Use the
          snapshot API to backfill data.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Max Pain vs Spot Price
          </h3>
          {mpLoading ? (
            <LoadingCard title="Loading..." height={300} />
          ) : (
            <ReactECharts option={mpvsPriceOption} style={{ height: 300 }} />
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            PCR & GEX Trends
          </h3>
          {pcrLoading ? (
            <LoadingCard title="Loading..." height={300} />
          ) : (
            <ReactECharts option={pcrGexOption} style={{ height: 300 }} />
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Volatility Study
          </h3>
          {volLoading ? (
            <LoadingCard title="Loading..." height={300} />
          ) : (
            <ReactECharts option={volOption} style={{ height: 300 }} />
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            25-Delta Skew
          </h3>
          {skewLoading ? (
            <LoadingCard title="Loading..." height={300} />
          ) : (
            <ReactECharts option={skewOption} style={{ height: 300 }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricalModule;
