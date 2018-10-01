import webpack from 'webpack';
import withCSS from '@zeit/next-css';

module.exports = withCSS({
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
        DYNAMIC_IMPORT: true,
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
    return config;
  },
});
