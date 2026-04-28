import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, Tag, Tooltip } from 'antd';
import { useTickerData } from '../../hooks/useTickerData';
import { fetchComparison } from '../../api/comparison';
import { fetchTickers } from '../../api/health';
import { FALLBACK_TICKERS, COLORS } from '../../utils/constants';
import type { ComparisonRow, Ticker } from '../../types';

const ComparisonModule: React.FC = () => {
  const [tickers, setTickers] = useState<Ticker[]>(FALLBACK_TICKERS);

  useEffect(() => {
    fetchTickers()
      .then((res) => setTickers(res.tickers))
      .catch(() => setTickers(FALLBACK_TICKERS));
  }, []);

  const fetchFn = useCallback(
    () => fetchComparison(tickers),
    [tickers],
  );
  const { data, loading, error } = useTickerData(fetchFn);

  const columns = useMemo(
    () => [
      {
        title: 'Ticker',
        dataIndex: 'ticker',
        key: 'ticker',
        fixed: 'left' as const,
        width: 80,
        render: (v: string) => <strong className="text-blue-600">{v}</strong>,
      },
      {
        title: 'Spot Price',
        dataIndex: 'spot_price',
        key: 'spot_price',
        width: 100,
        render: (_: number, row: ComparisonRow) => {
          if (row.error) return <span className="text-red-400">Error</span>;
          const pct = row.daily_change_pct;
          const color = pct >= 0 ? COLORS.green : COLORS.red;
          return (
            <span>
              <span style={{ color }}>
                ${row.spot_price?.toFixed(2)}
              </span>
              <span className="text-xs ml-1" style={{ color }}>
                ({pct >= 0 ? '+' : ''}{pct?.toFixed(2)}%)
              </span>
            </span>
          );
        },
      },
      {
        title: 'Max Pain',
        dataIndex: 'max_pain',
        key: 'max_pain',
        width: 100,
        render: (_: number, row: ComparisonRow) => {
          if (row.error) return '-';
          const dev = row.deviation_from_max_pain;
          const color = dev >= 0 ? COLORS.green : COLORS.red;
          return (
            <Tooltip title={`Deviation: ${dev >= 0 ? '+' : ''}${dev?.toFixed(2)}`}>
              <span style={{ color }}>${row.max_pain?.toFixed(2)}</span>
            </Tooltip>
          );
        },
      },
      {
        title: 'PCR (Vol/OI)',
        key: 'pcr',
        width: 130,
        render: (_: unknown, row: ComparisonRow) => {
          if (row.error) return '-';
          const signal = row.pcr?.signal;
          const signalColor =
            signal === 'bearish' ? 'red'
            : signal === 'bullish' ? 'green'
            : 'blue';
          return (
            <span>
              <Tag color={signalColor} className="text-xs">
                {signal}
              </Tag>
              <span className="text-xs text-gray-400">
                {row.pcr?.volume?.toFixed(2)} / {row.pcr?.oi?.toFixed(2)}
              </span>
            </span>
          );
        },
      },
      {
        title: 'Gamma Exposure',
        dataIndex: 'gex',
        key: 'gex',
        width: 160,
        render: (_: unknown, row: ComparisonRow) => {
          if (row.error) return '-';
          const regime = row.gex?.regime;
          const color = regime === 'negative_gamma' ? COLORS.red : COLORS.green;
          const label = regime === 'negative_gamma' ? 'Negative' : 'Positive';
          return (
            <span>
              <span style={{ color, fontWeight: 600 }}>
                {row.gex?.formatted}
              </span>
              <Tag color={color} className="text-xs ml-1">
                {label}
              </Tag>
            </span>
          );
        },
      },
      {
        title: 'Call OI / Put OI',
        key: 'oi',
        width: 140,
        render: (_: unknown, row: ComparisonRow) => {
          if (row.error) return '-';
          return (
            <span className="text-xs">
              <span className="text-green-600">
                {row.total_call_oi?.toLocaleString()}
              </span>
              {' / '}
              <span className="text-red-500">
                {row.total_put_oi?.toLocaleString()}
              </span>
            </span>
          );
        },
      },
      {
        title: 'Anomalies',
        key: 'anomalies',
        width: 200,
        render: (_: unknown, row: ComparisonRow) => {
          if (row.error) return <Tag color="red">Fetch Error</Tag>;
          if (!row.anomalies?.length)
            return <span className="text-gray-300 text-xs">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {row.anomalies.map((a, i) => (
                <Tooltip
                  key={i}
                  title={`${a.field}: ${a.type} ${a.change_pct ? `(${a.change_pct >= 0 ? '+' : ''}${a.change_pct}%)` : ''}`}
                >
                  <Tag
                    color={
                      a.type === 'spike' ? 'red'
                      : a.type === 'drop' ? 'orange'
                      : a.type === 'flip' ? 'purple'
                      : 'volcano'
                    }
                    className="text-xs"
                  >
                    {a.field} {a.type}
                  </Tag>
                </Tooltip>
              ))}
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div>
      {error && (
        <div className="text-red-500 p-4 bg-red-50 rounded mb-4">
          Failed to load comparison data: {error}
        </div>
      )}

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="ticker"
        loading={loading}
        pagination={false}
        scroll={{ x: 900 }}
        size="middle"
        className="shadow-sm"
        onRow={(record: ComparisonRow) => ({
          className: record.anomalies?.length
            ? 'bg-orange-50 hover:bg-orange-100'
            : '',
        })}
      />
    </div>
  );
};

export default ComparisonModule;
