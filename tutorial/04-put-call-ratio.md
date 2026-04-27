# 4. Put/Call Ratio (PCR)

## The Big Picture

The **Put/Call Ratio** compares the amount of put activity to call activity. When more puts are being traded or held than calls, the PCR is high — the market is positioned bearishly (expecting or hedging against a decline). When more calls dominate, the PCR is low — the market is positioned bullishly. PCR is one of the most widely watched sentiment indicators in options markets.

---

## Two Flavors: Volume PCR vs OI PCR

OptionDash calculates both and shows you both on the Dashboard:

### Volume PCR
```
PCR_Volume = Total Put Volume / Total Call Volume
```
Measures today's trading activity. High volume PCR means heavy put trading TODAY.

- **Strengths:** Responsive, captures intraday sentiment shifts
- **Weaknesses:** Noisy, influenced by day-traders and one-off large trades
- **Best for:** Short-term sentiment checks

### OI PCR
```
PCR_OI = Total Put Open Interest / Total Call Open Interest
```
Measures outstanding contracts (positions being held overnight).

- **Strengths:** Stable, reflects persistent positioning
- **Weaknesses:** Slow to change, lags sentiment shifts
- **Best for:** Medium-term positioning analysis

**In OptionDash:** The dashboard card shows OI PCR as the primary number, with volume PCR in the description. The composite signal (bullish/bearish/neutral) weights OI PCR at 60% and Volume PCR at 40%.

---

## Interpreting PCR Values

### For Equity Indices (SPY, QQQ)

Equity index options naturally have a put skew — puts tend to be more expensive and have higher OI than equidistant calls because institutional investors are structurally long stocks and buy puts as portfolio insurance. The "neutral" range reflects this.

| PCR (OI) | Signal | What It Means |
|----------|--------|---------------|
| < 0.7 | **Bullish** | Calls dominating. Positioning is aggressively long. May signal complacency at extremes. |
| 0.7 – 1.2 | **Neutral** | Balanced positioning. No strong directional signal from options flow. |
| > 1.2 | **Bearish** | Puts dominating. Heavy hedging or directional bearish bets. May signal panic at extremes. |

### For Bonds (TLT) and Other Assets

The "neutral" range varies by asset class. TLT options often have higher PCR because bond investors are conservative hedgers. XLF (financials) may have lower PCR. Use the default thresholds as a guide, but develop intuition for each ticker over time.

---

## The Contrarian Perspective

PCR is famous for being a **contrarian indicator** at extremes:

### Extreme Bearishness (Very High PCR)
When PCR spikes above 2.0, it often means:
- Everyone who wants to hedge has already bought puts
- The market is pricing in disaster
- There's no one left to sell to — selling pressure is exhausted
- **This often coincides with market bottoms**

Think about it: if every institutional investor has already bought put protection, who's left to sell in a panic? The positioning is already defensive. Any good news can trigger a rally as hedges are unwound.

### Extreme Bullishness (Very Low PCR)
When PCR drops below 0.5, it often means:
- Everyone is positioned for upside
- No one is buying protection
- There's no one left to buy — buying pressure is exhausted
- **This often coincides with market tops**

When everyone is already long calls and no one holds puts, who's left to buy? Any bad news can trigger a sell-off as call positions are liquidated.

### The "Wall of Worry" Pattern
A moderately elevated PCR (0.9–1.2) during a bull market is HEALTHY. It means there's skepticism — people are hedging. The market can continue rising as skeptics are gradually converted. It's when PCR gets too low (no one's worried) that you should be concerned.

---

## How OptionDash Displays PCR

### Dashboard Card
- **Main number:** OI PCR (e.g., 0.87)
- **Tag:** Green "Bullish", Red "Bearish", or Blue "Neutral"
- **Description:** Volume PCR value (e.g., "Vol PCR: 1.23")
- **Tooltip:** Explains the thresholds

Example: OI PCR 0.87 with signal "Neutral"
→ Positioning is slightly call-heavy but within normal range. No extreme signal.

### Comparison Table
- **PCR column:** Signal tag + both values
- **Anomalies:** If PCR > 2.0 or < 0.5, it appears as an "extreme" anomaly flagged in red

### Historical Chart (PCR & GEX Trends)
- **Purple line:** Volume PCR over time
- **Gray dashed line:** OI PCR over time
- Look for: divergences between volume and OI PCR, extreme spikes

---

## Reading PCR in Context

PCR alone is weak. PCR combined with other metrics is powerful:

### PCR + Price
| PCR | Price Action | Interpretation |
|-----|-------------|----------------|
| High + Falling | Market selling off + heavy put activity | Normal bearish environment. Not yet a bottom signal. |
| High + Stabilizing | Market finding support + heavy put activity | Potential bottom. Fear is priced in. |
| Low + Rising | Market rallying + light put activity | Normal bullish environment. Not yet a top signal. |
| Low + Stalling | Market struggling to make new highs + light put activity | Potential top. Complacency is priced in. |

### PCR + GEX
| PCR | GEX | Interpretation |
|-----|-----|----------------|
| High (bearish) | Negative (amplify vol) | Dangerous combination — bearish positioning + dealer short gamma = potential crash setup |
| High (bearish) | Positive (dampen vol) | Fear is present but dealer hedging will dampen moves. May be a false alarm. |
| Low (bullish) | Negative (amplify vol) | Complacency + unstable dealer positioning = potential sharp reversal |
| Low (bullish) | Positive (dampen vol) | Goldilocks — bullish positioning + stable dealer hedging. Trend continuation likely. |

### PCR + Skew
Both PCR and Skew measure fear, but differently:
- **PCR** measures what people are DOING (their positions)
- **Skew** measures what people are PAYING (the price of protection)

When PCR is high AND skew is high: unified fear signal. Market genuinely scared.
When PCR is high but skew is low: people are hedging but not paying up for it. Hedging is routine, not panicked.
When PCR is low but skew is high: people aren't hedging but protection is expensive. Smart money is nervous despite retail complacency. This is a powerful warning sign.

---

## Common Pitfalls

**"High PCR always means the market is going down."**
No. High PCR means positioning is bearish. But when everyone is already bearish, there may be no sellers left. High PCR at extremes is often bullish (contrarian).

**"Comparing PCR across different tickers directly."**
A PCR of 1.5 means different things for SPY (very high) vs a volatile single stock (might be normal). Use the thresholds as guidelines, not absolutes.

**"Reacting to single-day PCR spikes."**
Volume PCR especially can spike on a single large trade. Look for persistent shifts in OI PCR over several days for real positioning changes. The historical PCR chart helps with this.

**"Ignoring the PCR trend."**
The absolute level matters less than the direction. PCR rising from 0.6 to 0.9 is more informative than PCR sitting steady at 1.1. Trend changes signal sentiment shifts.

---

**Next:** [The Greeks](05-greeks.md) — Understanding delta, gamma, theta, and vega
