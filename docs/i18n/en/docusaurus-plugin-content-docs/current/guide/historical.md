---
sidebar_position: 4
title: 'Historical Trends'
---

# Historical Trends

The Historical Trends page uses time series charts to help you track the long-term changes of options metrics. It displays data from the last 90 days by default.

## Overview

The page contains the following four charts:

- **Max Pain vs Price** -- Compare the trend of spot price with Max Pain
- **PCR & GEX Trends** -- Track changes in sentiment indicators and gamma exposure
- **Volatility Study** -- Compare implied volatility, historical volatility, and volatility risk premium
- **25-Delta Skew** -- Track fear/greed sentiment in the options market

Data comes from snapshots taken at each trading day's close (4:30 PM ET), stored in the local database.

:::info Data Accumulation
The Historical Trends feature requires continuous data accumulation. The longer the system runs, the more data the charts contain, and the more meaningful the analysis results become. It is recommended to accumulate at least 30 days of data before performing trend analysis.
:::

---

## Max Pain vs Price

This is a **dual-line chart** that plots the spot price and Max Pain on the same chart, helping you observe the relationship between the two.

| Line | Color | Description |
|------|-------|-------------|
| Spot Price | Blue solid line | Daily closing price of the underlying asset |
| Max Pain | Orange dashed line | Daily calculated Max Pain strike price |

### How to Read

```text
Price
  |
  |   ____Spot Price
  |  /    \    ___
  | /      \__/   \___
  |  - - - - - - - - - -  Max Pain
  |
  +-------------------------> Date
```

- **Price tracks Max Pain closely** -- Indicates that option sellers (market makers) have effectively controlled the price movement through continuous hedging; the market is in an options-dominated state
- **Price diverges from Max Pain** -- Indicates that the market has directional momentum (driven by fundamentals or news); options hedging force is insufficient to pull the price back
- **Convergence near expiration** -- This is known as "Pin Risk" -- the price gets locked near Max Pain

---

## PCR & GEX Trends

This is a **dual Y-axis chart**, with PCR on the left Y-axis and GEX on the right Y-axis.

| Line/Bar | Description |
|----------|-------------|
| PCR (Volume) -- Solid line | Put/Call Ratio calculated based on daily volume |
| PCR (Open Interest) -- Dashed line | Put/Call Ratio calculated based on Open Interest |
| GEX Positive -- Green bars | Positive gamma exposure (stabilizes the market) |
| GEX Negative -- Red bars | Negative gamma exposure (amplifies volatility) |

### How to Read

Several typical combined patterns:

| PCR Trend | GEX Trend | Meaning |
|-----------|-----------|---------|
| Rising | Falling (or turning negative) | Increasing bearish sentiment + declining market stability -- **Risk Rising** |
| Falling | Rising (or turning positive) | Bearish sentiment fading + market stabilizing -- **Risk Declining** |
| Rising | Rising | Bearish sentiment increasing but market makers still stabilizing the market -- **Wait and See** |
| Falling | Falling | Sentiment improving but market stability weakening -- **Cautiously Optimistic** |

---

## Volatility Study

This is a **triple-line chart** that analyzes volatility levels from different perspectives.

| Line | Color | Description |
|------|-------|-------------|
| ATM IV (At-the-Money Implied Volatility) | Blue | The future expected volatility priced in by the options market |
| HV30 (30-Day Historical Volatility) | Gray dashed line | Actual volatility over the past 30 trading days |
| VRP (Volatility Risk Premium) | Orange (with gradient fill) | ATM IV minus HV30 |

### Core Concept

**Volatility Risk Premium (VRP)** is one of the most important concepts in options trading:

```
VRP = ATM IV - HV30
```

- **VRP > 0** (common case) -- Options implied volatility is higher than actual volatility, meaning options are overpriced. Sellers (short volatility) have a statistical edge.
- **VRP < 0** (rare) -- Options implied volatility is lower than actual volatility, meaning options are underpriced. Buyers (long volatility) have a statistical edge.

### How to Read

- **VRP persistently high (wide orange area)** -- Options "insurance premiums" are elevated, suitable for volatility selling strategies (such as short straddles, iron condors)
- **VRP narrowing or turning negative** -- Options are relatively cheap to buy, suitable for volatility buying strategies (such as long straddles, long strangles)
- **IV spikes suddenly but HV does not follow** -- Market panic without actual large moves yet, which may be an opportunity to sell volatility
- **HV exceeds IV** -- Actual market moves exceed expectations, and option sellers are losing money

---

## 25-Delta Skew

This is a **single-line chart** showing the trend of the 25-Delta Risk Reversal, reflecting the relative pricing of puts and calls in the options market.

**Formula:**

```
25-Delta Skew = IV(25-delta Put) - IV(25-delta Call)
```

| Zone | Color | Description |
|------|-------|-------------|
| Normal range | Default | Skew between -5% and +5% |
| `Extreme high (> 5%)` | Light red shading | Extreme demand for downside protection |
| `Extreme low (< -5%)` | Light green shading | Extreme bullish speculative demand |

### How to Read

| Skew Value | Meaning | Market Interpretation |
|------------|---------|----------------------|
| `Positive (Put IV > Call IV)` | Puts are more expensive than calls | The market is buying "insurance" against downside risk; there is safe-haven demand |
| `Negative (Call IV > Put IV)` | Calls are more expensive than puts | The market has strong bullish speculative sentiment |
| `> 5% (extremely high)` | Put premium is abnormal | Extreme market fear, potentially near a bottom (contrarian signal) |
| `< -5% (extremely low)` | Call premium is abnormal | Extreme market greed, potentially near a top (contrarian signal) |

:::warning Extreme Value Signals
When Skew enters the extreme zone (> 5% or < -5%), it often signals a potential trend reversal. This is because extreme sentiment is typically unsustainable.
:::

---

## Data Information

### Data Source

- Historical data comes from automatic snapshots taken by the system at each trading day's close (4:30 PM ET)
- Snapshots are executed automatically by the background scheduler, requiring no manual operation

### Data Accumulation Guidelines

| Days | Analysis Value |
|------|----------------|
| `< 7 days` | Too little data, trends are not apparent |
| 7 - 30 days | Can observe short-term trends |
| 30 - 90 days | Can perform meaningful trend analysis |
| `> 90 days` | Can perform comprehensive medium-term trend analysis |

:::tip Best Practices
The longer the system runs continuously, the richer the historical data. It is recommended to keep the system running persistently after deployment, avoiding frequent restarts that could cause data gaps.
:::
