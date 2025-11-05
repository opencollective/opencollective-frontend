import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: ['@chromatic-com/storybook', '@storybook/addon-docs', '@storybook/addon-onboarding', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: prop => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  core: {
    disableTelemetry: true,
  },
  viteFinal: async config => {
    // Improve error visibility and debugging
    if (config.server) {
      config.server.hmr = {
        overlay: true, // Show error overlay on HMR errors
      };
    }

    // Better source maps for debugging
    config.build = config.build || {};
    config.build.sourcemap = true;

    // Optimize dependency handling
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include || []),
      'react',
      'react-dom',
      'react-intl',
      'styled-components',
      '@emotion/is-prop-valid',
    ];

    return config;
  },
};
export default config;
