import path from 'path';
import glob from 'glob';
import webpack from 'webpack';

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
