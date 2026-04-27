# OptionDash Metrics Guidebook

A comprehensive guide to every options metric implemented in this platform — what they mean, how they're calculated, and how to use them in real analysis.

---

## Who This Guide Is For

You have a basic understanding of stocks (buy low, sell high) but are new to options. You want to understand what the indicators in OptionDash mean and how professional traders use them to read market positioning.

By the end of this guide, you'll understand:

- What each metric measures and why it matters
- How the metric is calculated (explained intuitively, then mathematically)
- How to interpret the metric's current value
- Common patterns and what they signal
- How to combine multiple metrics into a coherent market view

---

## Table of Contents

1. [Options Basics](01-options-basics.md) — Calls, puts, strike prices, expiration, moneyness
2. [Open Interest & Volume](02-open-interest-volume.md) — The building blocks of options positioning
3. [Max Pain](03-max-pain.md) — Where option writers want the price to go
4. [Put/Call Ratio](04-put-call-ratio.md) — Measuring market sentiment
5. [The Greeks](05-greeks.md) — Delta, Gamma, Theta, Vega explained intuitively
6. [Gamma Exposure (GEX)](06-gamma-exposure.md) — How dealer hedging shapes price action
7. [Volatility Metrics](07-volatility.md) — IV, HV, and the Volatility Risk Premium
8. [25-Delta Skew](08-skew.md) — The market's fear gauge
9. [Putting It All Together](09-putting-it-together.md) — Building a complete analysis workflow

---

## How to Read This Guide

Each chapter follows the same structure:

1. **The Big Picture** — A one-paragraph intuitive explanation
2. **The Details** — Step-by-step breakdown with examples
3. **The Math** — The actual formulas (you can skip these)
4. **How OptionDash Calculates It** — Our specific implementation
5. **Real-World Interpretation** — What different values mean in practice
6. **Common Pitfalls** — Mistakes beginners make when reading this metric

If you're new, read the chapters in order. Each one builds on the last.
