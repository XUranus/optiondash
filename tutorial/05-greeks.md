# 5. The Greeks

## The Big Picture

The **Greeks** measure how an option's price changes in response to different factors: the stock price (delta, gamma), time passing (theta), and volatility (vega). They're called Greeks because they're named after Greek letters. Every professional options trader thinks in Greeks, not in dollars.

Even if you never trade options, understanding Greeks is essential because **dealer hedging behavior is driven by Greeks** — specifically gamma — and that hedging behavior creates the price effects you see in OI walls, Max Pain, and GEX.

---

## Delta (Δ)

### The One-Sentence Explanation
**Delta measures how much an option's price changes when the stock price moves by $1.**

### The Details

- Call delta ranges from 0 to 1 (or 0 to 100 in trader-speak)
- Put delta ranges from -1 to 0 (or 0 to -100)
- An ATM call has delta ≈ 0.50 (the option captures about 50% of the stock move)
- A deep ITM call has delta ≈ 1.00 (moves dollar-for-dollar with the stock)
- A far OTM call has delta ≈ 0.05 (barely moves with the stock)

**Delta as probability:** Delta is also a rough approximation of the probability the option finishes ITM. A 0.30-delta call has roughly a 30% chance of expiring in the money.

### Why Delta Matters for OptionDash Users

Delta is the engine of dealer hedging. When a dealer sells a call with 0.30 delta, they immediately buy 30 shares of stock to stay "delta neutral." As the stock moves and delta changes, they adjust. This constant rebalancing is what creates the market flows we're measuring.

Delta is listed in the `strike_snapshots` table but is primarily an intermediate calculation for gamma exposure.

---

## Gamma (Γ)

### The One-Sentence Explanation
**Gamma measures how much delta changes when the stock price moves by $1.**

If delta is speed, gamma is acceleration.

### The Details

- Gamma is always positive for option buyers, negative for option sellers
- Gamma is highest for ATM options and decreases as you go further OTM or ITM
- Gamma increases as expiration approaches (the "gamma pin" effect)
- Near expiration, ATM options have enormous gamma — delta can flip from 0 to 100 rapidly

**Example:** You own an ATM call with delta 0.50 and gamma 0.05. The stock goes up $1:
- Delta becomes 0.50 + 0.05 = 0.55
- The option gained $0.50 from the initial delta PLUS an extra amount from gamma
- Next $1 move: delta is now 0.55 + 0.05 = 0.60

### Gamma and Dealer Hedging — The Key Dynamic

Dealers are typically **short gamma** (they sold options, so they're on the negative side of gamma). When a dealer is short gamma:

| Market moves UP | Market moves DOWN |
|-----------------|-------------------|
| Their short calls gain positive delta | Their short puts gain negative delta |
| To hedge, they must BUY stock | To hedge, they must SELL stock |
| Their buying pushes price higher | Their selling pushes price lower |
| **They amplify the move** | **They amplify the move** |

Short gamma dealers are **pro-cyclical** — they trade WITH the trend, amplifying moves. This is what "negative gamma regime" means in the GEX indicator.

When a dealer is **long gamma**:

| Market moves UP | Market moves DOWN |
|-----------------|-------------------|
| Their long calls gain positive delta | Their long puts gain negative delta |
| To hedge, they must SELL stock | To hedge, they must BUY stock |
| Their selling pushes price lower | Their buying pushes price higher |
| **They dampen the move** | **They dampen the move** |

Long gamma dealers are **counter-cyclical** — they trade AGAINST the trend, dampening moves. This is what "positive gamma regime" means.

### Gamma and Expiration

As expiration approaches, ATM gamma goes through the roof. This means:
- Dealers holding short ATM gamma positions must hedge more and more aggressively
- The hedging flows become larger relative to normal market volume
- This is why Max Pain magnetism is strongest near expiration
- This is why markets often get "pinned" to a strike on expiration day

---

## Theta (Θ)

### The One-Sentence Explanation
**Theta measures how much an option loses in value each day due to time decay.**

### The Details

- Theta is always negative for option buyers (time decay works against you)
- Theta is positive for option sellers (you collect premium as time passes)
- Theta accelerates as expiration approaches — an option loses more per day in its final week than it did a month out
- ATM options have the highest theta (most time premium to decay)

**Example:** You buy an ATM call for $2.00 with theta of -0.05. If the stock doesn't move for a day, your option loses $0.05 in time value. After 20 days of no movement, it's lost $1.00 — half its value, just from time passing.

### Why Theta Matters for OptionDash Users

Theta explains WHY Max Pain magnetism exists. When dealers are short options, they have positive theta — they make money every day from time decay. As expiration nears and theta accelerates, they have a stronger incentive to keep the price near Max Pain to maximize their profit from time decay. Theta is the profit motive behind Max Pain.

---

## Vega (ν)

### The One-Sentence Explanation
**Vega measures how much an option's price changes when implied volatility moves by 1%.**

(Technically, vega isn't a Greek letter — it's just a made-up name that stuck.)

### The Details

- Vega is positive for option buyers (IV up = option price up)
- Vega is negative for option sellers (IV up = option price down for their position)
- Vega is highest for ATM options with lots of time remaining
- Vega decreases as expiration approaches (time to realize the volatility shrinks)

**Example:** You buy an ATM call with 30 days to expiration when IV is 20%. Vega is 0.15. If IV rises to 21%, your option gains $0.15 in value — even though the stock hasn't moved. If IV drops to 19%, you lose $0.15.

### Why Vega Matters for OptionDash Users

Vega explains why high IV environments are opportunities for option sellers (collecting inflated premium) and dangerous for option buyers (paying too much). The **VRP (Volatility Risk Premium)** metric tells you whether current IV is high or low relative to historical volatility — which is essentially telling you whether vega is expensive or cheap.

---

## Rho (ρ)

### The One-Sentence Explanation
**Rho measures how much an option's price changes when interest rates move by 1%.**

For most retail timeframes (days to weeks), rho is negligible. For long-dated options (LEAPS, 1+ year), rho matters. OptionDash uses a fixed risk-free rate (default 5.25%) and doesn't surface rho in the UI — it's purely an input to the Greeks engine.

---

## How OptionDash Computes Greeks

The `greeks_engine.py` service uses the **py_vollib_vectorized** library, which implements the Black-Scholes option pricing model. It:

1. Takes the full options chain (all strikes for a given expiration)
2. Extracts: spot price (S), strike prices (K), time to expiration (T), IV per strike (σ), and option type (c/p flag)
3. Calls `get_all_greeks()` which returns delta, gamma, theta, vega, rho for every contract simultaneously using vectorized NumPy operations
4. Handles edge cases: deep OTM options with zero IV, near-zero time to expiration (minimum T clamped to 1e-6 years)
5. NaN/inf values replaced with 0

The Greeks are then used to compute **Gamma Exposure (GEX)** by multiplying OI × gamma × 100 × spot price.

---

## The Greeks in OptionDash

| Where | Which Greeks | How Used |
|-------|-------------|---------|
| GEX calculation | Gamma | OI × gamma × 100 × spot |
| GEX distribution | Gamma per strike | Net dealer gamma at each strike |
| 25-Delta Skew | Delta | Find options with delta ≈ ±0.25 |
| strike_snapshots table | All five | Stored for historical analysis |

---

## Common Pitfalls

**"Greeks are exact predictions."**
No. Greeks are model estimates assuming Black-Scholes assumptions hold (constant IV, continuous hedging, no transaction costs). Real markets are messier. Greeks are a framework, not a crystal ball.

**"High gamma always means high risk."**
Gamma cuts both ways. High gamma on an option you OWN is good (rapid acceleration of profits). High gamma on an option you SOLD is dangerous. In market terms, high short gamma (negative dealer GEX) means unstable conditions.

**"Delta is the probability of expiring ITM."**
This is a rough approximation that works OK for ATM options near expiration. It breaks down for far OTM and long-dated options. Don't bet your account on it.

**"Theta helps you every day equally."**
Theta is not linear. It's slow 45 days out and ferocious in the final week. The famous "theta curve" shape — slow decay then rapid acceleration — catches beginners off guard.

---

**Next:** [Gamma Exposure (GEX)](06-gamma-exposure.md) — How aggregate dealer gamma shapes the market
