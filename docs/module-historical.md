# Module: Historical Trends

The Historical module shows time-series charts of key metrics over a configurable lookback window (default 90 days). This is where you identify regime changes, divergences, and long-term patterns.

---

## Charts

### Max Pain vs Spot Price

**Chart type:** Dual line chart
- **Blue solid line:** Spot price
- **Orange dashed line:** Max Pain

**How to read it:**

This chart shows the relationship between price and Max Pain over time. Key patterns:

- **Convergence:** The two lines move toward each other as expiration approaches. This is the Max Pain magnet in action.
- **Persistent gap:** Spot consistently above Max Pain = bullish undercurrent. Consistently below = bearish undercurrent.
- **Crossovers:** Spot crossing above Max Pain can signal a bullish breakout. Crossing below signals weakness.
- **Max Pain as leading indicator:** Sometimes Max Pain shifts BEFORE price does, especially near expiration. A rising Max Pain suggests options flow expects higher prices. A falling Max Pain suggests the opposite.

**What to look for:**
- Is the gap widening or narrowing?
- Does Max Pain lead price or follow it?
- Are there regular convergences near expiration dates?

### PCR & GEX Trends

**Chart type:** Dual Y-axis (lines + bars)
- **Purple line (left axis):** PCR Volume
- **Gray dashed line (left axis):** PCR OI
- **Green/Red bars (right axis):** GEX in dollars

**How to read it:**

This is a sentiment-over-time view. Look for:

- **PCR rising + GEX falling:** Growing bearishness + dealer short gamma = potential sell-off ahead
- **PCR falling + GEX rising:** Growing bullishness + dealer long gamma = potential rally or calm
- **PCR-GEX divergence:** If PCR is rising (bearish sentiment) but GEX is also rising (dealers long gamma), the bearishness may be contained
- **Extreme PCR spikes:** When PCR spikes sharply over a short period, it often marks a local bottom (panic hedging)

**What to look for:**
- Do PCR and GEX move together or diverge?
- Are there extreme PCR spikes that coincide with price bottoms?
- Is GEX predominantly positive or negative in this lookback window?

### Volatility Study

**Chart type:** Triple line chart with area highlighting
- **Blue solid line:** ATM Implied Volatility (IV)
- **Gray dashed line:** 30-Day Historical Volatility (HV30)
- **Orange line with colored area:** Volatility Risk Premium (VRP)

**How to read it:**

**ATM IV vs HV30 relationship:**
- IV > HV30 (positive VRP, upper green area): Options are expensive relative to recent realized volatility. This is the normal state — options usually trade at a premium to realized vol. When VRP is very high, selling options (collecting premium) is attractive.
- IV < HV30 (negative VRP, lower red area): Options are cheap relative to recent realized volatility. This is unusual and can precede volatility events. The market is underpricing risk.
- IV = HV30 (VRP near zero): Neutral pricing.

**VRP trends:**
- Rising VRP: Options getting more expensive. Market pricing in more future uncertainty.
- Falling VRP: Options getting cheaper. Market complacency or realized vol catching up to implied.
- Negative VRP spike: Often a warning sign. The market is moving faster than options pricing suggests.

**What to look for:**
- Is VRP consistently positive or negative?
- Are there VRP regime changes that preceded past volatility events?
- Compare current VRP to its historical range — is it unusually high or low?

### 25-Delta Skew

**Chart type:** Line chart with extreme zone shading
- **Purple line:** 25-Delta Risk Reversal (IV of 25Δ Put minus IV of 25Δ Call)
- **Red shaded areas:** Extreme skew zones (±5%)

**How to read it:**

25-Delta Skew measures the difference in implied volatility between OTM puts and OTM calls at the 25-delta level. It's the purest measure of options market fear/greed.

- **Positive skew (puts more expensive):** The market is paying a premium for downside protection. This is the normal state for equity indices (crashophobia). Higher skew = more fear.
- **Negative skew (calls more expensive):** The market is paying a premium for upside exposure. Rare in indices, more common in commodities or meme stocks.
- **Skew near zero:** Perfectly balanced — neither fear nor greed dominating.

**What to look for:**
- **Trend direction:** Is skew rising (growing fear) or falling (growing confidence)?
- **Extreme values:** Very high positive skew often marks buying opportunities (maximum fear). Very low or negative skew can mark tops (maximum complacency).
- **Divergence with price:** Price making new highs but skew also rising = smart money hedging; potential top. Price making new lows but skew falling = fear subsiding; potential bottom.
- **Regime changes:** Skew that has been positive for months flipping negative is a significant regime change.

**Typical ranges for SPY:**
- Normal: +2% to +8%
- Elevated fear: +8% to +15%
- Extreme fear/panic: > +15%
- Complacency: 0% to +2%

---

## Data Availability Note

Historical data is accumulated over time via daily snapshots. On first run, you'll see a warning banner: "No historical data yet." Use `POST /api/historical/snapshot` to backfill data manually. The scheduler captures one snapshot per trading day at 16:30 ET.

## Related Services

- `services/volatility.py` — HV30, VRP, Skew calculations
- `services/max_pain.py` — Max Pain time series
- `services/pcr.py`, `services/gex.py` — PCR and GEX time series
- `scheduler/jobs.py` — Daily snapshot collection

## Implementation

The historical module (`frontend/src/modules/historical/index.tsx`) makes four parallel API calls and renders each as an ECharts instance. Dates on the X-axis come directly from the `daily_snapshots` table.
