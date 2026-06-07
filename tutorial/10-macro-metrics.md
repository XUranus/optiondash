# 10. Macro-Economic Context for Options

## The Big Picture

Options don't trade in a vacuum. Interest rates determine the cost of capital and anchor all asset pricing. Volatility indices reflect the market's collective fear and uncertainty. Currency strength shapes capital flows. Understanding the macro backdrop is essential for interpreting options positioning — a bullish PCR signal means something very different in a low-VIX, steep-yield-curve environment than it does during a volatility event with an inverted curve.

---

## The Details

### VIX: The Fear Gauge

The CBOE Volatility Index (VIX) measures the market's expectation of 30-day forward volatility implied by S&P 500 index options. It's often called the "fear index" because it spikes during market selloffs and declines during calm bull markets.

Key characteristics:
- **Mean-reverting:** VIX typically reverts to the 15–20 range, but can stay elevated for weeks during crises
- **Asymmetric:** VIX spikes are sharp and fast; declines are gradual
- **Inverse to equities:** VIX and the S&P 500 are strongly negatively correlated, but not perfectly
- **Term structure matters:** When near-term VIX futures trade above longer-dated ones (backwardation), it signals near-term stress

**VIX regime cheat sheet:**

| VIX | Regime | What to do |
|-----|--------|------------|
| < 12 | Ultra-low | Be cautious — complacency precedes volatility events |
| 12–15 | Low | Favorable for premium selling |
| 15–20 | Normal | Neutral — focus on other metrics |
| 20–25 | Elevated | Consider hedging, reduce short premium |
| 25–30 | High | Active hedging warranted |
| 30–40 | Very High | Crisis mode — capital preservation priority |
| > 40 | Extreme | Historic dislocation — opportunity and danger |

### Treasury Yields: The Risk-Free Rate

Treasury yields are the foundation of all asset pricing. The risk-free rate appears in every options pricing model (it's the `r` in Black-Scholes), and changes in yields affect equity valuations through the discount rate mechanism.

- **10-Year Note (^TNX):** The benchmark. Most widely watched, reflects medium-term growth and inflation expectations
- **30-Year Bond (^TYX):** Long end. More sensitive to long-term inflation expectations and fiscal policy
- **13-Week T-Bill (^IRX):** Short end. Tracks Fed policy rate expectations most closely

When yields rise:
- Growth stocks (long-duration assets) underperform value
- Equity valuations compress (P/E multiples contract)
- Options premium becomes slightly more expensive (higher `r` increases call prices slightly)
- The dollar tends to strengthen

### Yield Curve Spread: Recession Watch

The 10Y-3M spread is one of the most reliable leading indicators of recession. It measures the difference between what the market demands to lend to the government for 10 years vs. 3 months.

- **Normal curve (positive spread):** Long-term yields exceed short-term. Banks borrow short, lend long — a healthy lending environment
- **Flat curve (near zero):** The market sees equal risk/reward at all durations — transition zone
- **Inverted curve (negative spread):** Short-term yields exceed long-term. The market expects rate cuts (recession response). Banks' lending model breaks down

The spread has inverted before every US recession since 1950, typically 12–18 months in advance. The spread often un-inverts (steepens) just before the recession officially begins, as the market prices in aggressive Fed rate cuts.

### DXY: Dollar Strength

The US Dollar Index (DXY) measures the dollar against a basket of six major currencies (EUR, JPY, GBP, CAD, SEK, CHF). The dollar is the world's reserve currency, and its strength has cascading effects:

- **Strong dollar (>105):** Headwind for commodities (priced in USD), emerging markets (USD-denominated debt), and US multinational earnings (FX translation)
- **Weak dollar (<95):** Tailwind for commodities, EM, and US exporters
- **Dollar as safe haven:** During global crises, capital floods into USD, causing rapid appreciation — this can create a feedback loop of tightening global financial conditions

### VVIX: Volatility of Volatility

VVIX is the VIX of VIX — it measures the implied volatility of VIX options. In other words, it's the market's expectation of how much VIX itself will move.

- **VVIX > 120:** Extreme uncertainty about volatility itself. Often marks VIX peaks or major turning points
- **VVIX 90–120:** Normal range. VIX behaving predictably
- **VVIX < 80:** Very low volatility-of-volatility. Can precede volatility regime changes

VVIX spikes often coincide with VIX spikes, but VVIX can also spike independently — for example, ahead of a known binary event (election, FOMC) when the direction is unclear but the magnitude of the potential move is expected to be large.

---

## The Math

**Yield Curve Spread:**
```
Spread_10Y-3M = TNX - IRX
```
Both are already in percentage points (e.g., 4.58 - 4.31 = 0.27% spread).

**VIX:** Calculated by CBOE from the prices of a wide range of SPX options using a model-free variance swap methodology. The formula weights OTM puts and calls across all available strikes to derive the market's 30-day expected variance.

---

## How OptionDash Calculates It

OptionDash fetches raw indicator values from Yahoo Finance via yfinance:

1. Each macro indicator is a standalone Yahoo Finance ticker (^VIX, ^TNX, ^TYX, ^IRX, DX-Y.NYB, ^VVIX)
2. Current values come from `fast_info.last_price` — the most recent trade price
3. Historical time series come from `Ticker.history(period)` — daily OHLCV data
4. The 10Y-3M spread is computed server-side as `TNX - IRX`
5. All fetches go through the same rate limiter (2 req/sec) and TTL cache (5 min) as options data
6. Values are not adjusted or transformed — they're displayed as-is from the data source

---

## Real-World Interpretation

### Scenario 1: Risk-On Environment
- VIX 12–15 (low, stable)
- Yields rising gradually (growth expectations)
- Yield curve steep (normal)
- DXY stable or weakening
- **Implication:** Favorable for equities. Long premium strategies (buying calls) more attractive. Watch for VIX mean-reversion higher.

### Scenario 2: Risk-Off / Flight to Safety
- VIX > 25 (elevated, rising)
- Yields falling sharply (flight to bonds)
- Yield curve flattening or inverting
- DXY surging (safe-haven flows)
- **Implication:** Defensive positioning. Hedging costs are high. The macro environment confirms any bearish options signals.

### Scenario 3: Stagflation Fears
- VIX 20–30 (elevated)
- Yields rising (inflation fears)
- Yield curve flattening (Fed hiking into slowdown)
- DXY strong
- **Implication:** The worst of both worlds — rising rates pressure valuations while growth fears drive volatility. Gold and commodities outperforming.

### Scenario 4: Fed Pivot / Dovish Turn
- VIX 15–20 (declining from elevated levels)
- Yields falling (pricing in rate cuts)
- Spread widening (curve steepening)
- DXY weakening
- **Implication:** Historically very bullish for risk assets. The "Fed put" is back. Options market may lag in pricing this regime change.

---

## Cross-Metric Analysis: Macro + Options

Combining macro indicators with the options metrics from earlier chapters:

| Options Signal | Macro Context | Interpretation |
|---------------|---------------|----------------|
| PCR bullish (< 0.7) | VIX low, curve steep | Genuine bullish positioning — go with it |
| PCR bullish (< 0.7) | VIX elevated, curve inverted | Complacency in options — caution warranted |
| GEX negative | VIX spiking, DXY surging | Amplified selling — stay defensive |
| GEX positive | VIX declining, DXY stable | Dampening in effect — range-bound likely |
| Max Pain far above spot | Yields falling, DXY rising | Bearish macro confirms the gap — don't fade it |
| Skew elevated | VIX low | Options market pricing tail risk equities aren't — pay attention |

---

## Common Pitfalls

1. **"VIX is low, everything is fine."** Low VIX can persist for months, but it doesn't predict the timing of the next spike. Low VIX means cheap hedges — it doesn't mean you don't need them.

2. **"The yield curve is inverted, a recession is imminent."** The curve has inverted 12–24 months before recessions historically. The inversion itself doesn't time the recession. Watch for the curve to re-steepen — that's often when the recession actually begins.

3. **"DXY is just a forex thing — doesn't matter for US equities."** Dollar strength affects ~40% of S&P 500 revenues through FX translation. It also tightens global financial conditions, which feeds back into US markets.

4. **"VVIX is just noise."** Extreme VVIX readings have a strong track record of coinciding with VIX peaks. When VVIX spikes above 120 while VIX is already elevated, it often signals the volatility regime is about to change.

5. **"Macro data is slow-moving — I only need to check it weekly."** While yields and the dollar don't tick like stock prices, macro regime changes can happen over days, not weeks. A 50bp yield move in a day is significant. Daily monitoring catches the trend change early.

---

**Next:** You've completed the OptionDash Metrics Guidebook. Return to the [README](README.md) for a recap of all topics, or jump to [Putting It All Together](09-putting-it-together.md) for the integrated daily workflow.
