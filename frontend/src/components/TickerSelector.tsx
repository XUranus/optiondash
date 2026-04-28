import React from 'react';
import { Select } from 'antd';
import type { Ticker } from '../types';

interface TickerSelectorProps {
  value: Ticker;
  onChange: (ticker: Ticker) => void;
  tickers: Ticker[];
  loading?: boolean;
  className?: string;
}

const TickerSelector: React.FC<TickerSelectorProps> = ({
  value,
  onChange,
  tickers,
  loading = false,
  className,
}) => {
  return (
    <Select
      value={value}
      onChange={(v) => onChange(v as Ticker)}
      className={className}
      style={{ width: 120 }}
      loading={loading}
      options={tickers.map((t) => ({ label: t, value: t }))}
    />
  );
};

export default TickerSelector;
