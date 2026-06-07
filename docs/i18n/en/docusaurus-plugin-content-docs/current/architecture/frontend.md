---
sidebar_position: 3
title: 'Frontend Architecture'
---

# Frontend Architecture

The OptionDash frontend is a single-page application (SPA) built on React 19, written in TypeScript, using Vite 8 as the build tool, Ant Design for UI components, ECharts for data chart rendering, and Tailwind CSS for styling.

---

## Application Structure

```mermaid
graph TB
    subgraph "Entry Point"
        MAIN["main.tsx<br/>ReactDOM.createRoot"]
        APP["App.tsx<br/>Router + Tabs"]
    end

    subgraph "Components (components/)"
        LAYOUT["Layout.tsx<br/>Page shell"]
        TICKSEL["TickerSelector.tsx<br/>Ticker selector"]
        EXPPICK["ExpirationPicker.tsx<br/>Expiration date picker"]
        METRIC["MetricCard.tsx<br/>KPI metric card"]
        LOADING["LoadingCard.tsx<br/>Skeleton placeholder"]
        ERRBOUND["ErrorBoundary.tsx<br/>Error boundary"]
    end

    subgraph "Modules (modules/)"
        DASH["dashboard/"]
        STRIKE["strikes/"]
        COMP["comparison/"]
        HIST["historical/"]
        MACRO["macro/"]
    end

    subgraph "API Layer (api/)"
        CLIENT["client.ts<br/>Axios instance"]
        API_H["health.ts"]
        API_D["dashboard.ts"]
        API_S["strikes.ts"]
        API_C["comparison.ts"]
        API_HI["historical.ts"]
        API_MA["macro.ts"]
    end

    subgraph "Hooks (hooks/)"
        UTD["useTickerData<br/>Data fetching + loading/error"]
        UAR["useAutoRefresh<br/>Polling"]
    end

    subgraph "Types and Utilities"
        TYPES["types/index.ts<br/>TypeScript interfaces"]
        CONST["utils/constants.ts<br/>Constants"]
    end

    MAIN --> APP
    APP --> LAYOUT
    APP --> TICKSEL
    APP --> ERRBOUND
    ERRBOUND --> DASH
    ERRBOUND --> STRIKE
    ERRBOUND --> COMP
    ERRBOUND --> HIST
    ERRBOUND --> MACRO

    DASH --> CLIENT
    STRIKE --> CLIENT
    COMP --> CLIENT
    HIST --> CLIENT
    MACRO --> CLIENT

    DASH --> UTD
    STRIKE --> UTD
    UTD --> UAR

    CLIENT --> API_H
    CLIENT --> API_D
    CLIENT --> API_S
    CLIENT --> API_C
    CLIENT --> API_HI
    CLIENT --> API_MA
```

---

## Routing System

The frontend uses `react-router-dom`'s `BrowserRouter` for client-side routing. Routes are linked with tabs:

```mermaid
graph LR
    ROOT["/"] -- "Redirect" --> DASH["/dashboard"]
    DASH --> STRIKE["/strikes"]
    STRIKE --> COMP["/comparison"]
    COMP --> HIST["/historical"]
    HIST --> MACRO["/macro"]
```

**Routing Design Key Points**:

- The URL path determines the currently active tab: `/dashboard`, `/strikes`, `/comparison`, `/historical`, `/macro`
- The URL query parameter `?ticker=SPY` saves the currently selected ticker
- Switching tabs updates the path while preserving the `ticker` parameter
- Switching tickers updates the `ticker` parameter while preserving the current path
- The root path `/` automatically redirects to `/dashboard`

```mermaid
sequenceDiagram
    participant U as User
    participant TAB as Tab Component
    participant SEL as TickerSelector
    participant URL as URL

    Note over U,URL: Initial state: /dashboard?ticker=SPY

    U->>TAB: Click "Strike Analysis" tab
    TAB->>URL: navigate("/strikes?ticker=SPY")
    Note over URL: Path updated, ticker preserved

    U->>SEL: Select "QQQ"
    SEL->>URL: navigate("/strikes?ticker=QQQ")
    Note over URL: Ticker updated, path preserved
```

---

## Data Fetching Pattern

Each business module follows a unified data fetching pattern implemented through custom hooks:

```mermaid
flowchart TD
    MOUNT["Module component mounts"] --> HOOK["useTickerData(fetchFn)"]
    HOOK --> FETCH["Call API function<br/>(e.g. fetchDashboardSummary)"]
    FETCH --> AXIOS["Axios client sends<br/>GET /api/...?ticker=SPY"]
    AXIOS --> PARSE["Parse JSON response"]
    PARSE --> STATE["Store in component state"]

    STATE --> RENDER["Component renders"]
    RENDER --> REFRESH["useAutoRefresh(refetch, 5min)"]
    REFRESH -- "Every 5 min" --> FETCH

    AXIOS -- "Network error" --> ERR["Set error state"]
    ERR --> ERRUI["Display error message"]
```

### Custom Hooks

#### useTickerData

A generic data fetching hook that encapsulates loading, error, and refetch state management:

```typescript
function useTickerData<T>(
  fetchFn: () => Promise<T>
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
```

- Automatically initiates a request when the component mounts
- Automatically re-fetches when `fetchFn` changes (via `useCallback` dependency)
- Provides a `refetch` method for manual refresh

#### useAutoRefresh

A polling hook based on `setInterval`:

```typescript
function useAutoRefresh(
  callback: () => void,
  interval: number,  // Default 5 minutes
  enabled?: boolean
): void
```

- Uses `useRef` to store the latest callback function reference
- Automatically clears the timer when the component unmounts
- Can be controlled via the `enabled` parameter

### Axios Client

Unified HTTP client configuration located in `api/client.ts`:

- Base URL: `API_BASE_URL` (in development, `/api` is forwarded via Vite proxy)
- Timeout: 30 seconds
- Response interceptor: Unified error handling, extracts error messages and logs them

---

## Component Hierarchy

```mermaid
graph TB
    APP["App.tsx"] --> BROWSER["BrowserRouter"]
    BROWSER --> ROUTES["Routes"]
    ROUTES --> APPCONTENT["AppContent"]

    APPCONTENT --> LAYOUT["Layout<br/>(Page shell)"]
    APPCONTENT --> TICKSEL["TickerSelector<br/>(Ticker selector)"]
    APPCONTENT --> TABS["Tabs<br/>(Ant Design tabs)"]

    TABS --> EB1["ErrorBoundary"]
    TABS --> EB2["ErrorBoundary"]
    TABS --> EB3["ErrorBoundary"]
    TABS --> EB4["ErrorBoundary"]
    TABS --> EB5["ErrorBoundary"]

    EB1 --> DASHMOD["DashboardModule"]
    EB2 --> STRIKEMOD["StrikesModule"]
    EB3 --> COMPMOD["ComparisonModule"]
    EB4 --> HISTMOD["HistoricalModule"]
    EB5 --> MACROMOD["MacroModule"]

    DASHMOD --> MC1["MetricCard"]
    DASHMOD --> LC1["LoadingCard"]
    DASHMOD --> CHART1["ECharts Chart"]

    STRIKEMODE --> CHART2["ECharts Chart"]
    STRIKEMOD --> EXPPICK["ExpirationPicker"]
```

### Core Component Descriptions

| Component | File | Responsibility |
|-----------|------|----------------|
| `Layout` | `components/Layout.tsx` | Page shell, provides a unified page layout container |
| `TickerSelector` | `components/TickerSelector.tsx` | Ticker selection dropdown, displays the list of supported tickers |
| `ExpirationPicker` | `components/ExpirationPicker.tsx` | Expiration date picker, used in the strike analysis module |
| `MetricCard` | `components/MetricCard.tsx` | Reusable KPI metric card, displays values, change rates, and color coding |
| `LoadingCard` | `components/LoadingCard.tsx` | Skeleton placeholder component, displayed while data is loading |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | React error boundary, catches child component render errors and displays a fallback UI |

---

## State Management

The OptionDash frontend uses a lightweight state management strategy without needing to introduce global state libraries like Redux or Zustand:

```mermaid
graph TB
    subgraph "URL State"
        PATH["URL path<br/>/dashboard, /strikes, ..."]
        PARAMS["Query parameters<br/>?ticker=SPY"]
    end

    subgraph "Component Local State"
        DATA["data: T | null<br/>API response data"]
        LOADING["loading: boolean<br/>Loading state"]
        ERROR["error: string | null<br/>Error message"]
        TICKERS["tickers: string[]<br/>Supported ticker list"]
    end

    subgraph "Derived State"
        ACTIVE["activeTab<br/>Derived from URL path"]
        TICKER["ticker<br/>Derived from URL params"]
    end

    PATH --> ACTIVE
    PARAMS --> TICKER
```

**State Management Principles**:

- **URL State**: The current tab and selected ticker are managed via URL, supporting browser back/forward navigation and bookmarks
- **Component Local State**: Each module independently manages its own data, loading, and error states
- **No Global State**: Modules have no shared state; they coordinate through URL parameters (e.g., `ticker`)
- **Custom Hooks**: `useTickerData` and `useAutoRefresh` encapsulate common data fetching logic

---

## TypeScript Type System

All API response types are defined in `types/index.ts` to ensure consistency between frontend and backend data structures:

```mermaid
classDiagram
    class DashboardSummary {
        +string ticker
        +number spot_price
        +number daily_change
        +number daily_change_pct
        +number max_pain
        +number deviation_from_max_pain
        +PCRData pcr
        +GEXData gex
        +number atm_iv
        +string expiration_used
        +string updated_at
    }

    class PCRData {
        +number volume
        +number oi
        +string signal
    }

    class GEXData {
        +number value
        +string formatted
        +string regime
    }

    class OIWallData {
        +string ticker
        +string expiration
        +number spot_price
        +number max_pain
        +number[] strikes
        +number[] call_oi
        +number[] put_oi
    }

    class ComparisonRow {
        +string ticker
        +number spot_price
        +number daily_change_pct
        +number max_pain
        +PCRData pcr
        +GEXData gex
        +AnomalyFlag[] anomalies
    }

    class MacroIndicator {
        +number vix
        +number tnx
        +number tyx
        +number irx
        +number dxy
        +number vvix
        +number spread_10y3m
    }

    DashboardSummary --> PCRData
    DashboardSummary --> GEXData
    ComparisonRow --> PCRData
    ComparisonRow --> GEXData
```
