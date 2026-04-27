import React from 'react';
import { Select } from 'antd';
import { SUPPORTED_TICKERS } from '../utils/constants';
import type { Ticker } from '../types';

interface TickerSelectorProps {
  value: Ticker;
  onChange: (ticker: Ticker) => void;
  className?: string;
}

const TickerSelector: React.FC<TickerSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <Select
      value={value}
      onChange={(v) => onChange(v as Ticker)}
      className={className}
      style={{ width: 120 }}
      options={SUPPORTED_TICKERS.map((t) => ({ label: t, value: t }))}
    />
  );
};

export default TickerSelector;
