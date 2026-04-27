import React, { useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTickerData } from '../../hooks/useTickerData';
import {
  fetchOIWall,
  fetchMaxPainCurve,
  fetchGEXDistribution,
} from '../../api/strikes';
import { fetchExpirations } from '../../api/dashboard';
import ExpirationPicker from '../../components/ExpirationPicker';
import LoadingCard from '../../components/LoadingCard';
import { COLORS } from '../../utils/constants';
import type { OIWallData, MaxPainCurveData, GEXDistributionData } from '../../types';

interface Props {
  ticker?: string;
}

const StrikesModule: React.FC<Props> = ({ ticker = 'SPY' }) => {
  const [expiration, setExpiration] = React.useState<string>();

  const expFetchFn = useCallback(() => fetchExpirations(ticker), [ticker]);
  const { data: expData } = useTickerData(expFetchFn);

  React.useEffect(() => {
    if (expData?.expirations?.length && !expiration) {
      setExpiration(expData.expirations[0]);
    }
  }, [expData, expiration]);

  const oiFetchFn = useCallback(
    () => fetchOIWall(ticker, expiration),
    [ticker, expiration],
  );
  const { data: oiData, loading: oiLoading } = useTickerData<OIWallData>(oiFetchFn);

  const mpFetchFn = useCallback(
    () => fetchMaxPainCurve(ticker, expiration),
    [ticker, expiration],
  );
  const { data: mpData, loading: mpLoading } = useTickerData<MaxPainCurveData>(mpFetchFn);

  const gexFetchFn = useCallback(
    () => fetchGEXDistribution(ticker, expiration),
    [ticker, expiration],
  );
  const { data: gexData, loading: gexLoading } = useTickerData<GEXDistributionData>(gexFetchFn);

  const oiWallOption = React.useMemo(() => {
    if (!oiData) return {};
    const callData = oiData.call_oi;
    const putData = oiData.put_oi.map((v: number) => -v);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const strike = params[0]?.axisValue;
          let html = `<strong>Strike: $${strike}</strong><br/>`;
          params.forEach((p: any) => {
            const val = Math.abs(p.value).toLocaleString();
            html += `${p.marker} ${p.seriesName}: ${val}<br/>`;
          });
          return html;
        },
      },
      legend: {
        data: ['Call OI', 'Put OI'],
        top: 0,
      },
      grid: { top: 40, right: 20, bottom: 50, left: 60 },
      xAxis: {
        type: 'category',
        data: oiData.strikes,
        name: 'Strike',
        axisLabel: {
          formatter: (v: string) => `$${Number(v).toFixed(0)}`,
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Open Interest',
        axisLabel: {
          formatter: (v: number) => Math.abs(v).toLocaleString(),
        },
      },
      series: [
        {
          name: 'Call OI',
          type: 'bar',
          data: callData,
          itemStyle: { color: COLORS.green },
          stack: 'oi',
        },
        {
          name: 'Put OI',
          type: 'bar',
          data: putData,
          itemStyle: { color: COLORS.red },
          stack: 'oi',
        },
      ],
      markLine: {
        silent: true,
        symbol: 'none',
        data: [
          {
            xAxis: oiData.spot_price,
            lineStyle: { color: COLORS.blue, type: 'dashed' },
            label: { formatter: `Spot $${oiData.spot_price}`, position: 'end', color: COLORS.blue },
          },
          {
            xAxis: oiData.max_pain,
            lineStyle: { color: COLORS.orange, type: 'dashed' },
            label: { formatter: `Max Pain $${oiData.max_pain}`, position: 'end', color: COLORS.orange },
          },
        ],
      },
    };
  }, [oiData]);

  const maxPainOption = React.useMemo(() => {
    if (!mpData) return {};
    const minIdx = mpData.total_loss.indexOf(Math.min(...mpData.total_loss));

    return {
      tooltip: {
        trigger: 'axis',
      },
      grid: { top: 20, right: 20, bottom: 50, left: 80 },
      xAxis: {
        type: 'category',
        data: mpData.strikes,
        name: 'Strike',
        axisLabel: {
          formatter: (v: string) => `$${Number(v).toFixed(0)}`,
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Total Loss ($)',
        axisLabel: {
          formatter: (v: number) => {
            if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
            if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
            return `$${v}`;
          },
        },
      },
      series: [
        {
          type: 'line',
          data: mpData.total_loss,
          smooth: true,
          areaStyle: { color: COLORS.blueLight },
          lineStyle: { color: COLORS.blue },
          itemStyle: { color: COLORS.blue },
          markPoints: minIdx >= 0
            ? {
                data: [
                  {
                    coord: [minIdx, mpData.total_loss[minIdx]],
                    value: `Max Pain: $${mpData.max_pain_strike}`,
                    itemStyle: { color: COLORS.orange },
                  },
                ],
              }
            : undefined,
        },
      ],
    };
  }, [mpData]);

  const gexDistOption = React.useMemo(() => {
    if (!gexData) return {};
    const barData = gexData.gex_per_strike.map((val: number, i: number) => ({
      value: val,
      itemStyle: { color: val >= 0 ? COLORS.green : COLORS.red },
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const value = params[0]?.value;
          return `<strong>Strike: $${params[0]?.axisValue}</strong><br/>
                  GEX: ${value >= 0 ? '+' : ''}$${Math.abs(value).toLocaleString()}`;
        },
      },
      grid: { top: 20, right: 20, bottom: 50, left: 80 },
      xAxis: {
        type: 'category',
        data: gexData.strikes,
        name: 'Strike',
        axisLabel: {
          formatter: (v: string) => `$${Number(v).toFixed(0)}`,
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Gamma Exposure ($)',
        axisLabel: {
          formatter: (v: number) => {
            if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
            if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
            return `$${v}`;
          },
        },
      },
      series: [
        {
          type: 'bar',
          data: barData,
        },
      ],
      markLine: {
        silent: true,
        symbol: 'none',
        data: [
          {
            yAxis: 0,
            lineStyle: { color: COLORS.gray, type: 'dashed' },
            label: { formatter: 'Zero Gamma', color: COLORS.gray },
          },
          {
            xAxis: gexData.spot_price,
            lineStyle: { color: COLORS.blue, type: 'dashed' },
            label: { formatter: `Spot $${gexData.spot_price}`, position: 'end', color: COLORS.blue },
          },
        ],
      },
    };
  }, [gexData]);

  return (
    <div>
      {expData && (
        <div className="mb-4">
          <ExpirationPicker
            expirations={expData.expirations}
            value={expiration}
            onChange={setExpiration}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">OI Wall (Open Interest by Strike)</h3>
          {oiLoading ? (
            <LoadingCard title="Loading OI Wall..." height={400} />
          ) : oiData ? (
            <ReactECharts option={oiWallOption} style={{ height: 400 }} />
          ) : (
            <div className="text-gray-400 text-center py-8">No data</div>
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Max Pain Curve</h3>
          {mpLoading ? (
            <LoadingCard title="Loading Max Pain..." height={300} />
          ) : mpData ? (
            <ReactECharts option={maxPainOption} style={{ height: 300 }} />
          ) : (
            <div className="text-gray-400 text-center py-8">No data</div>
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">GEX Distribution</h3>
          {gexLoading ? (
            <LoadingCard title="Loading GEX..." height={300} />
          ) : gexData ? (
            <ReactECharts option={gexDistOption} style={{ height: 300 }} />
          ) : (
            <div className="text-gray-400 text-center py-8">No data</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrikesModule;
