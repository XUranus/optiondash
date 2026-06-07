---
sidebar_position: 3
title: 'Frontend Development'
---

# Frontend Development

This guide is for developers who need to modify or extend the OptionDash frontend.

## Project Structure

```
frontend/src/
├── main.tsx            # React application entry point
├── App.tsx             # Main application component (routing + tab navigation)
├── index.css           # Global styles
├── api/                # API call layer
│   ├── client.ts       #   Axios instance and interceptors
│   ├── dashboard.ts    #   Dashboard API
│   ├── strikes.ts      #   Strikes API
│   ├── comparison.ts   #   Comparison API
│   ├── historical.ts   #   Historical data API
│   ├── macro.ts        #   Macro indicators API
│   └── health.ts       #   Health check API
├── components/         # Reusable UI components
│   ├── Layout.tsx      #   Page layout
│   ├── MetricCard.tsx  #   Metric card
│   ├── TickerSelector.tsx  # Ticker selector
│   ├── ExpirationPicker.tsx # Expiration date picker
│   ├── LoadingCard.tsx #   Loading skeleton screen
│   └── ErrorBoundary.tsx  # Error boundary
├── modules/            # Feature modules (organized by business domain)
│   ├── dashboard/      #   Dashboard module
│   ├── strikes/        #   Strike analysis module
│   ├── comparison/     #   Multi-ticker comparison module
│   ├── historical/     #   Historical data module
│   └── macro/          #   Macro indicators module
├── hooks/              # Custom React Hooks
│   ├── useTickerData.ts    # Ticker data fetching
│   └── useAutoRefresh.ts   # Auto-refresh
├── types/              # TypeScript type definitions
│   └── index.ts        #   All backend response types
└── utils/              # Utility functions
    ├── format.ts       #   Number formatting
    └── constants.ts    #   Constant definitions
```

## Adding a New Feature Module

Using the addition of a "Volatility Surface" module as an example:

### Step 1: Create the Module Directory

```
frontend/src/modules/vol-surface/
├── index.tsx           # Module main component
├── VolSurfaceChart.tsx # Volatility surface chart
├── useVolSurface.ts    # Module-specific Hook
└── styles.module.css   # Module styles (optional)
```

### Step 2: Create an API Function

```typescript
// api/volSurface.ts
import client from './client';

export interface VolSurfacePoint {
  strike: number;
  expiry: string;
  iv: number;
}

export async function fetchVolSurface(ticker: string): Promise<VolSurfacePoint[]> {
  const { data } = await client.get(`/api/vol-surface/${ticker}`);
  return data.data;
}
```

### Step 3: Add TypeScript Types

Add the backend response type definitions in `types/index.ts`, keeping them exactly matching the backend API fields.

### Step 4: Add Routing

Import the new module in `App.tsx` and add it to the tab list:

```tsx
import VolSurface from '@site/src/modules/vol-surface';

// Add to the tabs array
{ key: 'vol-surface', label: 'Volatility Surface', children: <VolSurface ticker={ticker} /> }
```

### Step 5: Wrap with Error Boundary

Ensure the new module is wrapped with `ErrorBoundary` to prevent internal module errors from crashing the entire page. `App.tsx` already has a top-level `ErrorBoundary`; for more granular control, you can add additional ones inside the module.

## Adding a New Chart

The project uses [ECharts](https://echarts.apache.org/) as the charting library, along with the `echarts-for-react` component.

### Step 1: Install Dependencies

```bash
cd frontend && npm install echarts echarts-for-react
```

### Step 2: Create a Chart Component

```tsx
import ReactECharts from 'echarts-for-react';

function MyChart({ data }: { data: number[] }) {
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['A', 'B', 'C', 'D', 'E'] },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data, smooth: true }],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 400, width: '100%' }}
      notMerge={true}
    />
  );
}
```

### Step 3: Responsive Sizing

ECharts supports responsive sizing by default, but it is recommended to control dimensions through CSS containers rather than hardcoding pixel values. Use `style={{ height: '100%', width: '100%' }}` along with a parent container's `min-height`.

### Step 4: Handle Loading and Error States

Use the `LoadingCard` component to display loading states, and show error messages with a retry button when data requests fail.

## Style Guide

### CSS Priority

1. **Tailwind CSS utility classes** -- For spacing, typography, layout, and other quick styles
2. **Ant Design components** -- For forms, selectors, tables, and other standard UI elements
3. **`css/custom.css` global styles** -- For global theme variables, animations, etc.
4. **CSS Modules** -- For component-private styles (`styles.module.css`)

### Theme Variables

The project defines a set of financial blue theme variables in `custom.css`. These variables should be used as the primary choice during development:

| Variable | Purpose |
|----------|---------|
| `var(--ifm-color-primary)` | Primary color |
| `var(--od-green)` | Bullish / positive |
| `var(--od-red)` | Bearish / negative |
| `var(--od-yellow)` | Warning |
| `var(--od-surface)` | Page background |
| `var(--od-surface-raised)` | Card / overlay background |
| `var(--od-border)` | Border color |

### Dark Mode

All styles must be compatible with both light and dark modes. Use the `[data-theme='dark']` selector to override styles for the dark theme.

## Code Standards

- Use functional components with Hooks; do not use class components
- Declare Props interfaces with `interface` and place them before the component definition
- Use `React.memo` to optimize frequently rendered list item components
- Avoid creating new objects or arrays inside render functions (this causes unnecessary re-renders)
- Run `npx tsc --noEmit` before committing to ensure type checks pass
