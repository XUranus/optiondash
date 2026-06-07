import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guideSidebar: [
    'getting-started',
    {
      type: 'category',
      label: '用户指南',
      collapsed: false,
      items: [
        'guide/dashboard',
        'guide/strikes',
        'guide/comparison',
        'guide/historical',
        'guide/macro',
      ],
    },
  ],
  conceptsSidebar: [
    {
      type: 'category',
      label: '核心概念',
      collapsed: false,
      items: [
        'concepts/options-basics',
        'concepts/open-interest',
        'concepts/max-pain',
        'concepts/pcr',
        'concepts/greeks',
        'concepts/gex',
        'concepts/volatility',
        'concepts/skew',
      ],
    },
  ],
  archSidebar: [
    {
      type: 'category',
      label: '系统架构',
      collapsed: false,
      items: [
        'architecture/overview',
        'architecture/backend',
        'architecture/frontend',
        'architecture/data-pipeline',
        'architecture/caching',
        'architecture/database',
      ],
    },
  ],
  apiSidebar: [
    {
      type: 'category',
      label: 'API 参考',
      collapsed: false,
      items: [
        'api/overview',
        'api/dashboard',
        'api/strikes',
        'api/comparison',
        'api/historical',
        'api/macro',
        'api/errors',
      ],
    },
  ],
  devSidebar: [
    {
      type: 'category',
      label: '开发指南',
      collapsed: false,
      items: [
        'dev/setup',
        'dev/backend',
        'dev/frontend',
        'dev/deployment',
      ],
    },
  ],
};

export default sidebars;
