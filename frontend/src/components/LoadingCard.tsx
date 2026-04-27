import React from 'react';
import { Card, Skeleton } from 'antd';

interface LoadingCardProps {
  title?: string;
  height?: number;
}

const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Loading...',
  height = 200,
}) => {
  return (
    <Card className="shadow-sm" title={title}>
      <Skeleton active paragraph={{ rows: Math.floor(height / 30) }} />
    </Card>
  );
};

export default LoadingCard;
