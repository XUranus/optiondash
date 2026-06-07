import React, { useState, useEffect, useRef, useCallback } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

/* ---------------------------------------------------------------
 *  DataFlowAnimation
 *  交互式动画组件：展示 OptionDash 数据从采集到前端的完整流水线。
 *  每个阶段依次高亮，并配有工具提示说明。
 * --------------------------------------------------------------- */

interface FlowStep {
  id: string;
  label: string;
  icon: string;
  color: string;
  tooltip: string;
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: 'yahoo',
    label: 'Yahoo Finance',
    icon: '\u{1F4CA}',
    color: '#7c3aed',
    tooltip:
      '通过 yfinance 库从 Yahoo Finance 获取期权链数据和行情。速率限制器（rate_limiter）控制请求频率，避免被封禁。',
  },
  {
    id: 'greeks',
    label: 'Greeks 计算',
    icon: '\u{0394}\u{0393}',
    color: '#1e40af',
    tooltip:
      '使用 Black-Scholes 模型计算 Delta、Gamma、Theta、Vega 等希腊字母。py_vollib_vectorized 提供向量化加速。',
  },
  {
    id: 'metrics',
    label: '指标计算',
    icon: '\u{1F4CC}',
    color: '#059669',
    tooltip:
      '并行计算 Max Pain、Put/Call Ratio、Gamma Exposure、隐含波动率等多个市场情绪指标。',
  },
  {
    id: 'cache',
    label: 'Live Cache',
    icon: '\u{1F4BE}',
    color: '#d97706',
    tooltip:
      '计算结果存入实时缓存（TTL 缓存 + SQLite 持久化）。轮询器每 5 分钟刷新一次，确保数据新鲜度。',
  },
  {
    id: 'api',
    label: 'API 响应',
    icon: '{ }',
    color: '#dc2626',
    tooltip:
      'Flask REST API 将缓存数据序列化为 JSON 响应。包含错误处理、CORS 头和速率限制。',
  },
  {
    id: 'frontend',
    label: '前端渲染',
    icon: '\u{1F5A5}',
    color: '#0891b2',
    tooltip:
      'React 前端接收 JSON 数据，通过 ECharts 渲染图表，Ant Design 组件展示指标卡片。',
  },
];

const ARROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.2rem',
  color: 'var(--od-border)',
  flexShrink: 0,
  width: 28,
};

interface StepNodeProps {
  step: FlowStep;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
}

function StepNode({ step, isActive, isPast, onClick }: StepNodeProps) {
  const [showTip, setShowTip] = useState(false);

  const bgColor = isActive
    ? step.color
    : isPast
      ? step.color + '22'
      : 'var(--od-surface-raised)';

  const borderColor = isActive || isPast ? step.color : 'var(--od-border)';
  const textColor = isActive ? '#ffffff' : isPast ? step.color : 'var(--ifm-color-foreground)';

  return (
    <div
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '1 1 0', minWidth: 0 }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      {/* Tooltip */}
      {showTip && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--od-surface)',
            border: '1px solid var(--od-border)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: '0.82rem',
            lineHeight: 1.55,
            width: 240,
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            color: 'var(--ifm-color-foreground)',
          }}
        >
          {step.tooltip}
        </div>
      )}

      {/* Node circle */}
      <div
        onClick={onClick}
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: bgColor,
          border: `2.5px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: step.icon.length <= 3 ? '1.1rem' : '1.5rem',
          fontWeight: 700,
          color: textColor,
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: isActive ? `0 0 20px ${step.color}55` : 'none',
          transform: isActive ? 'scale(1.12)' : 'scale(1)',
          letterSpacing: step.icon.length <= 3 ? '-0.05em' : undefined,
        }}
      >
        {step.icon}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: '0.78rem',
          fontWeight: isActive ? 700 : 500,
          color: isActive ? step.color : 'var(--ifm-color-foreground-muted, #6b7280)',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {step.label}
      </span>
    </div>
  );
}

function DataFlowAnimationInner() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    clearTimer();
    setActiveStep(-1);
    setIsPlaying(true);

    let step = 0;
    const advance = () => {
      setActiveStep(step);
      step++;
      if (step < FLOW_STEPS.length) {
        timerRef.current = setTimeout(advance, 1200);
      } else {
        timerRef.current = setTimeout(() => {
          setActiveStep(FLOW_STEPS.length); // mark all as past
          setIsPlaying(false);
        }, 1200);
      }
    };
    timerRef.current = setTimeout(advance, 300);
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return (
    <div
      style={{
        background: 'var(--od-surface-raised)',
        border: '1px solid var(--od-border)',
        borderRadius: 12,
        padding: '24px 16px 20px',
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
          background: 'linear-gradient(90deg, #7c3aed, #1e40af, #059669, #d97706, #dc2626, #0891b2)',
          backgroundSize: '200% 100%',
          animation: 'gradientSlide 4s ease-in-out infinite',
        }}
      />

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ifm-color-foreground)' }}>
          数据流管线
        </h4>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--ifm-color-foreground-muted, #6b7280)' }}>
          将鼠标悬停在各节点上查看详细说明
        </p>
      </div>

      {/* Flow nodes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          flexWrap: 'wrap',
          padding: '0 8px',
        }}
      >
        {FLOW_STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            {i > 0 && (
              <div style={ARROW_STYLE}>
                <span
                  style={{
                    opacity: i <= activeStep ? 1 : 0.3,
                    color: i <= activeStep ? FLOW_STEPS[i - 1].color : undefined,
                    transition: 'all 0.3s ease',
                  }}
                >
                  &rarr;
                </span>
              </div>
            )}
            <StepNode
              step={step}
              isActive={i === activeStep}
              isPast={i < activeStep || activeStep >= FLOW_STEPS.length}
              onClick={() => {
                clearTimer();
                setActiveStep(i);
                setIsPlaying(false);
              }}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Controls */}
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            background: isPlaying ? 'var(--od-border)' : 'var(--ifm-color-primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 24px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isPlaying ? 0.6 : 1,
          }}
        >
          {isPlaying ? '播放中...' : '▶ 播放动画'}
        </button>
        {!isPlaying && activeStep >= FLOW_STEPS.length && (
          <span style={{ marginLeft: 12, fontSize: '0.82rem', color: 'var(--od-green)' }}>
            ✓ 完整数据流演示结束
          </span>
        )}
      </div>
    </div>
  );
}

export default function DataFlowAnimation(): React.JSX.Element {
  return (
    <BrowserOnly fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>加载中...</div>}>
      {() => <DataFlowAnimationInner />}
    </BrowserOnly>
  );
}
