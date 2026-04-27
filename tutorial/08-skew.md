# 8. 25-Delta Skew

## The Big Picture

**25-Delta Skew** measures the difference in implied volatility between a 25-delta out-of-the-money (OTM) put and a 25-delta OTM call. In plain English: it tells you how much more the market is paying for downside protection than upside speculation. Skew is the purest measure of options-market fear.

When skew is high (positive), puts are much more expensive than equidistant calls — the market is paying a premium for crash protection. When skew is low or negative, calls are relatively more expensive — the market is pricing upside more aggressively than downside.

---

## Why "25-Delta"?

Delta tells you how far OTM an option is in probability terms:
- A **25-delta call** has roughly a 25% chance of expiring ITM. It's somewhat OTM.
- A **25-delta put** has roughly a 25% chance of expiring ITM. It's somewhat OTM.

Using 25-delta strikes standardizes the comparison. Instead of comparing a $500 put to a $550 call (different distances from spot), you compare options that are equally probable to finish ITM. This isolates the "skew" — the pure difference in how the market prices upside vs downside of equal probability.

---

## The Calculation

```
25-Delta Skew = IV(25Δ Put) - IV(25Δ Call)
```

### Step by Step

1. Find the put whose delta is closest to -0.25 (the 25-delta OTM put)
2. Get its implied volatility
3. Find the call whose delta is closest to +0.25 (the 25-delta OTM call)
4. Get its implied volatility
5. Subtract: put IV minus call IV

If the 25-delta put has IV of 22% and the 25-delta call has IV of 18%, skew = +4%.

### Implementation Note

OptionDash uses linear interpolation to find IV at exactly delta ±0.25, since actual listed strikes rarely land exactly at that delta. The `scipy.interpolate` module handles this.

---

## Why Skew Exists

In equity markets, skew is nearly always positive (puts more expensive than calls). This is called the "volatility smile" or "volatility smirk" — the IV curve is higher on the put side. Three reasons:

### 1. Crashophobia
Equities tend to crash down, not up. A stock can fall 20% in a day but rarely rises 20% in a day. This asymmetry makes OTM puts more valuable than OTM calls — the tail risk is to the downside. The market has priced this in permanently since the 1987 crash.

### 2. Structural Hedging Demand
The world is net long equities. Pension funds, mutual funds, ETFs — they all hold stocks. These institutions buy OTM puts as portfolio insurance. They generally don't buy OTM calls (they already have upside exposure through their stock holdings). This persistent structural bid for puts creates permanent positive skew.

### 3. Leveraged Speculation
Retail and some hedge funds prefer calls for leveraged upside bets. This creates some demand for OTM calls, partially offsetting the put skew. In meme stock manias or speculative frenzies, this call demand can temporarily invert skew (make it negative — calls more expensive than puts).

---

## Interpreting Skew Values

### For SPY/QQQ (Equity Indices)

| Skew (25Δ) | Level | What It Means |
|------------|-------|---------------|
| +0% to +3% | **Low skew** | Puts only modestly more expensive than calls. Market is complacent. Sellers of puts are not demanding much premium. This can persist for months in bull markets. |
| +3% to +8% | **Normal** | Standard equity skew. Puts command a reasonable premium over calls. Healthy amount of hedging demand without panic. |
| +8% to +15% | **Elevated** | Fear is above average. Put buying demand is significant. The market is pricing in a meaningful chance of a pullback. |
| > +15% | **Extreme** | High fear / possible panic. Puts are very expensive relative to calls. Often occurs near market bottoms. Extreme readings (>+20%) frequently mark excellent buying opportunities, though timing is difficult. |

### Negative Skew (Rare for Indices)

If skew goes negative (calls more expensive than puts), this is unusual for equity indices:

| Scenario | Why |
|----------|-----|
| **Short squeeze / meme mania** | Massive call buying forces call IV above put IV |
| **Bear market rally expectations** | Market expects a sharp bounce — calls are bid |
| **M&A speculation** | Deal premium is priced into calls |
| **Data error** | Verify with another source |

---

## How OptionDash Displays Skew

### Historical Skew Chart

A single purple line with shaded extreme zones:
- **Shaded red above +5%:** Elevated skew zone
- **Shaded red below -5%:** Negative skew zone (rare for indices)
- The line itself shows the evolution of skew over time

### What to Look For

**1. Trend direction:**
- Skew rising → growing fear. People are paying more for protection.
- Skew falling → declining fear. Complacency settling in.

**2. Divergence with price:**
This is the most powerful skew signal.

| Price | Skew | Signal |
|-------|------|--------|
| Rising | Rising | **Bearish divergence.** Smart money hedging into strength. Potential top forming. |
| Rising | Falling | **Bullish confirmation.** Market confident. No one hedging. Trend healthy (until skew gets too low). |
| Falling | Rising | **Fear confirmation.** Market selling off AND buying protection. Normal bearish behavior. Not yet a bottom. |
| Falling | Falling | **Bullish divergence.** Fear subsiding despite price declines. Potential bottom forming. Smart money no longer hedging. |

**3. Extreme readings:**
- Skew spike to +20% or higher: This is fear capitulation. Puts are incredibly expensive. Historically, buying stocks when skew is at multi-year highs has been profitable over the following 1-3 months.
- Skew dropping below +2% for SPY: Unusually complacent. The market is not pricing ANY risk premium for puts. This is when downside surprises hurt the most.

**4. Term structure (comparing expirations):**
If near-dated skew is much higher than far-dated skew, fear is concentrated in the very short term (event-driven: election, Fed, earnings). If far-dated skew is higher, the market is worried about medium-term risks.

---

## Skew vs Other Fear Gauges

### Skew vs PCR
- **Skew:** Fear expressed through PRICE (what people are willing to pay for protection)
- **PCR:** Fear expressed through POSITIONING (what people are actually holding)

They usually move together but can diverge. When PCR is low (people not holding puts) but skew is high (puts are expensive), it means demand for protection is strong but at elevated prices — people want protection but are reluctant to pay up. When both spike together, you have unified fear.

### Skew vs VIX
VIX measures ATM IV (the 30-day expected volatility). Skew measures the PRICE OF TAIL RISK specifically. VIX can be low while skew is high — the market expects modest overall volatility but is pricing a small chance of a large crash. Or VIX can be high while skew is normal — the market expects elevated volatility but no crash premium. They measure different things.

### Skew vs VRP
- **VRP:** Options expensive vs REALIZED volatility (backward comparison)
- **Skew:** Puts expensive vs CALLS (cross-sectional comparison)

VRP asks "are options expensive relative to how much the stock has been moving?" Skew asks "are puts expensive relative to calls?"

---

## The 25Δ vs Other Skew Measures

OptionDash uses **25-delta skew** specifically. Other common skew measures:

| Measure | What It Is | Used For |
|---------|-----------|---------|
| 25Δ Skew | IV(25Δ Put) − IV(25Δ Call) | Standard risk reversal. OptionDash's metric. |
| 10Δ Skew | IV(10Δ Put) − IV(10Δ Call) | Far-OTM tail risk. More sensitive to crash fears. |
| ATM Skew | IV(ATM Put) − IV(ATM Call) | Tiny; not very informative for equities. |
| CBOE SKEW Index | Based on S&P 500 tail risk | CBOE's proprietary index. Tracks crash risk. |

25Δ is the industry standard because it captures meaningful OTM pricing (these options have significant gamma and vega) without going so far OTM that quotes become unreliable. The contracts exist, trade actively, and have meaningful delta/gamma — making the metric real, not theoretical.

---

## Common Pitfalls

**"High skew means the market will crash."**
High skew means the market is PRICING a higher probability of a crash. This is often a contrary indicator — when everyone has already bought crash protection, the crash is less likely (or at least less damaging, because people are hedged).

**"Skew is the same as volatility."**
Skew and IV are related but different. IV can be high while skew is low (expensive options across all strikes, but evenly priced). IV can be low while skew is high (overall options are cheap, but puts are relatively expensive). They tell different stories.

**"Comparing skew across different assets directly."**
Equities naturally have positive skew. Commodities often have negative or zero skew. Gold has its own skew structure. Only compare skew within the same asset class.

**"Reacting to single-day skew changes."**
Skew can jump on large one-day put buys that don't represent a sentiment shift. Look at the trend over days/weeks. The historical chart in OptionDash makes this easy.

**"Ignoring skew when it's 'normal.'"**
The most dangerous skew is not extreme skew — it's skew that has been normal for so long that people stop watching it. Regime changes often come from "normal" starting points.

---

**Next:** [Putting It All Together](09-putting-it-together.md) — Building a complete daily analysis workflow
