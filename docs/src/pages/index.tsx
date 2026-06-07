import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

const features: Array<{
  icon: string;
  title: string;
  description: string;
  link: string;
  color: string;
}> = [
  {
    icon: '\u{1F4CA}',
    title: '用户指南',
    description: '从快速入门到各模块详细操作指南，帮助你快速掌握 OptionDash 的全部功能。',
    link: '/guide/dashboard',
    color: '#1e40af',
  },
  {
    icon: '\u{1F9E0}',
    title: '核心概念',
    description: '深入理解期权基础知识：OI、Volume、Max Pain、PCR、Greeks、GEX、波动率与 Skew。',
    link: '/concepts/options-basics',
    color: '#8b5cf6',
  },
  {
    icon: '\u{2699}️',
    title: '系统架构',
    description: '了解前后端架构、数据管道、缓存策略与数据库设计，全面掌握系统内部运作。',
    link: '/architecture/overview',
    color: '#10b981',
  },
  {
    icon: '\u{1F517}',
    title: 'API 参考',
    description: '完整的 REST API 文档，覆盖所有端点的请求参数、返回格式与错误码。',
    link: '/api/overview',
    color: '#f59e0b',
  },
  {
    icon: '\u{1F6E0}️',
    title: '开发指南',
    description: '本地开发环境搭建、代码规范、部署流程与扩展开发指引。',
    link: '/dev/setup',
    color: '#ef4444',
  },
];

function HeroSection(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #0f766e 100%)',
        padding: '5rem 1.5rem 4rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{position: 'relative'}}>
        <Heading as="h1" style={{color: '#fff', fontSize: '3rem', fontWeight: 800, marginBottom: '0.75rem'}}>
          {siteConfig.title}
        </Heading>
        <p style={{color: 'rgba(255,255,255,0.85)', fontSize: '1.25rem', maxWidth: 600, margin: '0 auto 2rem', lineHeight: 1.6}}>
          {siteConfig.tagline}
        </p>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          <Link
            className="button button--primary button--lg"
            to="/getting-started"
            style={{
              backgroundColor: '#10b981',
              borderColor: '#10b981',
              color: '#fff',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            快速开始
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/guide/dashboard"
            style={{
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.4)',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            查看用户指南
          </Link>
        </div>
      </div>
    </header>
  );
}

function FeatureCards(): ReactNode {
  return (
    <section style={{padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto'}}>
      <div style={{textAlign: 'center', marginBottom: '3rem'}}>
        <Heading as="h2" style={{fontSize: '2rem', fontWeight: 700}}>
          文档目录
        </Heading>
        <p style={{color: 'var(--ifm-color-content-secondary)', fontSize: '1.1rem', marginTop: '0.5rem'}}>
          选择你感兴趣的章节开始探索
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {features.map((item, idx) => (
          <Link
            key={idx}
            to={item.link}
            style={{textDecoration: 'none', color: 'inherit'}}
          >
            <div
              className="card"
              style={{
                borderLeft: `4px solid ${item.color}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{fontSize: '2rem'}}>{item.icon}</div>
              <Heading
                as="h3"
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  margin: 0,
                  color: item.color,
                }}
              >
                {item.title}
              </Heading>
              <p style={{margin: 0, lineHeight: 1.6, opacity: 0.8, fontSize: '0.95rem'}}>
                {item.description}
              </p>
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: item.color,
                }}
              >
                查看文档 →;
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Footer(): ReactNode {
  return (
    <section
      style={{
        background: 'var(--ifm-footer-background-color, var(--od-surface-raised))',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        borderTop: '1px solid var(--od-border)',
      }}
    >
      <p style={{opacity: 0.6, fontSize: '0.9rem', margin: 0}}>
        OptionDash — 开源期权链分析平台 · MIT License
      </p>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}
    >
      <HeroSection />
      <main>
        <FeatureCards />
      </main>
      <Footer />
    </Layout>
  );
}
