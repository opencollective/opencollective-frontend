import webpack from 'webpack';
import withCSS from '@zeit/next-css';
import { get } from 'lodash';

const nextConfig = {
  onDemandEntries: {
    // Make sure entries are not getting disposed.
    maxInactiveAge: 1000 * 60 * 60,
  },
  webpack: config => {
    config.plugins.push(
      // Ignore __tests__
      new webpack.IgnorePlugin(/\/__tests__\//),
      // Only include our supported locales
      new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en|fr|es|ja/),
      // Set extra environment variables accessible through process.env.*
      // Will be replaced by webpack by their values!
      new webpack.EnvironmentPlugin({
        API_KEY: null,
        API_URL: 'https://api.opencollective.com',
        DYNAMIC_IMPORT: true,
        USE_PLEDGES: null, // should be unset by default
        WEBSITE_URL: 'https://opencollective.com',
      }),
    );

    if (process.env.WEBPACK_BUNDLE_ANALYZER) {
      // eslint-disable-next-line node/no-unpublished-require
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          generateStatsFile: true,
          openAnalyzer: false,
        }),
      );
    }
    config.module.rules.push({
      test: /\.md$/,
      use: ['babel-loader', 'raw-loader', 'markdown-loader'],
    });

    // Inspired by https://github.com/rohanray/next-fonts
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 8192,
            fallback: 'file-loader',
            publicPath: '/_next/static/fonts/',
            outputPath: 'static/fonts/',
            name: '[name]-[hash].[ext]',
          },
        },
      ],
    });

    // Configuration for static/marketing pages
    config.module.rules.unshift(
      {
        test: /static\/.*\.(html)$/,
        use: {
          loader: 'html-loader',
        },
      },
      {
        test: /static\/.*\.(css)$/,
        use: {
          loader: 'raw-loader',
        },
      },
      {
        test: /static\/.*\.(js)$/,
        use: {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/js/',
            outputPath: 'static/js/',
            name: '[name]-[hash].[ext]',
          },
        },
      },
      {
        test: /static\/.*\.(jpg|gif|png|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/img/',
            outputPath: 'static/img/',
            name: '[name]-[hash].[ext]',
          },
        },
      },
    );

    // Disable the rule forcing react to be bundled in commons chunk
    // Currently needed to skip the react-dom shipped by react-tag-input
    if (get(config, 'optimization.splitChunks.cacheGroups.react')) {
      delete config.optimization.splitChunks.cacheGroups.react;
    }

    return config;
  },
};

module.exports = withCSS(nextConfig);
