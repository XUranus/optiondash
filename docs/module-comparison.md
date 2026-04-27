# Module: Comparison

The Comparison module displays a multi-ticker table with anomaly detection. It lets you scan all supported tickers at once and spot unusual activity.

---

## Table Columns

| Column | Description |
|--------|-------------|
| Ticker | Symbol (SPY, QQQ, IWM, TLT, XLF) |
| Spot Price | Current price with daily change % (colored) |
| Max Pain | Max Pain strike with deviation from spot |
| PCR (Vol/OI) | Signal tag (bullish/bearish/neutral) + both PCR values |
| Gamma Exposure | Dollar GEX + Positive/Negative regime tag |
| Call OI / Put OI | Absolute OI counts (green calls, red puts) |
| Anomalies | Flags for unusual data points |

---

## Anomaly Detection

The system checks each ticker for four types of anomalies:

### 1. PCR Extremes
- **Trigger:** PCR (OI-based) > 2.0 or < 0.5
- **Label:** `pcr extreme` (volcano-colored tag)
- **Meaning:** The put/call ratio is at an extreme level. PCR > 2.0 means overwhelming bearish positioning; PCR < 0.5 means overwhelming bullish positioning. Extreme readings often precede reversals.

### 2. OI Spikes/Drops
- **Trigger:** Call or Put OI change > 20% vs 5-day average
- **Label:** `call_oi spike` or `put_oi drop` (red/orange tag)
- **Meaning:** Someone is building or liquidating a large position. A call OI spike suggests someone expects a big move up. A put OI spike suggests hedging or directional bets down. The direction of the OI change matters less than the magnitude — unusual OI activity always deserves attention.

### 3. GEX Flips
- **Trigger:** GEX sign changed from the 5-day average (positive → negative or negative → positive)
- **Label:** `gex flip` (purple tag)
- **Meaning:** The dealer gamma regime has shifted. A flip from positive to negative means volatility is likely to increase. A flip from negative to positive means volatility is likely to decrease.

### 4. Large Price Moves
- **Trigger:** Daily change > ±3%
- **Label:** `price spike` or `price drop`
- **Meaning:** The underlying is moving sharply. Combined with options positioning data, this can signal capitulation or breakout.

---

## How to Use the Comparison View

1. **Scan for red/orange rows** — these have anomalies; investigate first
2. **Compare PCR across tickers** — Is fear broad-based or isolated to one asset?
3. **Compare GEX regimes** — Which tickers are in negative gamma (higher vol risk)?
4. **Look for divergence** — If SPY is bullish but QQQ is bearish, there's a rotation narrative
5. **Click a ticker** to drill into its Dashboard and Strikes views

## Related Services

- `services/anomaly.py` — anomaly detection logic
- `services/pcr.py`, `services/gex.py` — underlying metrics

## Implementation

The comparison module (`frontend/src/modules/comparison/index.tsx`) fetches `GET /api/comparison/overview` for all tickers and renders an Ant Design Table. Anomalous rows get an orange background highlight.
