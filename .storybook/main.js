const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
module.exports = {
  stories: ['../stories/index.stories.mdx', '../stories/**/*.stories.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-designs',
    '@storybook/addon-docs',
    '@storybook/addon-essentials',
    '@storybook/addon-links',
  ],
  webpackFinal: config => {
    // Configuration for images
    config.module.rules.unshift({
      test: /\.(jpg|gif|png|svg)$/,
      use: {
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
          esModule: false,
          context: './public',
          emitFile: false,
        },
      },
    });
    // mjs
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    config.plugins.push(new NodePolyfillPlugin());
    return config;
  },
  staticDirs: ['../public'],
  framework: '@storybook/nextjs',
  docs: {
    autodocs: true,
  },
};
