import React, { useState, useMemo } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

/* ---------------------------------------------------------------
 *  MaxPainVisualizer
 *  交互式教学组件：演示 Max Pain（最大痛点）的概念。
 *  用户拖动滑块改变假设的到期结算价，实时看到各期权的盈亏变化，
 *  以及卖方总损失曲线，直观理解为什么市场趋向 Max Pain 价格。
 * --------------------------------------------------------------- */

interface StrikeData {
  strike: number;
  callOI: number;
  putOI: number;
}

const OPTIONS_CHAIN: StrikeData[] = [
  { strike: 95, callOI: 500, putOI: 2000 },
  { strike: 98, callOI: 1200, putOI: 1500 },
  { strike: 100, callOI: 3000, putOI: 1000 },
  { strike: 102, callOI: 2000, putOI: 800 },
  { strike: 105, callOI: 800, putOI: 400 },
];

const MIN_PRICE = 90;
const MAX_PRICE = 110;

/** 计算在给定结算价下，卖方对所有期权的总损失 */
function calcTotalSellerLoss(settle: number, chain: StrikeData[]): number {
  let total = 0;
  for (const { strike, callOI, putOI } of chain) {
    // Call buyer profit = max(settle - strike, 0) * OI  => seller loss is the negative
    const callPayoff = Math.max(settle - strike, 0) * callOI;
    const putPayoff = Math.max(strike - settle, 0) * putOI;
    total += callPayoff + putPayoff;
  }
  return total;
}

/** 计算 Max Pain（卖方总损失最小的行权价） */
function calcMaxPain(chain: StrikeData[]): number {
  let minLoss = Infinity;
  let painStrike = chain[0].strike;
  for (const { strike } of chain) {
    const loss = calcTotalSellerLoss(strike, chain);
    if (loss < minLoss) {
      minLoss = loss;
      painStrike = strike;
    }
  }
  return painStrike;
}

/* ---------- Mini bar chart for OI ---------- */

function OIBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div
      style={{
        height: 8,
        borderRadius: 4,
        background: 'var(--od-border)',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

/* ---------- Loss curve (simple SVG) ---------- */

function LossCurve({
  chain,
  settle,
  maxPain,
}: {
  chain: StrikeData[];
  settle: number;
  maxPain: number;
}) {
  const W = 320;
  const H = 140;
  const PAD = 30;

  // Sample losses across the price range
  const points: { x: number; y: number; price: number }[] = [];
  for (let p = MIN_PRICE; p <= MAX_PRICE; p += 0.5) {
    points.push({ x: p, y: calcTotalSellerLoss(p, chain), price: p });
  }

  const yVals = points.map((p) => p.y);
  const yMin = Math.min(...yVals);
  const yMax = Math.max(...yVals);
  const yRange = yMax - yMin || 1;

  const toSvgX = (price: number) =>
    PAD + ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * (W - 2 * PAD);
  const toSvgY = (y: number) =>
    H - PAD - ((y - yMin) / yRange) * (H - 2 * PAD);

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.price).toFixed(1)} ${toSvgY(p.y).toFixed(1)}`)
    .join(' ');

  // Area fill
  const areaD =
    pathD +
    ` L ${toSvgX(MAX_PRICE).toFixed(1)} ${H - PAD} L ${toSvgX(MIN_PRICE).toFixed(1)} ${H - PAD} Z`;

  const settleX = toSvgX(settle);
  const maxPainX = toSvgX(maxPain);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }}>
      {/* Grid lines */}
      {[MIN_PRICE, (MIN_PRICE + MAX_PRICE) / 2, MAX_PRICE].map((p) => (
        <line
          key={p}
          x1={toSvgX(p)}
          y1={PAD}
          x2={toSvgX(p)}
          y2={H - PAD}
          stroke="var(--od-border)"
          strokeDasharray="3 3"
          strokeWidth={0.5}
        />
      ))}

      {/* Curve area fill */}
      <path d={areaD} fill="url(#lossGrad)" opacity={0.25} />
      <defs>
        <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Loss curve */}
      <path d={pathD} fill="none" stroke="#ef4444" strokeWidth={2} />

      {/* Max Pain marker */}
      <line x1={maxPainX} y1={PAD} x2={maxPainX} y2={H - PAD} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1.5} />
      <text x={maxPainX} y={PAD - 4} textAnchor="middle" fill="#10b981" fontSize={9} fontWeight={700}>
        Max Pain
      </text>

      {/* Settle marker */}
      <line x1={settleX} y1={PAD} x2={settleX} y2={H - PAD} stroke="var(--ifm-color-primary)" strokeWidth={1.5} />
      <text x={settleX} y={H - PAD + 12} textAnchor="middle" fill="var(--ifm-color-primary)" fontSize={9} fontWeight={600}>
        ${settle.toFixed(0)}
      </text>

      {/* Axis labels */}
      <text x={PAD} y={H - 4} fill="var(--ifm-color-foreground-muted, #6b7280)" fontSize={8}>
        ${MIN_PRICE}
      </text>
      <text x={W - PAD} y={H - 4} textAnchor="end" fill="var(--ifm-color-foreground-muted, #6b7280)" fontSize={8}>
        ${MAX_PRICE}
      </text>
    </svg>
  );
}

/* ---------- Main component ---------- */

function MaxPainVisualizerInner() {
  const [settle, setSettle] = useState(100);
  const maxPain = useMemo(() => calcMaxPain(OPTIONS_CHAIN), []);

  const maxOI = Math.max(...OPTIONS_CHAIN.flatMap((s) => [s.callOI, s.putOI]));
  const totalLoss = calcTotalSellerLoss(settle, OPTIONS_CHAIN);
  const maxPainLoss = calcTotalSellerLoss(maxPain, OPTIONS_CHAIN);

  return (
    <div
      style={{
        background: 'var(--od-surface-raised)',
        border: '1px solid var(--od-border)',
        borderRadius: 12,
        padding: '24px 20px',
        margin: '1.5rem 0',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top gradient bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, var(--od-red), var(--ifm-color-primary), var(--od-green))',
          backgroundSize: '200% 100%',
          animation: 'gradientSlide 4s ease-in-out infinite',
        }}
      />

      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>
        Max Pain 交互演示
      </h4>
      <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--ifm-color-foreground-muted, #6b7280)' }}>
        拖动滑块调整假设的到期结算价，观察期权卖方总损失的变化
      </p>

      {/* Options chain table */}
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: '0.82rem',
            border: '1px solid var(--od-border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr>
              <th style={{ background: 'var(--ifm-color-primary)', color: '#fff', padding: '8px 10px', fontWeight: 600, textAlign: 'center' }}>
                Call OI
              </th>
              <th style={{ background: 'var(--ifm-color-primary)', color: '#fff', padding: '8px 10px', fontWeight: 600, textAlign: 'center' }}>
                行权价
              </th>
              <th style={{ background: 'var(--ifm-color-primary)', color: '#fff', padding: '8px 10px', fontWeight: 600, textAlign: 'center' }}>
                Put OI
              </th>
              <th style={{ background: 'var(--ifm-color-primary)', color: '#fff', padding: '8px 10px', fontWeight: 600, textAlign: 'center' }}>
                到期盈亏
              </th>
            </tr>
          </thead>
          <tbody>
            {OPTIONS_CHAIN.map((s) => {
              const callProfit = Math.max(settle - s.strike, 0) * s.callOI;
              const putProfit = Math.max(s.strike - settle, 0) * s.putOI;
              const pnl = callProfit + putProfit;
              const isMaxPain = s.strike === maxPain;

              return (
                <tr
                  key={s.strike}
                  style={{
                    background: isMaxPain ? 'rgba(16, 185, 129, 0.08)' : undefined,
                    transition: 'background 0.3s ease',
                  }}
                >
                  <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--od-border)' }}>
                    <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>{s.callOI.toLocaleString()}</div>
                    <OIBar value={s.callOI} max={maxOI} color="#1e40af" />
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      borderRight: '1px solid var(--od-border)',
                      color: isMaxPain ? '#10b981' : 'var(--ifm-color-foreground)',
                    }}
                  >
                    ${s.strike}
                    {isMaxPain && (
                      <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>Max Pain</div>
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--od-border)' }}>
                    <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>{s.putOI.toLocaleString()}</div>
                    <OIBar value={s.putOI} max={maxOI} color="#dc2626" />
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>
                    <span style={{ color: pnl > 0 ? '#dc2626' : '#10b981' }}>
                      {pnl > 0 ? '+' : ''}${pnl.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
            假设结算价：
            <span style={{ color: 'var(--ifm-color-primary)', fontSize: '1.05rem' }}>${settle}</span>
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--ifm-color-foreground-muted, #6b7280)' }}>
            ${MIN_PRICE} &ndash; ${MAX_PRICE}
          </span>
        </div>
        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={0.5}
          value={settle}
          onChange={(e) => setSettle(parseFloat(e.target.value))}
          style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--ifm-color-primary)' }}
        />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div
          style={{
            flex: '1 1 140px',
            background: 'var(--od-surface)',
            border: '1px solid var(--od-border)',
            borderRadius: 8,
            padding: '12px 14px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--ifm-color-foreground-muted, #6b7280)', marginBottom: 4 }}>
            卖方总损失
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#dc2626' }}>
            ${totalLoss.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            flex: '1 1 140px',
            background: 'var(--od-surface)',
            border: '1px solid var(--od-border)',
            borderRadius: 8,
            padding: '12px 14px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--ifm-color-foreground-muted, #6b7280)', marginBottom: 4 }}>
            Max Pain 价格
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981' }}>
            ${maxPain}
          </div>
        </div>
        <div
          style={{
            flex: '1 1 140px',
            background: 'var(--od-surface)',
            border: '1px solid var(--od-border)',
            borderRadius: 8,
            padding: '12px 14px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--ifm-color-foreground-muted, #6b7280)', marginBottom: 4 }}>
            最小损失
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981' }}>
            ${maxPainLoss.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Loss curve chart */}
      <div
        style={{
          background: 'var(--od-surface)',
          border: '1px solid var(--od-border)',
          borderRadius: 8,
          padding: '14px 10px',
        }}
      >
        <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
          卖方总损失曲线（红色） vs 结算价
        </div>
        <LossCurve chain={OPTIONS_CHAIN} settle={settle} maxPain={maxPain} />
      </div>

      {/* Explanation */}
      <div
        style={{
          marginTop: 16,
          padding: '12px 14px',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 8,
          fontSize: '0.82rem',
          lineHeight: 1.6,
          color: 'var(--ifm-color-foreground)',
        }}
      >
        <strong>什么是 Max Pain？</strong> Max Pain 是使期权买方总收益最小化（即卖方总损失最小化）的到期价格。
        理论上，市场价格在到期前倾向于向 Max Pain 价格收敛，因为期权卖方（通常是做市商）会通过对冲操作推动价格。
        上图中绿色竖线标记的就是 Max Pain 价格 <strong>${maxPain}</strong>，此时卖方总损失最低。
      </div>
    </div>
  );
}

export default function MaxPainVisualizer(): React.JSX.Element {
  return (
    <BrowserOnly fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>加载中...</div>}>
      {() => <MaxPainVisualizerInner />}
    </BrowserOnly>
  );
}
