require('./env');

const withSourceMaps = require('@zeit/next-source-maps')();
const { getCSPHeaderForNextJS } = require('./server/content-security-policy');
const { REWRITES } = require('./rewrites');

const nextConfig = {
  webpack: (config, { webpack, isServer, buildId }) => {
    config.plugins.push(
      // Ignore __tests__
      new webpack.IgnorePlugin(/[\\/]__tests__[\\/]/),
      // Only include our supported locales
      new webpack.ContextReplacementPlugin(/moment[\\/]locale$/, /en|fr|es|ja/),
      // Set extra environment variables accessible through process.env.*
      // Will be replaced by webpack by their values!
      new webpack.EnvironmentPlugin({
        OC_ENV: null,
        API_KEY: null,
        API_URL: null,
        PDF_SERVICE_URL: null,
        DYNAMIC_IMPORT: true,
        WEBSITE_URL: null,
        SENTRY_DSN: null,
        ONBOARDING_MODAL: true,
        NEW_HOST_APPLICATION_FLOW: null,
        TW_API_COLLECTIVE_SLUG: null,
        REJECT_CONTRIBUTION: false,
        REJECTED_CATEGORIES: false,
      }),
    );

    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.SENTRY_RELEASE': JSON.stringify(buildId),
      }),
    );

    // XXX See https://github.com/zeit/next.js/blob/canary/examples/with-sentry-simple/next.config.js
    // In `pages/_app.js`, Sentry is imported from @sentry/node. While
    // @sentry/browser will run in a Node.js environment, @sentry/node will use
    // Node.js-only APIs to catch even more unhandled exceptions.
    //
    // This works well when Next.js is SSRing your page on a server with
    // Node.js, but it is not what we want when your client-side bundle is being
    // executed by a browser.
    //
    // Luckily, Next.js will call this webpack function twice, once for the
    // server and once for the client. Read more:
    // https://nextjs.org/docs#customizing-webpack-config
    //
    // So ask Webpack to replace @sentry/node imports with @sentry/browser when
    // building the browser's bundle
    if (!isServer) {
      config.resolve.alias['@sentry/node'] = '@sentry/browser';
    }

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

    // Configuration for images
    config.module.rules.unshift({
      test: /public\/.*\/images[\\/].*\.(jpg|gif|png|svg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/images/',
          outputPath: 'static/images/',
          name: '[name]-[hash].[ext]',
          esModule: false,
        },
      },
    });

    // Configuration for static/marketing pages
    config.module.rules.unshift({
      test: /public[\\/].*\.(html)$/,
      use: {
        loader: 'html-loader',
      },
    });

    // Load images in base64
    config.module.rules.push({
      test: /components\/.*\.(svg|png|jpg|gif)$/,
      use: {
        loader: 'url-loader',
        options: {
          limit: 1000000,
        },
      },
    });

    if (['ci', 'e2e'].includes(process.env.OC_ENV)) {
      config.optimization.minimize = false;
    }

    return config;
  },
  async headers() {
    const cspHeader = getCSPHeaderForNextJS();
    if (cspHeader) {
      return [{ source: '/', headers: [cspHeader] }];
    } else {
      return [];
    }
  },

  async rewrites() {
    return REWRITES;
  },

  defaultLocale: 'en-US',
};

module.exports = withSourceMaps(nextConfig);
