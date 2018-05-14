import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

module.exports = {
  onDemandEntries: {
    // Make sure entries are not getting disposed.
    maxInactiveAge: 1000 * 60 * 60
  },
  webpack: (config) => {
    config.plugins.push(
      // Ignore __tests__
      new webpack.IgnorePlugin(/\/__tests__\//),
      // Only include our supported locales
      new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en|fr|es|ja/),
    );
    if (process.env.WEBPACK_BUNDLE_ANALYZER) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          generateStatsFile: true,
          openAnalyzer: false
        }),
      )
    }
    config.module.rules.push(
      {
        test: /\.css$/,
        use: ['babel-loader', 'raw-loader'],
      }
      ,
      {
        test: /\.md$/,
        use: ['babel-loader', 'raw-loader', 'markdown-loader'],
      }
    )
    return config
  }
};
