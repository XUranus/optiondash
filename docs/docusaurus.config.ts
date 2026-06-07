import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'OptionDash Wiki',
  tagline: 'Options Chain Analysis & Market Sentiment Platform — Complete Documentation',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://xuranus.github.io',
  baseUrl: '/optiondash/',
  organizationName: 'XUranus',
  projectName: 'optiondash',
  trailingSlash: true,

  onBrokenLinks: 'warn',
  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans', 'en'],
    localeConfigs: {
      'zh-Hans': {
        label: '中文',
        htmlLang: 'zh-Hans',
      },
      en: {
        label: 'English',
        htmlLang: 'en-US',
      },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'OptionDash',
      logo: {
        alt: 'OptionDash Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: '用户指南',
        },
        {
          type: 'docSidebar',
          sidebarId: 'conceptsSidebar',
          position: 'left',
          label: '核心概念',
        },
        {
          type: 'docSidebar',
          sidebarId: 'archSidebar',
          position: 'left',
          label: '系统架构',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API 参考',
        },
        {
          type: 'docSidebar',
          sidebarId: 'devSidebar',
          position: 'left',
          label: '开发指南',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            { label: '快速开始', to: '/getting-started' },
            { label: '用户指南', to: '/guide/dashboard' },
            { label: 'API 参考', to: '/api/overview' },
          ],
        },
        {
          title: '学习',
          items: [
            { label: '期权基础', to: '/concepts/options-basics' },
            { label: '希腊字母', to: '/concepts/greeks' },
            { label: '波动率', to: '/concepts/volatility' },
          ],
        },
        {
          title: '更多',
          items: [
            { label: '系统架构', to: '/architecture/overview' },
            { label: '开发指南', to: '/dev/setup' },
            { label: '部署指南', to: '/dev/deployment' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} OptionDash. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'bash', 'json', 'sql', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
