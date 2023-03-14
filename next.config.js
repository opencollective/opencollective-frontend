// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
const { withSentryConfig } = require('@sentry/nextjs');

const path = require('path');
require('./env');
const { REWRITES } = require('./rewrites');

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  useFileSystemPublicRoutes: process.env.IS_VERCEL === 'true' || process.env.API_PROXY !== 'true',
  productionBrowserSourceMaps: true,
  images: {
    disableStaticImages: true,
  },
  webpack: (config, { webpack, buildId }) => {
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
        WISE_ENVIRONMENT: 'sandbox',
        HCAPTCHA_SITEKEY: false,
        CAPTCHA_ENABLED: false,
        CAPTCHA_PROVIDER: 'HCAPTCHA',
        SENTRY_TRACES_SAMPLE_RATE: null,
      }),
    );

    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.SENTRY_RELEASE': JSON.stringify(buildId),
      }),
    );

    if (['ci', 'test', 'development'].includes(process.env.OC_ENV)) {
      // eslint-disable-next-line node/no-unpublished-require
      const CircularDependencyPlugin = require('circular-dependency-plugin');
      config.plugins.push(
        new CircularDependencyPlugin({
          include: /components|pages|server/,
          failOnError: true,
          cwd: process.cwd(),
        }),
      );
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
      test: /\.(jpg|gif|png|svg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/images/',
          outputPath: 'static/images/',
          name: '[name]-[hash].[ext]',
          esModule: false,
        },
      },
      include: [path.resolve(__dirname, 'public')],
    });

    // Configuration for static/marketing pages
    config.module.rules.unshift({
      test: /public[\\/].*\.(html)$/,
      loader: 'html-loader',
      options: {
        esModule: false,
      },
    });

    // Load images in base64
    config.module.rules.push({
      test: /\.(svg|png|jpg|gif)$/,
      use: {
        loader: 'url-loader',
        options: {
          limit: 1000000,
        },
      },
      include: [path.resolve(__dirname, 'components')],
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
        destination: '/manage-contributions',
        permanent: false,
      },
      {
        source: '/:collectiveSlug/paymentmethod/:paymentMethodId/update',
        destination: '/paymentmethod/:paymentMethodId/update',
        permanent: false,
      },
      // Legacy support page
      {
        source: '/support',
        destination: '/help',
        permanent: true,
      },
      // Redirect /hosts to /search page with hosts filter applied
      {
        source: '/hosts',
        destination: '/search?isHost=true',
        permanent: true,
      },
      // Redirect legacy /discover page link to new /search page
      {
        source: '/discover',
        destination: '/search',
        permanent: true,
      },
      // Redirect legacy /create/opensource to new OSC apply flow
      {
        source: '/create/opensource/:step*',
        destination: '/opensource/apply/intro',
        permanent: true,
      },
    ];
  },
};

// Bypasses conflict bug between @sentry/nextjs and depcheck
const isDepcheck = process.argv[1]?.includes('.bin/depcheck');

module.exports = isDepcheck
  ? nextConfig
  : withSentryConfig({
      ...nextConfig,
      sentry: {
        disableServerWebpackPlugin: true,
        disableClientWebpackPlugin: true,
      },
    });
