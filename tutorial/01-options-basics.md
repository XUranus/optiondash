# 1. Options Basics

## The Big Picture

An **option** is a contract that gives the buyer the right (but not the obligation) to buy or sell 100 shares of a stock at a specific price (the **strike price**) on or before a specific date (the **expiration date**). Think of it like an insurance policy — you pay a premium upfront for the right to make a transaction later.

Every option has a **buyer** and a **seller** (called the **writer**). The buyer pays a premium. The seller collects the premium and takes on the obligation. This asymmetry — buyers have rights, sellers have obligations — is the fundamental dynamic that drives all options market mechanics.

---

## Calls and Puts

### Call Option

A call gives the buyer the right to **buy** 100 shares at the strike price.

- You buy a call when you think the stock will go **up**
- You sell (write) a call when you think the stock will stay flat or go down, and you want to collect the premium

**Example:** SPY is at $500. You buy a $510 call expiring in 2 weeks, paying $2.00 per share ($200 total for 1 contract). If SPY goes to $525 by expiration, you can buy 100 shares at $510 and immediately sell at $525 — a $15 profit per share, minus your $2 cost = $13 net per share ($1,300 per contract). If SPY stays below $510, your option expires worthless and you lose the $200 premium.

### Put Option

A put gives the buyer the right to **sell** 100 shares at the strike price.

- You buy a put when you think the stock will go **down**
- You sell (write) a put when you think the stock will stay flat or go up, and you want to collect the premium

**Example:** SPY is at $500. You buy a $490 put expiring in 2 weeks, paying $2.00 per share ($200 total). If SPY drops to $470 by expiration, you can sell 100 shares at $490 (even though market price is $470) — a $20 profit per share, minus your $2 cost = $18 net per share ($1,800 per contract). If SPY stays above $490, your put expires worthless and you lose the $200 premium.

---

## Key Concepts

### Strike Price

The price at which the option can be exercised. Options exist at many strike prices — above, at, and below the current stock price. This is why the "strike axis" is so important in the Strike Analysis module.

### Expiration Date

The date the option contract expires. After this date, the option is worthless. Options closer to expiration have less time value and move faster relative to the underlying (higher gamma — we'll get to that later).

In OptionDash, we automatically select the nearest expiration with at least 3 days remaining. You can change this with the Expiration Picker.

### Premium

The price of the option, quoted per share. A $2.00 premium means $200 per contract (100 shares × $2.00). Premium has two components:

1. **Intrinsic value:** How much the option is worth if exercised right now. A $510 call when SPY is at $525 has $15 of intrinsic value.
2. **Time value:** The extra premium above intrinsic value. It represents the possibility that the option becomes more valuable before expiration. Time value decays to zero by expiration (this decay is called **theta**, covered later).

### Moneyness

| Term | Meaning | Example (SPY at $500) |
|------|---------|----------------------|
| **ITM** (In The Money) | Has intrinsic value | $490 call, $510 put |
| **ATM** (At The Money) | Strike ≈ spot price | $500 call or put |
| **OTM** (Out of The Money) | No intrinsic value | $510 call, $490 put |

ATM options have the most time value and the highest gamma. Most of the interesting action in options markets happens near the money.

### Contract Multiplier

One standard equity option contract controls **100 shares**. All dollar values in OptionDash account for this multiplier. When you see "Open Interest: 5,000" on a strike, that's 5,000 contracts × 100 shares = 500,000 shares of potential exposure.

---

## Who's Who in the Options Market

Understanding who the players are is essential for reading the metrics:

### Market Makers / Dealers
These are firms like Citadel, Susquehanna, and Wolverine that provide liquidity by continuously quoting bid and ask prices. They don't take directional bets — they make money from the bid-ask spread. To stay neutral, they **delta-hedge** by buying or selling the underlying stock. Their hedging activity is what creates price effects at OI walls and drives GEX dynamics.

### Institutional Investors (The "Smart Money")
Pension funds, mutual funds, hedge funds. They use options for:
- **Hedging:** Buying puts to protect a long stock portfolio
- **Yield enhancement:** Selling covered calls to generate income
- **Directional bets:** Buying calls or puts to express a view

Their activity shows up in OI changes and PCR readings.

### Retail Traders
Individual traders. Tend to buy calls and puts rather than sell them. High retail activity often shows up in volume but may not persist in OI (day-trading).

### Option Writers (Sellers)
Anyone selling options — market makers, covered call funds, put-selling funds. They collect premium and take on the obligation. Their aggregate position determines Max Pain and dealer GEX.

---

## Why Options Data Matters for Stock Traders

Even if you never trade options, options market data tells you what the most leveraged, best-informed participants are doing:

- Large traders who want to move size without impacting the stock price use options
- Hedging flows from options dealers create predictable price effects
- Options positioning creates magnetic levels (Max Pain, OI walls) that spot price often respects
- Changes in options IV and skew often lead price moves

Options data is a window into the "shadow market" that drives a significant portion of daily stock volume.

---

**Next:** [Open Interest & Volume](02-open-interest-volume.md) — How to measure positioning size and conviction
