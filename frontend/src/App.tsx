import { useState } from 'react';
import { Tabs } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  SwapOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import TickerSelector from './components/TickerSelector';
import DashboardModule from './modules/dashboard';
import StrikesModule from './modules/strikes';
import ComparisonModule from './modules/comparison';
import HistoricalModule from './modules/historical';
import type { Ticker } from './types';
import { DEFAULT_TICKER } from './utils/constants';

const App: React.FC = () => {
  const [ticker, setTicker] = useState<Ticker>(DEFAULT_TICKER);
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <DashboardOutlined /> Dashboard
        </span>
      ),
      children: (
        <ErrorBoundary fallbackTitle="Dashboard module error">
          <DashboardModule ticker={ticker} />
        </ErrorBoundary>
      ),
    },
    {
      key: 'strikes',
      label: (
        <span>
          <BarChartOutlined /> Strike Analysis
        </span>
      ),
      children: (
        <ErrorBoundary fallbackTitle="Strike analysis module error">
          <StrikesModule ticker={ticker} />
        </ErrorBoundary>
      ),
    },
    {
      key: 'comparison',
      label: (
        <span>
          <SwapOutlined /> Comparison
        </span>
      ),
      children: (
        <ErrorBoundary fallbackTitle="Comparison module error">
          <ComparisonModule />
        </ErrorBoundary>
      ),
    },
    {
      key: 'historical',
      label: (
        <span>
          <LineChartOutlined /> Historical
        </span>
      ),
      children: (
        <ErrorBoundary fallbackTitle="Historical module error">
          <HistoricalModule ticker={ticker} />
        </ErrorBoundary>
      ),
    },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <TickerSelector value={ticker} onChange={setTicker} />
        <span className="text-gray-400 text-xs">
          Data delayed ~15 min via Yahoo Finance
        </span>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        className="optiondash-tabs"
      />
    </Layout>
  );
};

export default App;
