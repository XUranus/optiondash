import React from 'react';
import { Card, Statistic, Tag, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface MetricCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  precision?: number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  tag?: { label: string; color: string };
  tooltip?: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  precision,
  description,
  trend,
  trendValue,
  tag,
  tooltip,
  loading = false,
}) => {
  const trendColor =
    trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280';
  const TrendIcon =
    trend === 'up'
      ? ArrowUpOutlined
      : trend === 'down'
        ? ArrowDownOutlined
        : undefined;

  const cardContent = (
    <Card
      className="h-full shadow-sm hover:shadow-md transition-shadow"
      loading={loading}
      size="small"
    >
      <Statistic
        title={
          <span className="text-gray-500 text-sm font-medium">{title}</span>
        }
        value={value}
        prefix={prefix}
        suffix={suffix}
        precision={precision}
        valueStyle={{ color: trendColor, fontSize: '1.5rem', fontWeight: 600 }}
      />
      <div className="mt-2 flex items-center gap-2">
        {TrendIcon && trendValue && (
          <span style={{ color: trendColor }} className="text-sm">
            <TrendIcon /> {trendValue}
          </span>
        )}
        {tag && (
          <Tag color={tag.color} className="text-xs">
            {tag.label}
          </Tag>
        )}
      </div>
      {description && (
        <p className="text-gray-400 text-xs mt-1">{description}</p>
      )}
    </Card>
  );

  if (tooltip) {
    return <Tooltip title={tooltip}>{cardContent}</Tooltip>;
  }

  return cardContent;
};

export default MetricCard;
