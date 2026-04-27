# Module: Strike Analysis

The Strike Analysis module visualizes option chain data at the individual strike level. Instead of aggregate numbers, you see where Open Interest and Gamma Exposure concentrate along the strike axis.

---

## Charts

### OI Wall (Open Interest by Strike)

**Chart type:** Bidirectional bar chart
- **Green bars (up):** Call Open Interest per strike
- **Red bars (down):** Put Open Interest per strike
- **Blue dashed line:** Current spot price
- **Orange dashed line:** Max Pain strike

**How to read it:**

OI Walls are strike levels with massive open interest. They act as support and resistance because:

- **Call OI walls** create resistance. When price approaches a strike with heavy call OI from above, dealers who sold those calls need to buy the underlying as price falls to delta-hedge — creating a floor. When price approaches from below, dealers need to sell as price rises — creating a ceiling.
- **Put OI walls** create support. When price approaches a strike with heavy put OI from above, dealers who sold those puts need to buy the underlying as price rises to delta-hedge — creating support.

A good mental model: look for the tallest bars. Those are the most significant OI walls. If price is trapped between a tall call OI wall above and a tall put OI wall below, expect range-bound action until one side is absorbed.

**What to look for:**
- The tallest green/red bars — these are the key levels
- Whether spot is near any major OI concentration
- Whether Max Pain aligns with a natural OI wall or sits between them

### Max Pain Curve

**Chart type:** Area chart
- **Blue curve:** Total option holder loss at each possible settlement price
- **Orange point:** The strike with minimum loss (Max Pain)
- **X-axis:** Strike prices
- **Y-axis:** Total loss in dollars (the amount option holders collectively lose at each settlement price)

**How to read it:**

The Max Pain curve is a visualization of the Max Pain calculation. At each potential settlement price:
- Call holders lose money if the stock closes above their strike (they paid premium for nothing)
- Put holders lose money if the stock closes below their strike (same reason)

The curve plots the sum of all losses across ALL open contracts at each possible settlement. The lowest point — the valley — is where option holders collectively lose the least, and option writers profit the most. This is Max Pain.

A deep, well-defined valley means strong pinning (price likely converges to Max Pain). A shallow, broad valley means weak pinning (less magnetic effect).

**What to look for:**
- Shape of the valley: deep and narrow = strong magnet; shallow and wide = weak magnet
- Whether spot price is inside the valley or far from it
- Asymmetry: if one side of the valley is steeper than the other, there's asymmetric positioning

### GEX Distribution

**Chart type:** Colored bar chart
- **Green bars:** Positive GEX (dealer long gamma — volatility dampening at that strike)
- **Red bars:** Negative GEX (dealer short gamma — volatility amplification at that strike)
- **Dashed gray line:** Zero Gamma line
- **Dashed blue line:** Current spot price

**How to read it:**

GEX distribution shows whether dealers are long or short gamma at each strike level. This tells you how dealers will behave if price moves to that level:

**In green zones (positive GEX):**
- Dealers are long gamma → they sell into rallies and buy into dips
- This creates a "volatility dampening" effect
- These zones act like shock absorbers — price tends to stall

**In red zones (negative GEX):**
- Dealers are short gamma → they buy into rallies and sell into dips
- This creates a "volatility amplification" effect
- These zones are like accelerators — price tends to move through them quickly

**What to look for:**
- Where the zero-gamma line sits relative to spot
- Whether spot is in a green (stable) or red (unstable) zone
- Large red bars near spot = potential for outsized moves
- Large green bars near spot = likely consolidation

---

## Interaction

- Use the **Expiration Picker** to switch between expiration cycles
- Hover over bars/points for detailed tooltips with exact values
- The charts respond to the global **Ticker Selector**

## Related Services

- `services/max_pain.py` — Max Pain and curve calculation
- `services/gex.py` — GEX distribution and aggregate GEX

## Implementation

The strikes module (`frontend/src/modules/strikes/index.tsx`) makes three parallel API calls (oi-wall, max-pain-curve, gex-distribution) and renders each as an ECharts instance.
