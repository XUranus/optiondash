import React from 'react';
import { Select } from 'antd';

interface ExpirationPickerProps {
  expirations: string[];
  value?: string;
  onChange: (expiration: string) => void;
  loading?: boolean;
  className?: string;
}

const ExpirationPicker: React.FC<ExpirationPickerProps> = ({
  expirations,
  value,
  onChange,
  loading = false,
  className,
}) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      className={className}
      style={{ width: 180 }}
      loading={loading}
      placeholder="Select expiration"
      options={expirations.map((exp) => ({
        label: exp,
        value: exp,
      }))}
    />
  );
};

export default ExpirationPicker;
