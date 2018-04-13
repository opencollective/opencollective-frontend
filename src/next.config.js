
import path from 'path';
import glob from 'glob';
import webpack from 'webpack';
module.exports = {
    onDemandEntries: {
      // Make sure entries are not getting disposed.
      maxInactiveAge: 1000 * 60 * 60
    },
    webpack: (config, { dev }) => {
    config.plugins.push(
      new webpack.IgnorePlugin(/react\/addons/),
      new webpack.IgnorePlugin(/react\/lib\/ExecutionEnvironment/),
      new webpack.IgnorePlugin(/react\/lib\/ReactContext/)
    );
    config.module.rules.push(
      {
        test: /\.(css|scss|md)/,
        loader: 'emit-file-loader',
        options: {
          name: 'dist/[path][name].[ext]'
        }
      }
    ,
      {
        test: /\.css$/,
        use: ['babel-loader', 'raw-loader', 'postcss-loader']
      }
    ,
      {
        test: /\.md$/,
        use: ['babel-loader', 'raw-loader',
          { loader: 'markdown-loader',
            options: {
              includePaths: ['markdown', 'node_modules']
                .map((d) => path.join(__dirname, d))
                .map((g) => glob.sync(g))
                .reduce((a, c) => a.concat(c), [])
            }
          }
        ]

      }
    ,
      {
        test: /\.s(a|c)ss$/,
        use: ['babel-loader', 'raw-loader', 'postcss-loader',
          { loader: 'sass-loader',
            options: {
              includePaths: ['styles', 'node_modules']
                .map((d) => path.join(__dirname, d))
                .map((g) => glob.sync(g))
                .reduce((a, c) => a.concat(c), [])
            }
          }
        ]
      }
    )
    return config
  }
}
