# 6. Gamma Exposure (GEX)

## The Big Picture

**Gamma Exposure (GEX)** measures the total dollar gamma position of options dealers, aggregated across all strikes and expirations. It tells you whether dealer hedging activity is likely to dampen or amplify market moves — and by how much. GEX is arguably the most important "new" options metric, popularized by analysts like SpotGamma and SqueezeMetrics.

---

## The Intuition

Recall from the Greeks chapter:
- Dealers are typically **short options** (they sell to buyers)
- Short options = **short gamma**
- Short gamma dealers hedge by **buying on the way up and selling on the way down** → they amplify volatility

But dealers aren't uniformly short gamma at all strikes. At some strikes, they might be net long gamma (having bought options from other dealers). The net gamma position across all strikes determines the aggregate effect.

**GEX quantifies this net effect in dollars.** A GEX of -$1B means dealers are net short $1 billion worth of gamma exposure per 1% move. A GEX of +$500M means they're net long $500M worth.

---

## The Calculation

OptionDash calculates GEX from the **dealer's perspective:**

```
For each option contract:
  Contract GEX = OI × Gamma × 100 × Spot Price

Total Dealer GEX = -(Sum of Call GEX) + (Sum of Put GEX)
```

Why the minus sign for calls and plus for puts?

- **Dealers are short calls:** Negative sign reverses the call gamma (which is positive for the option holder) to reflect that dealers are on the other side. Call gamma is positive for the buyer → dealer has negative call gamma exposure.
- **Dealers are short puts:** Same logic, but put gamma reverses differently. Put gamma is positive for the buyer → dealer has negative put gamma exposure. The minus sign account for the natural negative sign of put, and we put another negative in front.

Wait, let's walk through this more carefully:

A call buyer has positive gamma (delta increases as stock rises). The dealer who sold the call has negative gamma (their delta decreases as stock rises). So from dealer perspective:
```
Dealer GEX_call = -OI × Gamma_call × 100 × Spot
```

A put buyer has positive gamma. The dealer who sold the put has negative gamma. But mathematically, put gamma itself is... actually, the gamma for both calls and puts is the same at the same strike for Black-Scholes. The dealer has negative gamma regardless. So:
```
Dealer GEX_put = -OI × Gamma_put × 100 × Spot  (negative for dealer)
```

OptionDash's implementation actually uses:
```
Dealer GEX = -Σ(Call_OI × Call_Gamma) + Σ(Put_OI × Put_Gamma)
```
...multiplied by 100 × Spot. This treats call and put contributions differently, following a convention where put OI contributes positively to dealer gamma (because put holders who are long puts must also hedge — but since dealers are short puts, the sign gets confusing).

The key output:
- **Positive GEX:** Dealers are net long gamma → counter-cyclical hedging → volatility dampening
- **Negative GEX:** Dealers are net short gamma → pro-cyclical hedging → volatility amplification

---

## Interpreting GEX Values

### The Regime

| GEX Sign | Regime | Market Behavior |
|----------|--------|-----------------|
| **Positive** | Long Gamma | Dealers sell rallies, buy dips. Range-bound, mean-reverting. Support/resistance levels hold well. |
| **Negative** | Short Gamma | Dealers buy rallies, sell dips. Trending, volatile. Support/resistance break easily. |

### The Magnitude

The absolute size of GEX tells you the STRENGTH of the effect:

| GEX Magnitude | Effect Strength |
|---------------|-----------------|
| < $100M | Weak. Normal market flows dominate. |
| $100M – $1B | Moderate. Dealers have meaningful influence. |
| $1B – $5B | Strong. Dealer hedging is a major component of daily volume. Expect regime effects to be visible. |
| > $5B | Extreme. Dealer flows may dominate. Large players are positioned. Treat support/resistance levels as significant. |

These thresholds vary by ticker. For SPY (daily volume ~$30B+), GEX of $1B is meaningful but not dominant. For IWM (daily volume ~$5B), $500M of GEX is very significant.

### GEX Near Zero

When GEX is near zero (say ±$200M), there's no clear dealer gamma regime. The market is less constrained by hedging flows and more subject to fundamental drivers. This is neutral — neither a warning nor an all-clear.

---

## Reading GEX in OptionDash

### Dashboard Card
- **Formatted value:** "-$1.01B" — the total GEX
- **Regime tag:** Green "Positive Gamma" or Red "Negative Gamma"
- **Description:** Plain-English explanation of the current regime's effect

### GEX Distribution Chart (Strike Analysis)
- Green bars (positive GEX at that strike): Volatility dampening zone — price may stall here
- Red bars (negative GEX at that strike): Volatility amplification zone — price may move through quickly
- The zero-gamma line shows where dealer gamma flips from positive to negative
- Spot location relative to zero-gamma line is critical

### Historical PCR-GEX Chart
- GEX bars over time (green/red)
- Changes in GEX regime (green → red flips especially important)
- Anomaly detection flags GEX flips

### Comparison Table
- GEX column with value and regime tag
- Compare: which ticker has the most extreme GEX?

---

## GEX in Context: Real-World Scenarios

### Scenario 1: Large Negative GEX + Quiet Market
SPY is drifting sideways. GEX is -$2B (strongly negative gamma). This is a coiled spring — dealer hedging isn't being triggered because price isn't moving enough to force rebalancing. If a catalyst pushes price enough to trigger dealer hedging, the hedging itself will amplify the move. **Expect large moves once price breaks the range.**

### Scenario 2: Large Positive GEX + Trending Market
QQQ is in a strong uptrend. GEX is +$1.5B (strongly positive gamma). The trend may struggle — dealer selling into rallies will cap the upside. Support on dips holds because dealers buy into weakness. **Expect the trend to lose momentum and chop.**

### Scenario 3: GEX Flip from Positive to Negative
SPY GEX was +$800M yesterday, today it's -$600M. Dealers have flipped from long to short gamma. This means the stabilizing force is gone and a destabilizing force has taken over. **Expect larger intraday ranges and faster moves.** This is a regime change worth noting.

### Scenario 4: GEX Concentrated at One Strike
In the GEX Distribution chart, you see a massive red bar at $500 (large negative GEX) and small bars everywhere else. If price approaches $500, dealer hedging will intensify sharply at that level, potentially causing a violent move through or rejection at that level. **Treat concentrated GEX zones as potential inflection points.**

---

## GEX vs Other Metrics

### GEX vs Max Pain
- Max Pain is about WHERE dealers profit most at expiration
- GEX is about HOW dealers hedge intraday
- Both are derived from dealer positioning but answer different questions
- GEX can be negative even if price is near Max Pain (dealer hedging can be destabilizing even if the expiration target is clear)

### GEX vs OI Walls
- OI walls show WHERE positions are concentrated
- GEX shows the DEALER GAMMA effect of those positions
- Same data, different lens. OI walls are static; GEX is dynamic (gamma changes with time and price)

### GEX vs PCR
- PCR is about directional sentiment (bullish/bearish)
- GEX is about volatility regime (calm/chaotic)
- They're complementary: PCR tells you the direction of the bets, GEX tells you how the house will react

---

## Limitations of GEX

1. **GEX assumes all OI is dealer-short.** In reality, some OI represents dealer-bought positions (dealers are sometimes long options). This overstates GEX magnitude but the directional signal (positive vs negative) is usually correct.

2. **GEX doesn't capture delta hedging from non-options positions.** Dealers also hedge with futures, swaps, and other instruments. Large futures positions can create effects similar to options GEX.

3. **GEX changes throughout the day.** As price moves, gamma changes (charm, vanna effects). The GEX you see at 10 AM may be different by 2 PM. OptionDash refreshes every 5 minutes to mitigate this.

4. **GEX is a flow indicator, not a price predictor.** GEX tells you about the environment (calm vs volatile), not the direction. Don't try to predict price from GEX alone.

5. **GEX is not equally distributed across expirations.** OptionDash uses the nearest expiration by default. Longer-dated expirations also have gamma, but it's lower per contract because gamma decreases with time. For a complete picture, you'd want to sum across all expirations — OptionDash focuses on the nearest (most gamma-intensive) expiration.

---

## Common Pitfalls

**"Negative GEX means the market will crash."**
Negative GEX means volatility will be amplified in BOTH directions. The market could crash OR rip higher. GEX tells you about the size of moves, not the direction.

**"Positive GEX means the market is safe."**
Positive GEX dampens volatility intraday, but it doesn't prevent directional moves driven by fundamentals. A market can decline steadily in a positive GEX environment — it just declines more slowly with counter-trend bounces.

**"GEX magnitude directly predicts daily range."**
It's correlated but not deterministic. Many other factors influence daily range (news, liquidity, positioning in other instruments). Use GEX as context, not as a range forecast.

**"GEX from one expiration tells the whole story."**
The nearest expiration typically has the most gamma, but sometimes a further-dated expiration has concentrated positions that matter more. Use the Expiration Picker to check multiple cycles.

---

**Next:** [Volatility Metrics](07-volatility.md) — IV, HV, and the Volatility Risk Premium
