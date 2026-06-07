import React, { useCallback, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTickerData, useAutoRefresh } from '../../hooks/useTickerData';
import { fetchMacroCurrent, fetchMacroHistory } from '../../api/macro';
import MetricCard from '../../components/MetricCard';
import LoadingCard from '../../components/LoadingCard';
import type { MacroCurrentResponse, MacroHistoryResponse } from '../../types';
import { VIX_LEVELS, MACRO_COLORS } from '../../utils/constants';

function getVixRegime(vix: number): { label: string; color: string } {
  if (vix >= VIX_LEVELS.HIGH) return { label: 'Extreme Fear', color: '#7f1d1d' };
  if (vix >= VIX_LEVELS.ELEVATED) return { label: 'Fear', color: 'red' };
  if (vix >= VIX_LEVELS.MODERATE) return { label: 'Caution', color: 'orange' };
  if (vix >= VIX_LEVELS.LOW) return { label: 'Normal', color: 'gold' };
  return { label: 'Complacency', color: 'green' };
}

const MacroModule: React.FC = () => {
  const fetchCurrentFn = useCallback(() => fetchMacroCurrent(), []);
  const { data, loading, error, refetch } = useTickerData<MacroCurrentResponse>(fetchCurrentFn);

  const fetchHistFn = useCallback(
    () => fetchMacroHistory(['VIX', 'TNX', 'TYX', 'DXY'], 90),
    [],
  );
  const { data: histData, loading: histLoading } = useTickerData<MacroHistoryResponse>(fetchHistFn);

  useAutoRefresh(refetch);

  const ind = data?.indicators;

  // VIX regime
  const vixRegime = ind?.vix != null ? getVixRegime(ind.vix) : null;

  // Yield spread between 30Y and 10Y
  const yieldSpread = ind?.tnx != null && ind?.tyx != null
    ? (ind.tyx - ind.tnx).toFixed(2)
    : null;

  // Spread signal
  const spreadSignal = ind?.spread_10y3m != null
    ? ind.spread_10y3m >= 0
      ? { label: 'Normal', color: 'green' }
      : { label: 'Inverted', color: 'red' }
    : null;

  // ---- Yields Chart ----
  const yieldsOption = useMemo(() => {
    if (!histData) return {};
    const dates = histData.dates as string[] || [];
    const tnx = (histData as any).tnx || [];
    const tyx = (histData as any).tyx || [];
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let s = `${params[0]?.axisValue}<br/>`;
          params.forEach((p: any) => {
            s += `${p.marker} ${p.seriesName}: ${p.value?.toFixed(2) ?? '-'}%<br/>`;
          });
          return s;
        },
      },
      legend: { data: ['10Y Yield', '30Y Yield'], top: 0 },
      grid: { top: 40, right: 20, bottom: 40, left: 60 },
      xAxis: { type: 'category', data: dates },
      yAxis: {
        type: 'value',
        name: 'Yield (%)',
        axisLabel: { formatter: (v: number) => `${v.toFixed(1)}%` },
      },
      series: [
        {
          name: '10Y Yield',
          type: 'line',
          data: tnx,
          smooth: true,
          lineStyle: { color: MACRO_COLORS.tnx, width: 2 },
          itemStyle: { color: MACRO_COLORS.tnx },
        },
        {
          name: '30Y Yield',
          type: 'line',
          data: tyx,
          smooth: true,
          lineStyle: { color: MACRO_COLORS.tyx, width: 2 },
          itemStyle: { color: MACRO_COLORS.tyx },
        },
      ],
    };
  }, [histData]);

  // ---- VIX & DXY Chart (dual-axis with regime shading) ----
  const vixDxyOption = useMemo(() => {
    if (!histData) return {};
    const dates = histData.dates as string[] || [];
    const vixSeries = (histData as any).vix || [];
    const dxySeries = (histData as any).dxy || [];
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let s = `${params[0]?.axisValue}<br/>`;
          params.forEach((p: any) => {
            const unit = p.seriesName === 'DXY' ? '' : '';
            s += `${p.marker} ${p.seriesName}: ${p.value?.toFixed(2) ?? '-'}${unit}<br/>`;
          });
          return s;
        },
      },
      legend: { data: ['VIX', 'DXY'], top: 0 },
      grid: { top: 40, right: 80, bottom: 40, left: 60 },
      xAxis: { type: 'category', data: dates },
      yAxis: [
        {
          type: 'value',
          name: 'VIX',
          min: 0,
        },
        {
          type: 'value',
          name: 'DXY',
        },
      ],
      series: [
        {
          name: 'VIX',
          type: 'line',
          data: vixSeries,
          yAxisIndex: 0,
          smooth: true,
          lineStyle: { color: MACRO_COLORS.vix, width: 2 },
          itemStyle: { color: MACRO_COLORS.vix },
          markArea: {
            silent: true,
            data: [
              [
                { yAxis: 0, itemStyle: { color: 'rgba(34, 197, 94, 0.06)' } },
                { yAxis: VIX_LEVELS.LOW, itemStyle: { color: 'rgba(34, 197, 94, 0.06)' } },
              ],
              [
                { yAxis: VIX_LEVELS.LOW, itemStyle: { color: 'rgba(250, 204, 21, 0.06)' } },
                { yAxis: VIX_LEVELS.MODERATE, itemStyle: { color: 'rgba(250, 204, 21, 0.06)' } },
              ],
              [
                { yAxis: VIX_LEVELS.MODERATE, itemStyle: { color: 'rgba(249, 115, 22, 0.08)' } },
                { yAxis: VIX_LEVELS.ELEVATED, itemStyle: { color: 'rgba(249, 115, 22, 0.08)' } },
              ],
              [
                { yAxis: VIX_LEVELS.ELEVATED, itemStyle: { color: 'rgba(239, 68, 68, 0.10)' } },
                { yAxis: VIX_LEVELS.HIGH, itemStyle: { color: 'rgba(239, 68, 68, 0.10)' } },
              ],
              [
                { yAxis: VIX_LEVELS.HIGH, itemStyle: { color: 'rgba(127, 29, 29, 0.12)' } },
                { itemStyle: { color: 'rgba(127, 29, 29, 0.12)' } },
              ],
            ],
          },
        },
        {
          name: 'DXY',
          type: 'line',
          data: dxySeries,
          yAxisIndex: 1,
          smooth: true,
          lineStyle: { color: MACRO_COLORS.dxy, width: 2 },
          itemStyle: { color: MACRO_COLORS.dxy },
        },
      ],
    };
  }, [histData]);

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded">
        Failed to load macro data: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {loading ? (
          <>
            <LoadingCard title="VIX" />
            <LoadingCard title="10Y Yield" />
            <LoadingCard title="30Y Yield" />
            <LoadingCard title="DXY" />
            <LoadingCard title="VVIX" />
            <LoadingCard title="10Y-3M Spread" />
          </>
        ) : ind ? (
          <>
            {/* VIX */}
            <MetricCard
              title="VIX"
              value={ind.vix?.toFixed(2) ?? '--'}
              tag={vixRegime || undefined}
              description="CBOE Volatility Index — the 'fear gauge'"
              tooltip="VIX measures expected S&P 500 volatility. Low = complacency, High = fear."
            />

            {/* 10Y Yield */}
            <MetricCard
              title="10Y Yield"
              value={ind.tnx?.toFixed(2) ?? '--'}
              suffix={<span className="text-sm text-gray-400">%</span>}
              description="Benchmark risk-free rate"
              tooltip="10-year Treasury note yield. Rising yields pressure equity valuations."
            />

            {/* 30Y Yield */}
            <MetricCard
              title="30Y Yield"
              value={ind.tyx?.toFixed(2) ?? '--'}
              suffix={<span className="text-sm text-gray-400">%</span>}
              description={
                yieldSpread
                  ? `${Number(yieldSpread) >= 0 ? '+' : ''}${yieldSpread}% vs 10Y`
                  : undefined
              }
              tooltip="30-year Treasury bond yield. Long-end rate reflecting inflation and growth expectations."
            />

            {/* DXY */}
            <MetricCard
              title="DXY"
              value={ind.dxy?.toFixed(2) ?? '--'}
              tag={ind.dxy != null
                ? { label: ind.dxy >= 100 ? 'Strong' : 'Weak', color: ind.dxy >= 100 ? 'green' : 'red' }
                : undefined}
              description="US Dollar Index"
              tooltip="DXY tracks the dollar against a basket of major currencies. Strong dollar = headwind for commodities and international equities."
            />

            {/* VVIX */}
            <MetricCard
              title="VVIX"
              value={ind.vvix?.toFixed(2) ?? '--'}
              tag={ind.vvix != null
                ? { label: ind.vvix >= 120 ? 'High' : ind.vvix >= 90 ? 'Normal' : 'Low', color: ind.vvix >= 120 ? 'red' : ind.vvix >= 90 ? 'blue' : 'green' }
                : undefined}
              description="Volatility of VIX"
              tooltip="VVIX measures the volatility of VIX itself. Extreme VVIX readings signal market turning points."
            />

            {/* 10Y-3M Spread */}
            <MetricCard
              title="10Y-3M Spread"
              value={ind.spread_10y3m?.toFixed(2) ?? '--'}
              suffix={<span className="text-sm text-gray-400">%</span>}
              tag={spreadSignal || undefined}
              description={ind.spread_10y3m != null
                ? ind.spread_10y3m < 0
                  ? 'Yield curve inverted — recession warning'
                  : 'Yield curve normal'
                : undefined}
              tooltip="10Y-3M yield spread. Inversion (negative spread) has historically preceded recessions."
            />
          </>
        ) : (
          <div className="col-span-3 text-center text-gray-400 py-8">
            No macro data available
          </div>
        )}
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Treasury Yields
          </h3>
          {histLoading ? (
            <LoadingCard title="Loading..." height={300} />
          ) : (
            <ReactECharts option={yieldsOption} style={{ height: 300 }} />
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            VIX & DXY
          </h3>
          {histLoading ? (
            <LoadingCard title="Loading..." height={300} />
          ) : (
            <ReactECharts option={vixDxyOption} style={{ height: 300 }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MacroModule;
