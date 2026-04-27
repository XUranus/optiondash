import React, { useCallback, useMemo } from 'react';
import { useTickerData, useAutoRefresh } from '../../hooks/useTickerData';
import { fetchDashboardSummary, fetchExpirations } from '../../api/dashboard';
import MetricCard from '../../components/MetricCard';
import ExpirationPicker from '../../components/ExpirationPicker';
import LoadingCard from '../../components/LoadingCard';
import type { DashboardSummary } from '../../types';
import { PCR_BEARISH_THRESHOLD, PCR_BULLISH_THRESHOLD } from '../../utils/constants';

interface Props {
  ticker?: string;
}

const DashboardModule: React.FC<Props> = ({ ticker = 'SPY' }) => {
  const fetchFn = useCallback(
    () => fetchDashboardSummary(ticker),
    [ticker],
  );
  const { data, loading, error, refetch } = useTickerData<DashboardSummary>(fetchFn);

  const fetchExpsFn = useCallback(
    () => fetchExpirations(ticker),
    [ticker],
  );
  const { data: expData } = useTickerData(fetchExpsFn);

  useAutoRefresh(refetch);

  const pcrSignal = useMemo(() => {
    if (!data?.pcr) return null;
    const { volume, oi } = data.pcr;
    if (volume > PCR_BEARISH_THRESHOLD || oi > PCR_BEARISH_THRESHOLD) {
      return { label: 'Bearish', color: 'red' };
    }
    if (volume < PCR_BULLISH_THRESHOLD || oi < PCR_BULLISH_THRESHOLD) {
      return { label: 'Bullish', color: 'green' };
    }
    return { label: 'Neutral', color: 'blue' };
  }, [data]);

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded">
        Failed to load dashboard data: {error}
      </div>
    );
  }

  const spotTrend = data
    ? data.daily_change_pct >= 0
      ? 'up'
      : 'down'
    : undefined;

  const deviationUp = data && data.deviation_from_max_pain > 0;
  const gexRegime = data?.gex?.regime === 'negative_gamma' ? 'Negative Gamma' : 'Positive Gamma';
  const gexColor = data?.gex?.regime === 'negative_gamma' ? 'red' : 'green';

  return (
    <div>
      {expData && (
        <div className="mb-4">
          <ExpirationPicker
            expirations={expData.expirations}
            value={data?.expiration_used}
            onChange={() => {}}
            loading={loading}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <LoadingCard title="Spot Price" />
            <LoadingCard title="Max Pain" />
            <LoadingCard title="Put/Call Ratio" />
            <LoadingCard title="Gamma Exposure" />
          </>
        ) : data ? (
          <>
            <MetricCard
              title="Spot Price"
              value={data.spot_price}
              precision={2}
              prefix="$"
              trend={spotTrend}
              trendValue={`${data.daily_change_pct >= 0 ? '+' : ''}${data.daily_change_pct.toFixed(2)}%`}
              description={deviationUp
                ? `${data.deviation_from_max_pain.toFixed(2)} above Max Pain`
                : `${Math.abs(data.deviation_from_max_pain).toFixed(2)} below Max Pain`}
              tooltip="Current underlying price"
            />

            <MetricCard
              title="Max Pain"
              value={data.max_pain}
              precision={2}
              prefix="$"
              tag={{
                label: deviationUp ? '▲ Above' : '▼ Below',
                color: deviationUp ? 'green' : 'red',
              }}
              description={`Deviation: ${data.deviation_from_max_pain >= 0 ? '+' : ''}${data.deviation_from_max_pain.toFixed(2)}`}
              tooltip="Strike where option writers profit the most at expiration"
            />

            <MetricCard
              title="Put/Call Ratio"
              value={data.pcr.oi.toFixed(2)}
              suffix={
                <span className="text-sm text-gray-400">
                  {' '}OI
                </span>
              }
              tag={pcrSignal || undefined}
              description={`Vol PCR: ${data.pcr.volume.toFixed(2)}`}
              tooltip={`${data.pcr.signal}. PCR > 1.2 bearish, < 0.7 bullish.`}
            />

            <MetricCard
              title="Gamma Exposure"
              value={data.gex.formatted}
              tag={{ label: gexRegime, color: gexColor }}
              description={gexRegime === 'Negative Gamma'
                ? 'Dealers short gamma — volatility amplification'
                : 'Dealers long gamma — volatility dampening'}
              tooltip="Dealer Gamma Exposure. Positive dealers trade against trend (dampening). Negative dealers trade with trend (amplifying)."
            />
          </>
        ) : (
          <div className="col-span-4 text-center text-gray-400 py-8">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardModule;
