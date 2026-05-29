// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
const { withSentryConfig } = require('@sentry/nextjs');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
require('./env');
const { REWRITES } = require('./rewrites');

const useWebpack = process.env.USE_WEBPACK === '1' || process.env.USE_WEBPACK === 'true';
const emptyModule = path.join(__dirname, 'lib/stubs/empty-module.js');

const clientEnv = {
  OC_ENV: process.env.OC_ENV ?? '',
  API_KEY: process.env.API_KEY ?? '',
  API_URL: process.env.API_URL ?? '',
  PDF_SERVICE_URL: process.env.PDF_SERVICE_URL ?? '',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL ?? '',
  DISABLE_MOCK_UPLOADS: String(process.env.DISABLE_MOCK_UPLOADS ?? false),
  DYNAMIC_IMPORT: String(process.env.DYNAMIC_IMPORT ?? true),
  WEBSITE_URL: process.env.WEBSITE_URL ?? '',
  NEXT_IMAGES_URL: process.env.NEXT_IMAGES_URL ?? '',
  REST_URL: process.env.REST_URL ?? '',
  SENTRY_DSN: process.env.SENTRY_DSN ?? '',
  WISE_PLATFORM_COLLECTIVE_SLUG: process.env.WISE_PLATFORM_COLLECTIVE_SLUG ?? '',
  WISE_ENVIRONMENT: process.env.WISE_ENVIRONMENT ?? 'sandbox',
  HCAPTCHA_SITEKEY: String(process.env.HCAPTCHA_SITEKEY ?? false),
  TURNSTILE_SITEKEY: String(process.env.TURNSTILE_SITEKEY ?? false),
  CAPTCHA_ENABLED: String(process.env.CAPTCHA_ENABLED ?? false),
  CAPTCHA_PROVIDER: process.env.CAPTCHA_PROVIDER ?? 'HCAPTCHA',
  SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE ?? '',
  OC_APPLICATION: process.env.OC_APPLICATION ?? '',
  HEROKU_SLUG_COMMIT: process.env.HEROKU_SLUG_COMMIT ?? '',
  LEDGER_SEPARATE_TAXES_AND_PAYMENT_PROCESSOR_FEES: String(
    process.env.LEDGER_SEPARATE_TAXES_AND_PAYMENT_PROCESSOR_FEES ?? false,
  ),
  DISABLE_CONTACT_FORM: String(process.env.DISABLE_CONTACT_FORM ?? false),
  NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE: String(process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE ?? 0),
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  useFileSystemPublicRoutes: true,
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  env: clientEnv,
  compiler: {
    styledComponents: {
      displayName: ['ci', 'test', 'development', 'e2e'].includes(process.env.OC_ENV),
    },
  },
  images: {
    disableStaticImages: true,
  },
  experimental: {
    turbopackMinify: !['ci', 'e2e'].includes(process.env.OC_ENV),
    turbopackSourceMaps: true,
  },
  turbopack: {
    resolveAlias: {
      '@sentry/replay': emptyModule,
      canvas: emptyModule,
    },
    rules: {
      '*.md': {
        loaders: ['raw-loader', 'markdown-loader'],
        as: '*.js',
      },
    },
  },
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/canvas/build', // https://github.com/wojtekmaj/react-pdf/issues/1504#issuecomment-2007090872
    ],
  },
  allowedDevOrigins: ['localhost', '127.0.0.1', '::1', '*.ngrok-free.dev'],
  webpack: (config, { webpack, isServer, dev }) => {
    if (!useWebpack) {
      return config;
    }

    config.resolve.alias['@sentry/replay'] = false;
    config.resolve.alias['canvas'] = false; // https://github.com/wojtekmaj/react-pdf?tab=readme-ov-file#nextjs
    if (typeof config.cache !== 'boolean') {
      config.cache = {};
    }
    config.cache.type = 'filesystem';
    config.cache.compression = 'brotli';

    config.plugins.push(
      // Ignore __tests__
      new webpack.IgnorePlugin({ resourceRegExp: /[\\/]__tests__[\\/]/ }),
      // Set extra environment variables accessible through process.env.*
      // Will be replaced by webpack by their values!
      new webpack.EnvironmentPlugin(clientEnv),
    );

    if (['ci', 'test', 'development'].includes(process.env.OC_ENV)) {
      const CircularDependencyPlugin = require('circular-dependency-plugin');
      config.plugins.push(
        new CircularDependencyPlugin({
          include: /components|pages|server/,
          failOnError: true,
          cwd: process.cwd(),
          exclude: /node_modules/,
        }),
      );
    }

    if (!dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'globalThis.__DEV__': false,
        }),
      );
    }

    // Copying cMaps to get non-latin characters to work in PDFs (https://github.com/wojtekmaj/react-pdf#support-for-non-latin-characters)
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            // eslint-disable-next-line n/no-extraneous-require
            from: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'cmaps'),
            to: path.join(__dirname, 'public/static/cmaps'),
          },
          {
            // eslint-disable-next-line n/no-extraneous-require
            from: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'build/pdf.worker.min.mjs'),
            to: path.join(__dirname, 'public/static/scripts/pdf.worker.min.mjs'),
            info: { minimized: true },
          },
        ],
      }),
    );

    // Put the Codecov webpack plugin after all other plugins
    if (['ci', 'e2e'].includes(process.env.OC_ENV)) {
      const { codecovWebpackPlugin } = require('@codecov/webpack-plugin');
      config.plugins.push(
        codecovWebpackPlugin({
          enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
          bundleName: 'opencollective-frontend',
          uploadToken: process.env.CODECOV_TOKEN,
        }),
      );
    }

    config.module.rules.push({
      test: /\.md$/,
      use: ['raw-loader', 'markdown-loader'],
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

    if (['ci', 'e2e'].includes(process.env.OC_ENV)) {
      config.optimization.minimize = false;
    }

    // mjs
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    if (!isServer && !dev) {
      config.optimization.splitChunks.cacheGroups.appCommon = {
        name: 'appCommon',
        chunks(chunk) {
          return chunk.name === 'pages/_app';
        },
        test(module) {
          return /node_modules[/\\]/.test(module.nameForCondition() || '');
        },
        enforce: true,
      };
    }

    return config;
  },
  async rewrites() {
    return REWRITES;
  },
  async headers() {
    return [
      // Prevent indexing of non-production deployments
      {
        source: '/(.*?)',
        headers: [
          {
            key: 'x-robots-tag',
            value: 'none',
          },
        ],
        missing: [
          {
            type: 'header',
            key: 'host',
            value: 'opencollective.com',
          },
          {
            type: 'header',
            key: 'original-hostname',
            value: 'opencollective.com',
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
        has: [
          {
            type: 'header',
            key: 'host',
            value: 'next-images.opencollective.com',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy settings (/edit)
      {
        source: '/:slug/edit/:section*',
        destination: '/dashboard/:slug/:section*',
        permanent: false,
      },
      {
        source: '/:parentCollectiveSlug/events/:eventSlug/edit/:section*',
        destination: '/dashboard/:eventSlug/:section*',
        permanent: false,
      },
      // Legacy host dashboard (/host/dashboard)
      {
        source: '/:slug/dashboard/:section*',
        destination: '/dashboard/:slug/:section*',
        permanent: false,
      },
      // Legacy admin panel
      {
        source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:slug/admin/:section?/:subpath*',
        destination: '/dashboard/:slug/:section*/:subpath*',
        permanent: false,
      },
      // Legacy manage subscriptions URLs
      {
        source: '/subscriptions',
        destination: '/dashboard/me/outgoing-contributions',
        permanent: false,
      },
      {
        source: '/:slug/subscriptions',
        destination: '/dashboard/:slug/outgoing-contributions',
        permanent: false,
      },
      {
        source: '/:slug/recurring-contributions/:tab(recurring|processing)?',
        destination: '/dashboard/:slug/outgoing-contributions',
        permanent: false,
      },
      {
        source: '/manage-contributions/:tab(recurring|processing)?',
        destination: '/dashboard/me/outgoing-contributions',
        permanent: false,
      },
      {
        source: '/:slug/manage-contributions/:tab(recurring|processing)?',
        destination: '/dashboard/:slug/outgoing-contributions',
        permanent: false,
      },
      // Update payment method page
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

let exportedConfig = nextConfig;

if (process.env.SENTRY_AUTH_TOKEN) {
  exportedConfig = withSentryConfig(
    {
      ...nextConfig,
      sentry: {
        hideSourceMaps: true,
      },
    },
    {
      org: 'open-collective',
      project: 'oc-frontend',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
    },
  );
} else if (process.env.OC_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.warn('[!!! WARNING !!!] SENTRY_AUTH_TOKEN not found. Skipping Sentry configuration.');
}

if (process.env.ANALYZE) {
  if (useWebpack) {
    const withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
    exportedConfig = withBundleAnalyzer(exportedConfig);
  } else {
    // eslint-disable-next-line no-console
    console.warn('[ANALYZE] Bundle analyzer requires USE_WEBPACK=1.');
  }
}

module.exports = exportedConfig;
