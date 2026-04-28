import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, Spin } from 'antd';
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
import { fetchTickers } from './api/health';
import type { Ticker } from './types';
import { DEFAULT_TICKER, FALLBACK_TICKERS } from './utils/constants';

// ---- Route path to tab key mapping ----
const ROUTE_TABS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/strikes': 'strikes',
  '/comparison': 'comparison',
  '/historical': 'historical',
};

const TAB_ROUTES: Record<string, string> = {
  dashboard: '/dashboard',
  strikes: '/strikes',
  comparison: '/comparison',
  historical: '/historical',
};

// ---- Inner app component with router access ----
const AppContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [tickers, setTickers] = useState<Ticker[]>(FALLBACK_TICKERS);
  const [tickersLoading, setTickersLoading] = useState(true);

  // Determine ticker from URL query param, fallback to default
  const tickerParam = searchParams.get('ticker');
  const ticker: Ticker = tickerParam && tickers.includes(tickerParam.toUpperCase())
    ? tickerParam.toUpperCase()
    : (tickers[0] || DEFAULT_TICKER);

  // Determine active tab from current path
  const activeTab = ROUTE_TABS[location.pathname] || 'dashboard';

  // Fetch supported tickers from backend
  useEffect(() => {
    fetchTickers()
      .then((res) => {
        setTickers(res.tickers);
      })
      .catch(() => {
        // Use fallbacks if API unavailable
        setTickers(FALLBACK_TICKERS);
      })
      .finally(() => setTickersLoading(false));
  }, []);

  // Navigate when ticker changes
  const handleTickerChange = useCallback(
    (newTicker: Ticker) => {
      const params = new URLSearchParams(searchParams);
      params.set('ticker', newTicker);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    },
    [navigate, location.pathname, searchParams],
  );

  // Navigate when tab changes
  const handleTabChange = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams);
      navigate(`${TAB_ROUTES[key]}?${params.toString()}`, { replace: true });
    },
    [navigate, searchParams],
  );

  const tabItems = [
    {
      key: 'dashboard',
      label: <span><DashboardOutlined /> Dashboard</span>,
      children: (
        <ErrorBoundary fallbackTitle="Dashboard module error">
          <DashboardModule ticker={ticker} />
        </ErrorBoundary>
      ),
    },
    {
      key: 'strikes',
      label: <span><BarChartOutlined /> Strike Analysis</span>,
      children: (
        <ErrorBoundary fallbackTitle="Strike analysis module error">
          <StrikesModule ticker={ticker} />
        </ErrorBoundary>
      ),
    },
    {
      key: 'comparison',
      label: <span><SwapOutlined /> Comparison</span>,
      children: (
        <ErrorBoundary fallbackTitle="Comparison module error">
          <ComparisonModule />
        </ErrorBoundary>
      ),
    },
    {
      key: 'historical',
      label: <span><LineChartOutlined /> Historical</span>,
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
        <div className="flex items-center gap-3">
          <TickerSelector
            value={ticker}
            onChange={handleTickerChange}
            tickers={tickers}
            loading={tickersLoading}
          />
        </div>
        <span className="text-gray-400 text-xs">
          Data delayed ~15 min via Yahoo Finance
        </span>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        size="large"
        className="optiondash-tabs"
      />
    </Layout>
  );
};

// ---- Root App with Router ----
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<AppContent />} />
        <Route path="/strikes" element={<AppContent />} />
        <Route path="/comparison" element={<AppContent />} />
        <Route path="/historical" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
