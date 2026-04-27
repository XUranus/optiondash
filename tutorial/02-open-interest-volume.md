# 2. Open Interest & Volume

## The Big Picture

**Open Interest (OI)** is the total number of outstanding option contracts that have not been settled — a measure of positioning. **Volume** is the number of contracts traded today — a measure of activity. OI tells you where the money IS; volume tells you where the money is MOVING.

---

## Open Interest

### What It Is

Imagine a bulletin board where people post "I want to buy a $500 SPY call" and "I want to sell a $500 SPY call." When a buyer and seller match, a new contract is created. Open Interest is the count of all contracts currently on the board.

- When a new buyer and new seller trade: **OI goes up by 1**
- When an existing buyer sells to an existing seller: **OI goes down by 1**
- When a new buyer buys from an existing seller (or vice versa): **OI stays the same**

OI resets to zero at expiration (all contracts settle or expire worthless). It then rebuilds as new contracts are opened for the next cycle.

### Why It Matters

**OI represents persistent positioning.** Unlike volume (which is day-to-day noise), OI tells you what positions are being held overnight. High OI at a strike means many contracts are positioned there — and the dealers who sold those contracts must hedge, creating real price effects.

OI is the raw material for most of our metrics:
- **Max Pain** uses OI to calculate where writers profit most
- **PCR (OI)** uses OI to measure sentiment positioning
- **GEX** uses OI × gamma to calculate dealer exposure
- **OI Walls** in the Strike Analysis chart are direct OI visualizations

### How to Read OI in OptionDash

In the **OI Wall chart** (Strike Analysis module):
- Tall green bars (above axis): Large call OI at that strike → potential resistance
- Tall red bars (below axis): Large put OI at that strike → potential support
- The tallest bars are the most important levels

In the **Comparison table**:
- Total Call OI and Total Put OI columns show absolute positioning size
- Compare across tickers: which has more options activity overall?

---

## Volume

### What It Is

Volume is simply the number of contracts that changed hands during the current trading session. Unlike OI, volume resets to zero every day.

### Why It Matters

**Volume tells you what's happening RIGHT NOW.** High volume at a particular strike suggests:

- Someone is building a new position (if OI also rises)
- Someone is closing an existing position (if OI falls)
- Day-trading activity at that level

Volume without an OI change is just noise (opening + closing trades netting to zero). Volume WITH OI change is a signal.

### Volume PCR vs OI PCR

OptionDash shows both volume-based PCR and OI-based PCR:

- **Volume PCR:** What's being traded TODAY. More reactive, more noisy. Shows short-term sentiment shifts.
- **OI PCR:** What's being HELD. More stable, more meaningful. Shows persistent positioning.

The dashboard card displays OI PCR as the primary metric (weighted 60% in the composite signal), with volume PCR in the description.

---

## The Relationship Between OI, Volume, and Price

Here's the most important dynamic to understand:

### How OI Walls Affect Price

When a market maker sells a call option, they take on **positive delta exposure** — if the stock goes up, they lose money on the call they sold. To hedge, they **buy the underlying stock**. The more calls they sell, the more stock they buy. This hedging flows through the market.

At an **OI wall** (a strike with massive OI), consider what happens as price approaches:

**Approaching a Call OI Wall from below:**
- The calls are currently OTM
- As price rises toward the strike, delta increases on those calls (they become more likely to finish ITM)
- Dealers must buy more stock to stay delta-neutral → upward pressure

**Approaching a Call OI Wall from above:**
- The calls are currently ITM
- As price falls toward the strike, delta decreases on those calls
- Dealers must sell stock to stay delta-neutral → downward pressure

In both cases, the hedging flow pushes price TOWARD the strike, creating a "stickiness" or "wall" effect. This is why OI walls often act as support and resistance.

The same logic applies to put OI walls, but in reverse.

### The Dealer Perspective

A critical mental model: **dealers are usually net short options** (they sell more than they buy). When you look at OI, you're mostly looking at positions that dealers are SHORT. This means:

- Call OI = dealers are short calls → they must buy stock to hedge → upward pressure
- Put OI = dealers are short puts → they must sell stock to hedge → downward pressure

The net effect of all this hedging is captured by **Gamma Exposure (GEX)**, which we'll cover in detail later.

---

## What OptionDash Shows You

| View | OI Data | Volume Data |
|------|---------|-------------|
| Dashboard PCR Card | OI-based PCR (primary) | Volume-based PCR (secondary) |
| Strike Analysis > OI Wall | OI per strike (calls + puts) | — |
| Strike Analysis > Max Pain | Uses OI to compute losses | — |
| Strike Analysis > GEX | Uses OI × gamma | — |
| Comparison Table | Total call OI, total put OI | Total call volume, total put volume |
| Historical PCR | OI PCR trend line | Volume PCR trend line |

---

## Common Pitfalls

**"High OI means lots of buying."**
No — OI means contracts exist. For every buyer there's a seller. High OI means lots of POSITIONING, not lots of buying. You don't know which side is "right" — you just know there are big positions.

**"High volume means the smart money is moving."**
Volume can be retail day-trading, institutional repositioning, or anything in between. Volume matters most when accompanied by OI changes in the same direction.

**"OI is a directional signal."**
OI alone doesn't tell you direction. It tells you where the battlefield is. The directional signal comes from combining OI with PCR, GEX, and price level.

---

**Next:** [Max Pain](03-max-pain.md) — The strike price where option writers profit most
