# 9. Putting It All Together

You've now learned every metric in OptionDash. This chapter shows you how to combine them into a coherent daily analysis routine.

---

## The Daily Workflow

Here's a 10-minute routine for analyzing options market data each day, using OptionDash:

### Step 1: Dashboard — Get the Lay of the Land (2 min)

Open the Dashboard for SPY. Check:

1. **Spot vs Max Pain deviation:**
   - Is price above or below Max Pain?
   - Is the deviation large (> 2%) or small?
   - What's the nearest major expiration?

2. **PCR signal:**
   - Bullish, bearish, or neutral?
   - Is it extreme (> 2.0 or < 0.5)?

3. **GEX regime:**
   - Positive or negative gamma?
   - What's the magnitude? Is it large (> $1B)?

4. **ATM IV:**
   - Is it elevated relative to recent history? (Check the Volatility chart if unsure)

**Quick takeaway:** Write down one sentence. "SPY is above Max Pain with neutral PCR, negative gamma ($-500M), and normal IV." This sentence is your starting context.

### Step 2: Strikes — Find the Key Levels (2 min)

Switch to the Strike Analysis tab for SPY.

1. **OI Wall chart:**
   - Where are the tallest bars? These are the day's key levels.
   - Where is spot relative to those walls? Is it approaching one?
   - Is Max Pain aligned with any OI wall?

2. **Max Pain Curve:**
   - Is the valley deep (strong magnet) or shallow (weak)?
   - Is spot inside the valley or outside?

3. **GEX Distribution:**
   - Is spot in a green zone (stable) or red zone (unstable)?
   - How close is the nearest flip zone (where GEX goes from positive to negative)?
   - Is there a massive red bar anywhere? That's a potential acceleration zone if price approaches it.

**Quick takeaway:** Note the two most important levels. "$545 call wall (resistance) and $530 GEX flip zone (support)."

### Step 3: Comparison — Scan for Anomalies (2 min)

Switch to the Comparison tab.

1. **Scan the Anomalies column** — any red tags? Which tickers?
2. **Compare PCR across tickers** — is fear broad (all bearish) or isolated?
3. **Compare GEX across tickers** — which is the most unstable?
4. **Look for divergence** — SPY bullish but IWM bearish? QQQ negative gamma but SPY positive?

**Quick takeaway:** Note which ticker needs attention. "IWM PCR extreme, negative GEX — worth drilling into."

### Step 4: Historical — Check the Trend Context (2 min)

Switch to the Historical tab for SPY (or whichever ticker needs attention).

1. **Max Pain vs Price:**
   - Is the gap widening or narrowing?
   - Does Max Pain lead price or follow?

2. **PCR & GEX Trends:**
   - Is PCR trending up (growing bearishness) or down?
   - Has GEX flipped recently?
   - Are there extreme spikes that coincided with price events?

3. **Volatility Study:**
   - Is VRP positive or negative?
   - Is IV rising, falling, or stable?
   - Where are we in the volatility cycle? (See Chapter 7)

4. **Skew:**
   - Is skew elevated or normal?
   - Trending up or down?
   - Any divergence with price?

**Quick takeaway:** What's changing? "PCR has been rising for 5 days, skew is following. Fear is building."

### Step 5: Synthesize (2 min)

Combine all observations into a market view. Use this framework:

```
SENTIMENT: [Bullish / Neutral / Bearish] because [PCR reading + trend]

VOLATILITY REGIME: [Calm / Normal / Elevated / Unstable] because [GEX regime + IV level + VRP]

KEY LEVELS: [Resistance at $X], [Support at $Y], [Max Pain at $Z]

WHAT'S CHANGING: [Trend in PCR / Trend in skew / GEX flip / OI concentration shift]

RISK SCENARIO: If X happens, then Y because [options positioning logic]
```

---

## Example Analysis: A Real Scenario

Let's walk through a realistic scenario using the framework.

### The Dashboard
- SPY: $542.31
- Max Pain: $540.00 (spot $2.31 above)
- PCR OI: 0.87 (Neutral)
- GEX: -$1.01B (Negative Gamma)
- ATM IV: 18.45%

### The Strikes
- OI Wall: Heavy call OI at $545, heavy put OI at $530
- Max Pain Curve: Moderate valley at $540
- GEX Distribution: Spot in a slight red zone. Zero-gamma line at $538. Large red cluster at $545.

### The Comparison
- SPY PCR neutral, QQQ PCR bullish, IWM PCR bearish (extreme — flagged anomaly)
- All three in negative GEX
- IWM has the largest PCR extreme

### The Historical
- Max Pain has been rising with price — normal convergence
- PCR has been declining for 2 weeks (sentiment improving)
- GEX flipped negative 3 days ago — was positive for 2 weeks before
- VRP is small positive — options slightly expensive, normal
- Skew is +4% — normal, but has been rising from +2% for a week

### The Synthesis

```
SENTIMENT: Neutral-to-cautious. PCR is normal but GEX just flipped negative.
The GEX flip is the most important change — the stability regime is shifting.

VOLATILITY REGIME: Becoming unstable. GEX just flipped to -$1B negative gamma after
2 weeks of positive. This is a regime change. Expect larger intraday ranges starting now.

KEY LEVELS: Resistance $545 (call wall), Support $530 (put wall), Max Pain $540.
Spot at $542 is between Max Pain and resistance. If $545 breaks, negative GEX means
the breakout could be violent.

WHAT'S CHANGING:
- GEX flipped from positive to negative 3 days ago (stability → instability)
- Skew rising (growing fear despite price near highs = bearish divergence)
- IWM showing extreme PCR (broad market fear signal)

RISK SCENARIO: If SPY breaks below $540 (Max Pain + approaching zero-gamma line),
dealer hedging in negative gamma regime could accelerate the drop. Put wall at
$530 is the downside target. If SPY breaks above $545 (call wall), short gamma
amplification could drive a sharp rally. Either way, expect larger moves than
the past 2 weeks.
```

---

## The Checklist

Here's a condensed checklist for efficient daily analysis:

### Sentiment Assessment
- [ ] PCR: Bullish, bearish, or neutral? Trending which way?
- [ ] Skew: Elevated or normal? Trending which way?
- [ ] PCR-Skew alignment: Both saying the same thing or diverging?

### Stability Assessment
- [ ] GEX regime: Positive or negative? Magnitude?
- [ ] GEX trend: Stable or recently flipped?
- [ ] IV level: High, normal, or low vs history?
- [ ] VRP: Positive (normal) or negative (unusual)?

### Level Assessment
- [ ] OI Walls: Where are the major concentrations?
- [ ] Max Pain: Where is the magnet? Deviation from spot?
- [ ] GEX flip zones: Where does green turn to red?

### Risk Assessment
- [ ] What would break the current range? (OI wall or GEX cluster)
- [ ] Which direction would dealer hedging amplify?
- [ ] Any extreme readings? (PCR > 2.0, skew > 15%, VRP negative)

---

## When the Metrics Disagree

The hardest (and most important) skill is resolving conflicting signals. Here's a hierarchy:

### Tier 1 (Pay Most Attention)
- **GEX regime changes** — These directly affect price behavior. A flip from positive to negative GEX is more actionable than a PCR shift.
- **Extreme skew readings** — When the market is paying 3× normal for crash protection, listen.
- **Large OI walls near spot** — Price will respect these or violently break them.

### Tier 2 (Context)
- **PCR level** — Important but slow-changing. Use for medium-term positioning context.
- **VRP** — Tells you about options pricing but is slow to change meaningfully.
- **Max Pain deviation** — Most useful near expiration; less meaningful 3+ weeks out.

### Tier 3 (Background)
- **IV level alone** — Without context (VRP, skew), IV level is just a number.
- **Volume (without OI change)** — Mostly noise unless confirming OI shifts.
- **Single-day PCR spikes** — Check if OI changed. If not, probably a one-off trade.

### The Resolution Principle

When top-tier and bottom-tier metrics disagree, trust the top tier. If GEX is strongly negative (predicting unstable conditions) but PCR is neutral, the unstable conditions signal is more urgent — PCR will catch up later.

---

## Building Intuition

The best way to develop intuition is to:

1. **Do the daily routine for 2 weeks.** Write down your synthesis each day. Review what you got right and wrong.
2. **Watch how price behaves around OI walls.** Does it stall at the level? Break through? Reverse? Build a mental catalog of how walls behave in different GEX regimes.
3. **Track GEX flips.** Note what the market did in the 3 days after a flip. Was volatility higher? Lower? Was there a directional move?
4. **Compare your reads to actual outcomes.** Keep a simple journal: "Monday: expected choppy range (positive GEX, no clear catalyst). Result: SPY traded in 0.5% range all day." Over time, you calibrate your interpretation.
5. **Watch one ticker deeply** before trying to follow all five. SPY has the most options activity and the clearest signals. Master SPY first, then add QQQ and IWM.

---

## Final Thoughts

Options market data gives you a window into the "shadow market" — the flows, positioning, and hedging activity of the most leveraged participants. But no metric predicts the future. These tools help you understand:

- **The environment** (calm vs volatile, trending vs mean-reverting)
- **The positioning** (bullish vs bearish, hedged vs exposed)
- **The key levels** (where things are likely to happen)

What you DO with that understanding — your trading decisions — remains your responsibility. The goal of OptionDash is to make sure those decisions are as well-informed as possible.

Remember: the market can stay irrational longer than you can stay solvent. Options flows are one input. Fundamentals, macro, technicals, and plain old luck all matter too. Use everything, trust nothing absolutely, and always manage your risk.

---

## Further Reading

- **Natenberg, "Option Volatility and Pricing"** — The bible of options trading. Covers every Greek in microscopic detail.
- **Sinclair, "Volatility Trading"** — Practical guide to trading vol. Excellent coverage of VRP and skew.
- **SpotGamma** — Professional GEX analysis service. Their daily notes are excellent examples of options flow analysis.
- **CBOE.com** — Official data for VIX, SKEW, and put/call ratios. Useful for cross-validation.
- **OptionsProfitCalculator.com** — Free Max Pain calculator. Cross-reference OptionDash's Max Pain with this for sanity checks.

---

*This guide was written for the OptionDash platform. All metrics described are implemented and viewable within the application.*
