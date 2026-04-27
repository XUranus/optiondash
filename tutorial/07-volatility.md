# 7. Volatility Metrics

## The Big Picture

Volatility measures how much a stock's price moves around. In options markets, there are two types: **Implied Volatility** (what the market expects) and **Historical Volatility** (what actually happened). The difference between them — the **Volatility Risk Premium (VRP)** — tells you whether options are expensive or cheap relative to reality.

---

## Implied Volatility (IV)

### What It Is

**Implied Volatility** is the market's forecast of how volatile a stock will be over the life of an option. It's "implied" because it's backed out of the option's current market price using an options pricing model (Black-Scholes).

Think of it this way: an option's price depends on five things — stock price, strike, time to expiration, interest rates, and volatility. The first four are known. Given the option's market price, you can solve for the volatility that makes the model price equal the market price. That's implied volatility.

### How to Think About IV

- **IV is a fear gauge.** When the market is scared, people bid up options → IV rises.
- **IV is a cost indicator.** High IV = expensive options. Low IV = cheap options.
- **IV is mean-reverting.** It spikes during crises and slowly decays afterward.
- **IV is forward-looking.** It reflects expectations, not history.

### ATM IV in OptionDash

The dashboard shows **ATM IV** — the implied volatility of the option whose strike is closest to the current stock price. ATM options are the most liquid and most representative. OptionDash averages the IV of the ATM call and ATM put.

---

## Historical Volatility (HV)

### What It Is

**Historical Volatility** — also called realized volatility or statistical volatility — measures how much the stock has ACTUALLY moved, calculated from past price data.

### The Calculation

```
Daily Log Return = ln(Price_today / Price_yesterday)
HV30 = Standard Deviation of daily log returns over 30 days × √252
```

Multiplying by √252 annualizes the daily volatility to make it comparable to IV (which is quoted annualized).

### How to Think About HV

- **HV is backward-looking.** It tells you what happened, not what will happen.
- **HV is reality.** It's the actual realized movement, not the market's expectation.
- **HV is slower than IV.** It takes 30 days of data to fully register a volatility spike.

### HV30 in OptionDash

OptionDash calculates HV30 from the previous 30 trading days of closing prices fetched from Yahoo Finance. It appears on the Volatility Study chart alongside ATM IV.

---

## Volatility Risk Premium (VRP)

### What It Is

```
VRP = ATM IV - HV30
```

VRP measures how much extra premium options command over what realized volatility would justify.

### Why VRP Exists

Options consistently trade at a premium to realized volatility. This is the **Volatility Risk Premium** — the compensation option sellers demand for taking on the risk of:
- Gap risk (the stock can move overnight when they can't hedge)
- Tail risk (the occasional massive move that blows out their position)
- Inventory risk (they have to warehouse positions they don't necessarily want)

Over the long run, option sellers earn this premium. It's their profit for providing insurance. Option buyers pay it.

### Interpreting VRP

| VRP | Interpretation |
|-----|---------------|
| **Large positive** (> +0.05 or 5%) | Options expensive. Sellers being compensated well. Good environment for covered calls, put selling. Buyers paying a lot for hedges/speculation. |
| **Small positive** (0 to +0.05) | Normal state. Options modestly expensive. Average compensation for sellers. |
| **Near zero** (0 ± 0.02) | Options cheap vs realized vol. Unusual. Market underpricing risk. Warning sign. |
| **Negative** (< 0) | Rare. Options cheaper than realized vol would justify. The market has moved faster than options pricing expected. Often occurs AFTER a volatility event (realized vol rose, IV hasn't caught up yet) or during a grinding trend where vol is realized but not feared. |

### VRP in OptionDash

The Volatility Study chart shows VRP as an area chart (orange line with colored fill):
- **Green area:** Positive VRP (options expensive) — normal, healthy
- **Red area:** Negative VRP (options cheap) — unusual, worth investigating
- VRP extreme zones are marked with red shading

---

## The Volatility Cycle

IV and HV interact in a predictable cycle:

### Phase 1: Calm (Low IV, Low HV, Small VRP)
Everything is quiet. Options are cheap, and stocks aren't moving much. VRP is small but positive. This phase can last for months. **OptionDash shows:** Green/neutral VRP, low ATM IV.

### Phase 2: Anticipation (Rising IV, Still-Low HV)
Something's coming. IV starts rising (people buy protection) but HV hasn't caught up yet because the event hasn't happened. VRP widens. **OptionDash shows:** Rising ATM IV, flat HV30, VRP rising into positive territory.

### Phase 3: Event (Exploding HV, IV Already High)
The event hits. Realized vol spikes. HV30 catches up quickly (because big daily moves enter the 30-day window). IV might actually fall as the uncertainty resolves, even though stocks are moving a lot. VRP can briefly go negative. **OptionDash shows:** HV30 rising fast, VRP may flip negative, IV still elevated.

### Phase 4: Normalization (Falling IV, Still-Elevated HV)
The crisis passes. IV falls as fear subsides. But HV30 stays elevated because the 30-day window still contains the large moves. VRP goes negative (options cheap relative to recent realized vol). **OptionDash shows:** Falling ATM IV, elevated HV30, negative VRP.

### Phase 5: Back to Calm
HV30 gradually declines as the large moves fall out of the 30-day window. IV settles at a new (often higher) baseline. VRP returns to small positive. Cycle resets.

---

## Reading Volatility in OptionDash

### Dashboard
- **ATM IV card:** The spot IV level as a decimal (multiply by 100 for percentage). 0.1845 = 18.45%.

### Historical Volatility Study Chart

**Triple-line chart:**
- **Blue (ATM IV):** Forward expectation
- **Gray dashed (HV30):** Backward reality
- **Orange area (VRP):** The gap between them

**What to look for:**

1. **Convergence/divergence:** Are IV and HV converging (normal) or diverging (something's changing)?
2. **VRP regime:** Is VRP positive or negative? Trending or stable?
3. **IV spikes:** Did ATM IV spike recently? Has it subsided?
4. **HV catch-up:** Is HV30 rising toward IV (vol event happening) or staying low (calm)?

### Comparison Table
- **PCR comparisons with VRP context:** High PCR + high VRP = scared market paying up for protection (potentially over-hedged). High PCR + low VRP = hedged but not panicked (more concerning for bears — smart money is calm while positioning is bearish).

---

## Using Volatility Metrics for Timing

### When to Buy Options
- **Low IV + Low VRP:** Options are cheap. If you have a directional view, this is when buying calls/puts has the best risk/reward (you're not overpaying for vol).
- **Negative VRP:** Options are unusually cheap. Could be an opportunity if you expect vol to mean-revert higher.

### When to Sell Options
- **High IV + High VRP:** Options are expensive. Selling premium (covered calls, cash-secured puts, strangles) is attractive.
- **Post-crisis IV:** After a vol event, IV often stays elevated even as stocks stabilize. Selling into elevated IV after panic subsides is a classic strategy.

### When to Stay Away
- **Rising IV + Rising HV:** Vol regime change underway. Direction unclear. Wait for stabilization.
- **Extreme negative VRP during a crash:** Markets moving too fast for models. Don't try to catch the falling knife with vol strategies.

---

## Common Pitfalls

**"High IV means the stock will be volatile."**
IV is an expectation, not a prediction. Stocks can have high IV and then do nothing (IV crush after events). IV reflects the PRICE of fear, not the certainty of movement.

**"Low HV means the stock is safe."**
HV is backwards-looking. A stock can have low 30-day HV and then gap 10% tomorrow. This is precisely why IV exists — it prices in the possibility of gap moves that HV hasn't registered yet.

**"Negative VRP is a buy signal."**
Not necessarily. Negative VRP often occurs because the market just experienced a volatility event that HV is still registering but IV has already priced in as "over." It can stay negative for extended periods. Negative VRP is worth noting but is not an actionable signal alone.

**"Comparing IV levels across different tickers."**
An IV of 25% for SPY is elevated. An IV of 25% for a biotech stock is nothing. IV must be evaluated relative to each ticker's own history. Use the Volatility Study chart to see IV in its historical context.

---

**Next:** [25-Delta Skew](08-skew.md) — The market's fear gauge
