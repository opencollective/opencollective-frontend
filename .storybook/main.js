const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  stories: ['../stories/index.stories.mdx', '../stories/**/*.stories.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs', '@storybook/addon-essentials', 'storybook-addon-designs'],
  webpackFinal: config => {
    // mjs
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    config.plugins.push(new NodePolyfillPlugin());
    return config;
  },
  core: {
    builder: 'webpack5',
  },
};
