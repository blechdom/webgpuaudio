import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const organizationName = "blechdom";
const projectName = "webgpuaudio";

const config: Config = {
  title: 'WebGPU Audio',
  tagline: 'Exploring Audio with WebGPU',
  favicon: 'img/favicon.ico',
  url: `https://${organizationName}.github.io`,
  baseUrl: `/`,
  organizationName: `${organizationName}`, // Usually your GitHub org/user name.
  projectName: `${projectName}`, // Usually your repo name.
  deploymentBranch: 'main', // Deployment branch.
  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  themes: [
    '@docusaurus/theme-live-codeblock',
    async function workerFriendlyTheme() {
      return {
        name: "worker friendly theme",
        configureWebpack(config, isServer) {
          return {
            /*devServer: {
              headers: () => {
                return [
                  {key: 'Cross-Origin-Embedder-Policy', value: 'require-corp'},
                  {key: 'Cross-Origin-Opener-Policy', value: 'same-origin'},
                ];
              }
            },*/
            resolveLoader: {
              alias: isServer ? {"worker-loader": require.resolve("null-loader")} : {},
            },
          };
        },
      };
    }
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: {
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  /*scripts: [
    '/scripts/custom.js'
  ],*/
    plugins: [
      [
        '@docusaurus/plugin-pwa',
        {
          debug: true,
          /*offlineModeActivationStrategies: [
            'appInstalled',
            'standalone',
            'queryString',
          ],*/
          //swRegister: 'coi-serviceworker',
          swCustom: require.resolve('./static/coi-serviceworker.js'),
          swRegister: require.resolve('./static/coi-serviceworker.js'),
           /*
          pwaHead: [
            {
              tagName: 'link',
              rel: 'manifest',
              href: '/manifest.json', // your PWA manifest
            },
          ],*/
        },
      ],
    ],
  themeConfig: {
    image: 'img/tolerance_0.PNG',
    announcementBar: {
      id: 'chromeFlags',
      content: '🚩 Using WebGPU API requires <a href="chrome://flags/#enable-webgpu-developer-features">chrome://flags/#enable-webgpu-developer-features</a> flag to be enabled. Copy/paste the link in your browser, enable the flag, and restart chrome if necessary.',
      backgroundColor: "#F9C80E",
      isCloseable: false
    },
    navbar: {
      title: 'WebGPU Audio',
      logo: {
        alt: 'WebGPU Audio Logo',
        src: 'img/tolerance_0.PNG',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Explorations',
        },
        {
          href: 'https://github.com/blechdom/webgpuaudio',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          items: [
            {
              label: 'Explorations',
              to: '/docs/intro',
            },
          ],
        },
        {
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/blechdom/webgpuaudio',
            },
          ],
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    }
  } satisfies Preset.ThemeConfig,
};

export default config;
