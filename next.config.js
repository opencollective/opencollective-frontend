require('./env');

const { REWRITES } = require('./rewrites');

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  useFileSystemPublicRoutes: process.env.IS_VERCEL === 'true',
  productionBrowserSourceMaps: true,
  images: {
    disableStaticImages: true,
  },
  webpack: (config, { webpack, isServer, buildId }) => {
    config.plugins.push(
      // Ignore __tests__
      new webpack.IgnorePlugin({ resourceRegExp: /[\\/]__tests__[\\/]/ }),
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
        NEXT_IMAGES_URL: null,
        REST_URL: null,
        SENTRY_DSN: null,
        TW_API_COLLECTIVE_SLUG: null,
        HOST_DASHBOARD_REPORTS: false,
        NEW_ADMIN_DASHBOARD: false,
        WISE_ENVIRONMENT: 'sandbox',
        HCAPTCHA_SITEKEY: false,
        CAPTCHA_ENABLED: true,
        CAPTCHA_PROVIDER: 'HCAPTCHA',
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
      loader: 'html-loader',
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

    // mjs
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    return config;
  },
  async rewrites() {
    return REWRITES;
  },
  async headers() {
    return process.env.IS_VERCEL === 'true'
      ? [
          // Prevent indexing of our Vercel deployments
          {
            source: '/(.*?)',
            headers: [
              {
                key: 'x-robots-tag',
                value: 'none',
              },
            ],
          },
          // Exception for "Next images", if on the configured domain
          {
            source: '/_next/image(.*?)',
            headers: [
              {
                key: 'x-robots-tag',
                value: 'all',
              },
            ],
          },
        ]
      : [];
  },
  async redirects() {
    return [
      // Legacy settings (/edit)
      {
        source: '/:slug/edit/:section*',
        destination: '/:slug/admin/:section*',
        permanent: false,
      },
      {
        source: '/:parentCollectiveSlug/events/:eventSlug/edit/:section*',
        destination: '/:parentCollectiveSlug/events/:eventSlug/admin/:section*',
        permanent: false,
      },
      // Legacy host dashboard (/host/dashboard)
      {
        source: '/:slug/dashboard/:section*',
        destination: '/:slug/admin/:section*',
        permanent: false,
      },
      // Legacy subscriptions
      {
        source: '/subscriptions',
        destination: '/recurring-contributions',
        permanent: false,
      },
      // Legacy support page
      {
        source: '/support',
        destination: '/help',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
