    ╭─────────────────────────────────────────────────────────────────────────╮
     │ OptionDash - 期权链数据分析与市场情绪监控平台                           │
     │                                                                         │
     │ Context                                                                 │
     │                                                                         │
     │ 构建一个轻量级的期权市场分析平台，通过分析期权链的持仓量(OI)、成交量(Vo │
     │ lume)、隐含波动率(IV)及希腊字母(Gamma)，预测标的资产短期走势、支撑阻力  │
     │ 位和市场风险。采用 React + Flask + SQLite                               │
     │ 技术栈，优先使用免费数据源(yfinance)，追求轻量部署和高鲁棒性。          │
     │                                                                         │
     │ ---                                                                     │
     │ Phase 0: 项目骨架搭建 (Day 1)                                           │
     │                                                                         │
     │ 0.1 后端初始化                                                          │
     │                                                                         │
     │ backend/                                                                │
     │ ├── app.py                      # Flask 应用入口，注册蓝图              │
     │ ├── config.py                   # 配置管理                              │
     │ (数据库路径、缓存TTL、支持的ticker列表等)                               │
     │ ├── requirements.txt            # Python 依赖                           │
     │ ├── database/                                                           │
     │ │   ├── __init__.py                                                     │
     │ │   ├── connection.py           # SQLite 连接管理 (线程安全)            │
     │ │   └── schema.sql              # 建表 DDL                              │
     │ ├── api/                        # REST API 蓝图                         │
     │ │   ├── __init__.py                                                     │
     │ │   ├── health.py               # GET /api/health                       │
     │ │   ├── dashboard.py            # 核心指标概览 API                      │
     │ │   ├── comparison.py           # 多标的对比 API                        │
     │ │   ├── strikes.py              # 行权价分析 API                        │
     │ │   └── historical.py           # 历史趋势 API                          │
     │ ├── services/                   # 业务逻辑层                            │
     │ │   ├── __init__.py                                                     │
     │ │   ├── market_data.py          # yfinance 数据获取 + 缓存 + 限速       │
     │ │   ├── greeks_engine.py        # Black-Scholes Greeks 计算引擎         │
     │ │   ├── max_pain.py             # Max Pain 计算                         │
     │ │   ├── pcr.py                  # Put/Call Ratio 计算                   │
     │ │   ├── gex.py                  # Gamma Exposure 计算                   │
     │ │   ├── volatility.py           # IV/HV/VRP/Skew 计算                   │
     │ │   └── anomaly.py              # 异常检测 (OI突增等)                   │
     │ ├── scheduler/                                                          │
     │ │   ├── __init__.py                                                     │
     │ │   └── jobs.py                 # APScheduler 定时任务 (每日快照)       │
     │ └── utils/                                                              │
     │     ├── __init__.py                                                     │
     │     ├── cache.py                # TTL 缓存封装                          │
     │     ├── rate_limiter.py         # 令牌桶限速器                          │
     │     └── helpers.py              # 通用工具函数                          │
     │                                                                         │
     │ 依赖清单 (requirements.txt):                                            │
     │ flask==3.1.*                                                            │
     │ flask-cors==5.*                                                         │
     │ yfinance==0.2.*                                                         │
     │ py_vollib_vectorized==0.1.*                                             │
     │ numpy==1.*                                                              │
     │ pandas==2.*                                                             │
     │ scipy==1.*                                                              │
     │ apscheduler==3.*                                                        │
     │ cachetools==5.*                                                         │
     │                                                                         │
     │ 0.2 前端初始化                                                          │
     │                                                                         │
     │ 使用 Vite + React + TypeScript 创建项目。                               │
     │                                                                         │
     │ frontend/                                                               │
     │ ├── package.json                                                        │
     │ ├── vite.config.ts                                                      │
     │ ├── tsconfig.json                                                       │
     │ ├── tailwind.config.js                                                  │
     │ ├── postcss.config.js                                                   │
     │ ├── index.html                                                          │
     │ ├── public/                                                             │
     │ ├── src/                                                                │
     │ │   ├── main.tsx                # 入口                                  │
     │ │   ├── App.tsx                 # 主布局 + 路由/Tab切换                 │
     │ │   ├── api/                    # API 请求层                            │
     │ │   │   ├── client.ts           # axios 实例 + 拦截器                   │
     │ │   │   ├── dashboard.ts        # Dashboard API 调用                    │
     │ │   │   ├── comparison.ts       # Comparison API 调用                   │
     │ │   │   ├── strikes.ts          # Strikes API 调用                      │
     │ │   │   └── historical.ts       # Historical API 调用                   │
     │ │   ├── components/             # 通用组件                              │
     │ │   │   ├── Layout.tsx          # 页面布局框架                          │
     │ │   │   ├── MetricCard.tsx      # 通用指标卡片                          │
     │ │   │   ├── TickerSelector.tsx  # 标的选择器                            │
     │ │   │   ├── ExpirationPicker.tsx# 到期日选择器                          │
     │ │   │   ├── LoadingCard.tsx     # 加载态卡片                            │
     │ │   │   └── ErrorBoundary.tsx   # 错误边界                              │
     │ │   ├── modules/                # 业务模块                              │
     │ │   │   ├── dashboard/          # 模块1: 核心指标概览                   │
     │ │   │   │   ├── index.tsx                                               │
     │ │   │   │   ├── MaxPainCard.tsx                                         │
     │ │   │   │   ├── PCRCard.tsx                                             │
     │ │   │   │   ├── GEXCard.tsx                                             │
     │ │   │   │   └── SpotPriceCard.tsx                                       │
     │ │   │   ├── comparison/         # 模块2: 多标的对比                     │
     │ │   │   │   ├── index.tsx                                               │
     │ │   │   │   └── ComparisonTable.tsx                                     │
     │ │   │   ├── strikes/            # 模块3: 行权价分析                     │
     │ │   │   │   ├── index.tsx                                               │
     │ │   │   │   ├── OIWallChart.tsx                                         │
     │ │   │   │   ├── MaxPainCurve.tsx                                        │
     │ │   │   │   └── GEXDistribution.tsx                                     │
     │ │   │   └── historical/        # 模块4: 历史趋势                        │
     │ │   │       ├── index.tsx                                               │
     │ │   │       ├── MaxPainVsPrice.tsx                                      │
     │ │   │       ├── PCRGEXChart.tsx                                         │
     │ │   │       ├── VolatilityChart.tsx                                     │
     │ │   │       └── SkewChart.tsx                                           │
     │ │   ├── hooks/                  # 自定义 hooks                          │
     │ │   │   ├── useTickerData.ts    # 通用数据获取 hook                     │
     │ │   │   └── useAutoRefresh.ts   # 自动刷新 hook                         │
     │ │   ├── types/                  # TypeScript 类型定义                   │
     │ │   │   └── index.ts            # 所有接口类型                          │
     │ │   └── utils/                  # 工具函数                              │
     │ │       ├── format.ts           # 数字/日期格式化                       │
     │ │       └── constants.ts        # 常量定义                              │
     │                                                                         │
     │ 前端依赖:                                                               │
     │ {                                                                       │
     │   "dependencies": {                                                     │
     │     "react": "^18",                                                     │
     │     "react-dom": "^18",                                                 │
     │     "antd": "^5",                                                       │
     │     "echarts": "^5",                                                    │
     │     "echarts-for-react": "^3",                                          │
     │     "axios": "^1",                                                      │
     │     "dayjs": "^1"                                                       │
     │   },                                                                    │
     │   "devDependencies": {                                                  │
     │     "typescript": "^5",                                                 │
     │     "tailwindcss": "^3",                                                │
     │     "@types/react": "^18",                                              │
     │     "vite": "^5",                                                       │
     │     "@vitejs/plugin-react": "^4",                                       │
     │     "autoprefixer": "^10",                                              │
     │     "postcss": "^8"                                                     │
     │   }                                                                     │
     │ }                                                                       │
     │                                                                         │
     │ 0.3 数据库 Schema                                                       │
     │                                                                         │
     │ -- 每日聚合快照 (每个 ticker 每天一条)                                  │
     │ CREATE TABLE IF NOT EXISTS daily_snapshots (                            │
     │     id INTEGER PRIMARY KEY AUTOINCREMENT,                               │
     │     date TEXT NOT NULL,               -- YYYY-MM-DD                     │
     │     ticker TEXT NOT NULL,                                               │
     │     spot_price REAL,                                                    │
     │     max_pain REAL,                                                      │
     │     pcr_volume REAL,                  -- 成交量 PCR                     │
     │     pcr_oi REAL,                      -- 持仓量 PCR                     │
     │     gex REAL,                         -- Gamma Exposure (美元)          │
     │     atm_iv REAL,                      -- 平值隐含波动率                 │
     │     hv30 REAL,                        -- 30日历史波动率                 │
     │     vrp REAL,                         -- IV - HV                        │
     │     skew_25d REAL,                    -- 25-Delta 风险逆转              │
     │     total_call_volume INTEGER,                                          │
     │     total_put_volume INTEGER,                                           │
     │     total_call_oi INTEGER,                                              │
     │     total_put_oi INTEGER,                                               │
     │     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                     │
     │     UNIQUE(date, ticker)                                                │
     │ );                                                                      │
     │                                                                         │
     │ -- 行权价级别快照 (用于还原 OI Wall / GEX 分布)                         │
     │ CREATE TABLE IF NOT EXISTS strike_snapshots (                           │
     │     id INTEGER PRIMARY KEY AUTOINCREMENT,                               │
     │     date TEXT NOT NULL,                                                 │
     │     ticker TEXT NOT NULL,                                               │
     │     expiration TEXT NOT NULL,          -- 到期日 YYYY-MM-DD             │
     │     strike REAL NOT NULL,                                               │
     │     call_oi INTEGER DEFAULT 0,                                          │
     │     put_oi INTEGER DEFAULT 0,                                           │
     │     call_volume INTEGER DEFAULT 0,                                      │
     │     put_volume INTEGER DEFAULT 0,                                       │
     │     call_iv REAL,                                                       │
     │     put_iv REAL,                                                        │
     │     call_gamma REAL,                                                    │
     │     put_gamma REAL,                                                     │
     │     call_delta REAL,                                                    │
     │     put_delta REAL,                                                     │
     │     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                     │
     │     UNIQUE(date, ticker, expiration, strike)                            │
     │ );                                                                      │
     │                                                                         │
     │ CREATE INDEX IF NOT EXISTS idx_daily_ticker_date ON                     │
     │ daily_snapshots(ticker, date);                                          │
     │ CREATE INDEX IF NOT EXISTS idx_strike_ticker_date ON                    │
     │ strike_snapshots(ticker, date);                                         │
     │ CREATE INDEX IF NOT EXISTS idx_strike_expiration ON                     │
     │ strike_snapshots(ticker, expiration);                                   │
     │                                                                         │
     │ ---                                                                     │
     │ Phase 1: 核心指标概览模块 (Day 2-4) — 最高优先级                        │
     │                                                                         │
     │ 这是整个平台的基础，构建完整的数据获取→计算→API→展示链路。              │
     │                                                                         │
     │ 1.1 后端服务实现                                                        │
     │                                                                         │
     │ services/market_data.py — 数据获取层 (最关键)                           │
     │ - get_ticker_info(ticker) → 现价、日涨跌幅、52周高低                    │
     │ - get_options_chain(ticker, expiration=None) → 完整期权链 DataFrame     │
     │ - get_expirations(ticker) → 可用到期日列表                              │
     │ - get_historical_prices(ticker, period='90d') → 历史价格序列            │
     │ - 内置 cachetools.TTLCache (300s TTL) 避免重复请求                      │
     │ - 内置令牌桶限速: 最多 2 req/sec 对 yfinance                            │
     │                                                                         │
     │ services/greeks_engine.py — Greeks 计算引擎                             │
     │ - compute_greeks(S, K, T, r, iv, option_type) → delta, gamma, theta,    │
     │ vega                                                                    │
     │ - 使用 py_vollib_vectorized 批量计算整条链的 Greeks                     │
     │ - 对 deep OTM / 接近到期的合约做 try/except 保护 (避免 NaN)             │
     │ - 无风险利率默认取 5.25% (可配置)                                       │
     │                                                                         │
     │ services/max_pain.py — Max Pain 计算                                    │
     │ def calculate_max_pain(chain_calls, chain_puts):                        │
     │     """                                                                 │
     │     对每个可能的结算价格 K:                                             │
     │       total_loss(K) = Σ max(0, K - strike_i) × call_OI_i                │
     │                     + Σ max(0, strike_j - K) × put_OI_j                 │
     │     返回使 total_loss 最小的 K                                          │
     │     """                                                                 │
     │                                                                         │
     │ services/pcr.py — PCR 计算                                              │
     │ def calculate_pcr(chain_calls, chain_puts):                             │
     │     return {                                                            │
     │         "pcr_volume": total_put_vol / total_call_vol,                   │
     │         "pcr_oi": total_put_oi / total_call_oi,                         │
     │         "interpretation": "bullish" | "bearish" | "neutral"             │
     │     }                                                                   │
     │                                                                         │
     │ services/gex.py — GEX 计算                                              │
     │ def calculate_gex(chain_calls, chain_puts, spot_price):                 │
     │     """                                                                 │
     │     GEX = Σ(call_OI × call_gamma × 100 × spot)                          │
     │         - Σ(put_OI × put_gamma × 100 × spot)                            │
     │                                                                         │
     │     做市商通常是期权的卖方:                                             │
     │     - 卖出 Call → 负 Gamma → 对冲时需要同向交易 (放大波动)              │
     │     - 卖出 Put → 正 Gamma → 对冲时需要反向交易 (抑制波动)               │
     │                                                                         │
     │     但从 Dealer 视角:                                                   │
     │     GEX_dealer = -Σ(call_OI × call_gamma) + Σ(put_OI × put_gamma) × 100 │
     │  × spot                                                                 │
     │     """                                                                 │
     │                                                                         │
     │ 1.2 API 端点                                                            │
     │                                                                         │
     │ ┌─────────────────────────────┬──────┬─────────────┬─────────────────── │
     │ ────┐                                                                   │
     │ │            端点             │ 方法 │    参数     │         返回       │
     │     │                                                                   │
     │ ├─────────────────────────────┼──────┼─────────────┼─────────────────── │
     │ ────┤                                                                   │
     │ │ GET /api/health             │ GET  │ -           │ {status,           │
     │ timestamp}   │                                                          │
     │ ├─────────────────────────────┼──────┼─────────────┼─────────────────── │
     │ ────┤                                                                   │
     │ │                             │      │             │ {spot, change,     │
     │     │                                                                   │
     │ │ GET /api/dashboard/summary  │ GET  │ ?ticker=SPY │ max_pain, pcr,     │
     │ gex,   │                                                                │
     │ │                             │      │             │ atm_iv}            │
     │     │                                                                   │
     │ ├─────────────────────────────┼──────┼─────────────┼─────────────────── │
     │ ────┤                                                                   │
     │ │ GET                         │ GET  │ ?ticker=SPY │ {expirations:      │
     │     │                                                                   │
     │ │ /api/dashboard/expirations  │      │             │ ["2026-05-01",     │
     │ ...]}  │                                                                │
     │ └─────────────────────────────┴──────┴─────────────┴─────────────────── │
     │ ────┘                                                                   │
     │                                                                         │
     │ 响应示例 /api/dashboard/summary:                                        │
     │ {                                                                       │
     │   "ticker": "SPY",                                                      │
     │   "spot_price": 542.31,                                                 │
     │   "daily_change": -0.82,                                                │
     │   "daily_change_pct": -0.15,                                            │
     │   "max_pain": 540.0,                                                    │
     │   "deviation_from_max_pain": 2.31,                                      │
     │   "pcr": {                                                              │
     │     "volume": 1.23,                                                     │
     │     "oi": 0.87,                                                         │
     │     "signal": "neutral"                                                 │
     │   },                                                                    │
     │   "gex": {                                                              │
     │     "value": -1010000000,                                               │
     │     "formatted": "-$1.01B",                                             │
     │     "regime": "negative_gamma"                                          │
     │   },                                                                    │
     │   "atm_iv": 0.1845,                                                     │
     │   "expiration_used": "2026-05-01",                                      │
     │   "updated_at": "2026-04-26T15:30:00Z"                                  │
     │ }                                                                       │
     │                                                                         │
     │ 1.3 前端实现                                                            │
     │                                                                         │
     │ - SpotPriceCard: 显示当前价格、日涨跌(红绿色)、偏离 Max Pain 的距离     │
     │ - MaxPainCard: 显示 Max Pain 值、与现价的偏离度、方向箭头               │
     │ - PCRCard: 分别显示成交量 PCR 和持仓量 PCR，带颜色信号 (>1.2 红色看空,  │
     │ <0.7 绿色看多)                                                          │
     │ - GEXCard: 显示 GEX 总值、正/负 Gamma 状态标签、波动预警                │
     │                                                                         │
     │ 卡片使用 Ant Design Card + Statistic 组件，TailwindCSS                  │
     │ 做间距和响应式网格。                                                    │
     │                                                                         │
     │ ---                                                                     │
     │ Phase 2: 行权价分析模块 (Day 5-6)                                       │
     │                                                                         │
     │ 复用 Phase 1 的全部后端服务，主要是图表前端工作。                       │
     │                                                                         │
     │ 2.1 API 端点                                                            │
     │                                                                         │
     │ 端点: GET /api/strikes/oi-wall                                          │
     │ 方法: GET                                                               │
     │ 参数: ?ticker=SPY&expiration=2026-05-01                                 │
     │ 返回: {strikes, call_oi[], put_oi[], spot, max_pain}                    │
     │ ────────────────────────────────────────                                │
     │ 端点: GET /api/strikes/max-pain-curve                                   │
     │ 方法: GET                                                               │
     │ 参数: ?ticker=SPY&expiration=2026-05-01                                 │
     │ 返回: {strikes, total_loss[], max_pain_strike}                          │
     │ ────────────────────────────────────────                                │
     │ 端点: GET /api/strikes/gex-distribution                                 │
     │ 方法: GET                                                               │
     │ 参数: ?ticker=SPY&expiration=2026-05-01                                 │
     │ 返回: {strikes, gex_per_strike[], zero_gamma_line}                      │
     │                                                                         │
     │ 2.2 前端图表                                                            │
     │                                                                         │
     │ OIWallChart (ECharts 双向柱状图):                                       │
     │ - X 轴: 行权价                                                          │
     │ - Y 轴上方: Call OI (绿色柱)                                            │
     │ - Y 轴下方: Put OI (红色柱, 负值显示)                                   │
     │ - markLine: 当前价格 (蓝色虚线)、Max Pain (橙色虚线)                    │
     │ - 点击柱子显示详细数据 tooltip                                          │
     │                                                                         │
     │ MaxPainCurve (ECharts 面积图):                                          │
     │ - X 轴: 行权价                                                          │
     │ - Y 轴: Total Loss at each strike                                       │
     │ - 抛物线形状，谷底标注为 Max Pain                                       │
     │ - markPoint 标注最低点                                                  │
     │                                                                         │
     │ GEXDistribution (ECharts 柱状图):                                       │
     │ - X 轴: 行权价                                                          │
     │ - Y 轴: GEX 净值 (美元)                                                 │
     │ - 正值绿色 (减震区)、负值红色 (波动放大区)                              │
     │ - markLine: Zero Gamma 线、当前价格线                                   │
     │                                                                         │
     │ ---                                                                     │
     │ Phase 3: 多标的横向对比模块 (Day 7-8)                                   │
     │                                                                         │
     │ 3.1 API 端点                                                            │
     │                                                                         │
     │ 端点: GET /api/comparison/overview                                      │
     │ 方法: GET                                                               │
     │ 参数: ?tickers=SPY,QQQ,IWM,TLT,XLF&expiration=nearest                   │
     │ 返回: {data: [{ticker, spot, max_pain, pcr, gex, anomalies}]}           │
     │                                                                         │
     │ 3.2 异常检测逻辑 (services/anomaly.py)                                  │
     │                                                                         │
     │ def detect_anomalies(current_data, historical_avg=None):                │
     │     """                                                                 │
     │     标记异常数据:                                                       │
     │     - OI 单日变化 > 20% → 标记为异动                                    │
     │     - PCR 极端值 (>2.0 或 <0.5)                                         │
     │     - GEX 符号翻转 (正→负 或 负→正)                                     │
     │     - IV 急剧上升 (>2个标准差)                                          │
     │     """                                                                 │
     │                                                                         │
     │ 3.3 前端实现                                                            │
     │                                                                         │
     │ - Ant Design Table 组件展示对比数据                                     │
     │ - 异常值用绿色/红色背景高亮 + 百分比标注                                │
     │ - 支持点击行跳转到该标的的 Dashboard 详情                               │
     │ - 到期日 DatePicker 筛选器                                              │
     │                                                                         │
     │ ---                                                                     │
     │ Phase 4: 历史趋势模块 (Day 9-12) — 最高复杂度                           │
     │                                                                         │
     │ 4.1 后端: 数据持久化 + 定时任务                                         │
     │                                                                         │
     │ scheduler/jobs.py:                                                      │
     │ def daily_snapshot_job():                                               │
     │     """                                                                 │
     │     每交易日收盘后 (美东 16:30) 运行:                                   │
     │     1. 对每个 ticker 获取当日期权链                                     │
     │     2. 计算所有指标 (max_pain, pcr, gex, iv, hv, skew)                  │
     │     3. 存入 daily_snapshots 和 strike_snapshots 表                      │
     │     """                                                                 │
     │                                                                         │
     │ services/volatility.py:                                                 │
     │ def calculate_hv(prices, window=30):                                    │
     │     """HV30 = std(log_returns, 30) × sqrt(252)"""                       │
     │                                                                         │
     │ def calculate_atm_iv(chain, spot):                                      │
     │     """取最接近 ATM 的合约 IV"""                                        │
     │                                                                         │
     │ def calculate_vrp(atm_iv, hv30):                                        │
     │     """VRP = ATM IV - HV30, 正值=期权被高估"""                          │
     │                                                                         │
     │ def calculate_skew_25d(chain, spot):                                    │
     │     """                                                                 │
     │     25-Delta Skew = IV(25Δ Put) - IV(25Δ Call)                          │
     │     需要通过插值找到 delta≈0.25 的合约                                  │
     │     """                                                                 │
     │                                                                         │
     │ 4.2 API 端点                                                            │
     │                                                                         │
     │ ┌──────────────────────────────┬─────┬──────────────────┬────────────── │
     │ ──┐                                                                     │
     │ │             端点             │ 方  │       参数       │      返回     │
     │   │                                                                     │
     │ │                              │ 法  │                  │               │
     │   │                                                                     │
     │ ├──────────────────────────────┼─────┼──────────────────┼────────────── │
     │ ──┤                                                                     │
     │ │ GET /api/historical/max-pain │     │ ?ticker=SPY&days │ {dates[],     │
     │   │                                                                     │
     │ │ -vs-price                    │ GET │ =90              │ prices[],     │
     │   │                                                                     │
     │ │                              │     │                  │ max_pains[]}  │
     │   │                                                                     │
     │ ├──────────────────────────────┼─────┼──────────────────┼────────────── │
     │ ──┤                                                                     │
     │ │ GET /api/historical/pcr-gex  │ GET │ ?ticker=SPY&days │ {dates[],     │
     │   │                                                                     │
     │ │                              │     │ =90              │ pcr[], gex[]} │
     │   │                                                                     │
     │ ├──────────────────────────────┼─────┼──────────────────┼────────────── │
     │ ──┤                                                                     │
     │ │ GET                          │     │ ?ticker=SPY&days │ {dates[],     │
     │   │                                                                     │
     │ │ /api/historical/volatility   │ GET │ =90              │ atm_iv[],     │
     │   │                                                                     │
     │ │                              │     │                  │ hv30[],       │
     │ vrp[]} │                                                                │
     │ ├──────────────────────────────┼─────┼──────────────────┼────────────── │
     │ ──┤                                                                     │
     │ │ GET /api/historical/skew     │ GET │ ?ticker=SPY&days │ {dates[],     │
     │   │                                                                     │
     │ │                              │     │ =90              │ skew_25d[]}   │
     │   │                                                                     │
     │ ├──────────────────────────────┼─────┼──────────────────┼────────────── │
     │ ──┤                                                                     │
     │ │ POST                         │ POS │ {ticker,         │ {status,      │
     │ recor │                                                                 │
     │ │ /api/historical/backfill     │ T   │ start_date}      │ ds_created}   │
     │   │                                                                     │
     │ └──────────────────────────────┴─────┴──────────────────┴────────────── │
     │ ──┘                                                                     │
     │                                                                         │
     │ 4.3 前端图表                                                            │
     │                                                                         │
     │ - MaxPainVsPrice: 双线图，价格线 + Max Pain 线，观察收敛趋势            │
     │ - PCRGEXChart: 双 Y 轴，PCR (左轴线图) + GEX (右轴柱状图)，寻找背离     │
     │ - VolatilityChart: 三线图 ATM IV / HV30 / VRP，标注 VRP 极端区域        │
     │ - SkewChart: 单线 + 异常尖峰标注 (红色区域)                             │
     │                                                                         │
     │ ---                                                                     │
     │ Phase 5: 打磨与文档 (Day 13-14)                                         │
     │                                                                         │
     │ 5.1 增强功能                                                            │
     │                                                                         │
     │ - 前端 Auto-Refresh: 每 5 分钟自动刷新实时数据 (交易时段)               │
     │ - Error Boundary: 单个模块报错不影响其他模块                            │
     │ - Loading 状态: 每个卡片独立 loading skeleton                           │
     │ - 响应式布局: 移动端卡片单列排列                                        │
     │                                                                         │
     │ 5.2 文档                                                                │
     │                                                                         │
     │ docs/                                                                   │
     │ ├── module-dashboard.md          # 模块1文档                            │
     │ ├── module-comparison.md         # 模块2文档                            │
     │ ├── module-strikes.md            # 模块3文档                            │
     │ ├── module-historical.md         # 模块4文档                            │
     │ ├── api-reference.md             # API 完整参考                         │
     │ ├── data-source.md               # 数据源说明                           │
     │ └── deployment.md                # 部署指南                             │
     │                                                                         │
     │ ---                                                                     │
     │ 实施步骤概要                                                            │
     │                                                                         │
     │ Step 1: 初始化项目骨架                                                  │
     │                                                                         │
     │ 1. 创建 backend/ — Flask app, config, database schema, health API       │
     │ 2. 创建 frontend/ — Vite + React + TS + Tailwind + Antd + ECharts       │
     │ 脚手架                                                                  │
     │ 3. 验证: 前后端能分别启动，/api/health 返回 200                         │
     │                                                                         │
     │ Step 2: 构建数据管道                                                    │
     │                                                                         │
     │ 4. 实现 services/market_data.py (yfinance 封装 + 缓存 + 限速)           │
     │ 5. 实现 services/greeks_engine.py (py_vollib 封装)                      │
     │ 6. 验证: 能获取 SPY 期权链并计算 Greeks                                 │
     │                                                                         │
     │ Step 3: 实现核心计算                                                    │
     │                                                                         │
     │ 7. 实现 services/max_pain.py                                            │
     │ 8. 实现 services/pcr.py                                                 │
     │ 9. 实现 services/gex.py                                                 │
     │ 10. 实现 api/dashboard.py 暴露 API                                      │
     │ 11. 验证: API 返回正确的 max_pain/pcr/gex 数据                          │
     │                                                                         │
     │ Step 4: Dashboard 前端                                                  │
     │                                                                         │
     │ 12. 实现通用组件 (Layout, MetricCard, TickerSelector)                   │
     │ 13. 实现 Dashboard 模块 (4 张卡片)                                      │
     │ 14. 验证: 前端能展示 SPY 的实时指标                                     │
     │                                                                         │
     │ Step 5: Strike 分析                                                     │
     │                                                                         │
     │ 15. 实现 api/strikes.py (3 个端点)                                      │
     │ 16. 实现 OIWallChart, MaxPainCurve, GEXDistribution                     │
     │ 17. 验证: 图表正确渲染，交互正常                                        │
     │                                                                         │
     │ Step 6: 多标的对比                                                      │
     │                                                                         │
     │ 18. 实现 services/anomaly.py                                            │
     │ 19. 实现 api/comparison.py                                              │
     │ 20. 实现 ComparisonTable 前端                                           │
     │ 21. 验证: 5 个标的同屏对比，异常高亮                                    │
     │                                                                         │
     │ Step 7: 历史趋势                                                        │
     │                                                                         │
     │ 22. 实现 services/volatility.py (HV, VRP, Skew)                         │
     │ 23. 实现 scheduler/jobs.py (定时快照)                                   │
     │ 24. 实现 api/historical.py (5 个端点)                                   │
     │ 25. 实现 4 个历史趋势图表                                               │
     │ 26. 验证: 定时任务运行正常，历史图表有数据                              │
     │                                                                         │
     │ Step 8: 打磨发布                                                        │
     │                                                                         │
     │ 27. 添加 auto-refresh, error boundary, loading states                   │
     │ 28. 编写模块文档                                                        │
     │ 29. 编写 README.md (安装 + 部署)                                        │
     │ 30. 端到端验证                                                          │
     │                                                                         │
     │ ---                                                                     │
     │ 验证方案                                                                │
     │                                                                         │
     │ 后端验证                                                                │
     │                                                                         │
     │ # 启动后端                                                              │
     │ cd backend && python app.py                                             │
     │                                                                         │
     │ # 健康检查                                                              │
     │ curl http://localhost:5000/api/health                                   │
     │                                                                         │
     │ # Dashboard API                                                         │
     │ curl "http://localhost:5000/api/dashboard/summary?ticker=SPY"           │
     │                                                                         │
     │ # Strikes API                                                           │
     │ curl "http://localhost:5000/api/strikes/oi-wall?ticker=SPY"             │
     │                                                                         │
     │ # Comparison API                                                        │
     │ curl                                                                    │
     │ "http://localhost:5000/api/comparison/overview?tickers=SPY,QQQ,IWM"     │
     │                                                                         │
     │ # Historical API (需要先有快照数据)                                     │
     │ curl                                                                    │
     │ "http://localhost:5000/api/historical/volatility?ticker=SPY&days=30"    │
     │                                                                         │
     │ 前端验证                                                                │
     │                                                                         │
     │ cd frontend && npm run dev                                              │
     │ # 访问 http://localhost:5173                                            │
     │ # 逐个模块检查: Dashboard → Strikes → Comparison → Historical           │
     │                                                                         │
     │ 关键验证点                                                              │
     │                                                                         │
     │ - Max Pain 计算结果与 optionsprofitcalculator.com 交叉验证              │
     │ - PCR 值与 CBOE 公布数据对比                                            │
     │ - GEX 符号正确 (正 Gamma → 做市商抑制波动)                              │
     │ - HV30 与 TradingView 的 HV 指标对比                                    │
     │ - Greeks 计算对 deep OTM 合约不崩溃 (NaN 保护)                          │
     │ - yfinance 限速生效 (不触发 IP 封禁)                                    │
     │ - SQLite 并发写入安全 (WAL 模式)                                        │
     │                                                                         │
     │ ---                                                                     │
     │ 技术风险与应对                                                          │
     │                                                                         │
     │ ┌───────────────────┬───────────────┬────────────────────────────────── │
     │ ──┐                                                                     │
     │ │       风险        │     影响      │                应对               │
     │   │                                                                     │
     │ ├───────────────────┼───────────────┼────────────────────────────────── │
     │ ──┤                                                                     │
     │ │ yfinance          │ 无法获取数据  │ 令牌桶限速 + TTL缓存 +            │
     │   │                                                                     │
     │ │ 被限速/封禁       │               │ 优雅降级返回缓存数据              │
     │   │                                                                     │
     │ ├───────────────────┼───────────────┼────────────────────────────────── │
     │ ──┤                                                                     │
     │ │ py_vollib         │ Greeks        │ try/except 逐合约保护, NaN 置零   │
     │   │                                                                     │
     │ │ 对极端值崩溃      │ 计算失败      │                                   │
     │   │                                                                     │
     │ ├───────────────────┼───────────────┼────────────────────────────────── │
     │ ──┤                                                                     │
     │ │ 25-Delta Skew     │ 指标不准      │ scipy.interpolate 线性/三次插值   │
     │   │                                                                     │
     │ │ 插值精度          │               │                                   │
     │   │                                                                     │
     │ ├───────────────────┼───────────────┼────────────────────────────────── │
     │ ──┤                                                                     │
     │ │ yfinance 无真实历 │ 历史模块冷启  │                                   │
     │ 从部署日起逐日积累，前端提示数据不 │                                    │
     │ │ 史期权数据        │ 动            │ 足                                │
     │   │                                                                     │
     │ ├───────────────────┼───────────────┼────────────────────────────────── │
     │ ──┤                                                                     │
     │ │ SQLite 写入并发   │ 定时任务与    │ 启用 WAL 模式, 写操作加锁         │
     │   │                                                                     │
     │ │                   │ API 冲突      │                                   │
     │   │                                                                     │
     │ └───────────────────┴───────────────┴────────────────────────────────── │
     │ ──┘                                                                     │
     ╰─────────────────────────────────────────────────────────────────────────╯
