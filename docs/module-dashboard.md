# Module: Dashboard

The Dashboard is the landing page of OptionDash. It displays four key metrics for a selected ticker, giving you an at-a-glance view of market positioning and sentiment.

---

## Components

### Spot Price Card

**What it shows:**
- Current underlying price of the ticker
- Daily change in dollars and percent (green up, red down)
- Deviation from Max Pain

**How to read it:**
The spot price relative to Max Pain is a directional hint. If spot is above Max Pain, thereᵭs upward pressure. If below, thereᵭs downward pressure. The magnitude tells you how strong the magnet effect might be as expiration approaches.

### Max Pain Card

**What it shows:**
- The Max Pain strike price
- Whether spot is above or below Max Pain
- Deviation amount (dollars)

**How to read it:**
Max Pain is the strike price where option writers (market makers) profit the most at expiration. Price tends to gravitate toward Max Pain as expiration nears — this is called the "Max Pain magnet effect." A large deviation suggests either strong trending momentum or an imminent mean reversion toward Max Pain.

**Summary indicator:** The card tags the spot as "▲ Above" or "▼ Below" Max Pain. A persistent large gap is worth watching.

### Put/Call Ratio Card

**What it shows:**
- OI-based PCR (primary display)
- Volume-based PCR (secondary in description)
- Colored signal tag: Bullish (green), Bearish (red), or Neutral (blue)

**How to read it:**
- **PCR > 1.2 (Bearish):** More puts being opened/held than calls. The market is hedging for a downturn. Contrarians might see this as overly pessimistic.
- **PCR < 0.7 (Bullish):** More calls being opened/held than puts. The market is positioned for upside. Contrarians might see excessive optimism.
- **Neutral (0.7–1.2):** Balanced positioning.

OI-based PCR is weighted more heavily (60%) than volume-based PCR (40%) in the composite signal. OI reflects persistent positioning; volume reflects day-trading flows.

### Gamma Exposure Card

**What it shows:**
- Total dealer Gamma Exposure in dollars
- Regime tag: "Positive Gamma" (green) or "Negative Gamma" (red)
- Text explanation of the current regime's effect on volatility

**How to read it:**

| GEX > 0 (Positive Gamma) | GEX < 0 (Negative Gamma) |
|--------------------------|--------------------------|
| Dealers are **long** gamma | Dealers are **short** gamma |
| They buy low, sell high to hedge | They buy high, sell low to hedge |
| **Dampens** volatility | **Amplifies** volatility |
| Expect range-bound trading | Expect larger swings |
| Support/resistance more reliable | Support/resistance may break |

Large absolute GEX values (billions of dollars) mean stronger effects. The regime can flip intraday as dealers adjust hedges.

---

## Interaction

- Use the **Ticker Selector** (top-left) to switch between SPY, QQQ, IWM, TLT, XLF
- Use the **Expiration Picker** to change which option expiration cycle you're analyzing
- Cards auto-refresh every 5 minutes during market hours
- Hover over any card for a tooltip with more detail

## Implementation Notes

The dashboard module (`frontend/src/modules/dashboard/index.tsx`) fetches data from `GET /api/dashboard/summary` and uses the `MetricCard` component to render each KPI. Data is fetched via the `useTickerData` hook which handles loading, error, and refetch states.
