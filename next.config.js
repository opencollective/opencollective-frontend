// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
const { withSentryConfig } = require('@sentry/nextjs');
const CopyPlugin = require('copy-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const path = require('path');
require('./env');
const { REWRITES } = require('./rewrites');

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  useFileSystemPublicRoutes: true,
  productionBrowserSourceMaps: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    disableStaticImages: true,
  },
  experimental: {
    outputFileTracingExcludes: {
      '*': ['node_modules/@swc/core-linux-x64-gnu', 'node_modules/@swc/core-linux-x64-musl'],
    },
    outputFileTracingIncludes: {
      '/_document': ['./.next/language-manifest.json'],
    },
  },
  webpack: (config, { webpack, isServer, dev }) => {
    config.resolve.alias['@sentry/replay'] = false;

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
        ML_SERVICE_URL: null,
        DISABLE_MOCK_UPLOADS: false,
        DYNAMIC_IMPORT: true,
        WEBSITE_URL: null,
        NEXT_IMAGES_URL: null,
        REST_URL: null,
        SENTRY_DSN: null,
        WISE_PLATFORM_COLLECTIVE_SLUG: null,
        WISE_ENVIRONMENT: 'sandbox',
        HCAPTCHA_SITEKEY: false,
        OCF_DUPLICATE_FLOW: false,
        TURNSTILE_SITEKEY: false,
        CAPTCHA_ENABLED: false,
        CAPTCHA_PROVIDER: 'HCAPTCHA',
        SENTRY_TRACES_SAMPLE_RATE: null,
        OC_APPLICATION: null,
        LEDGER_SEPARATE_TAXES_AND_PAYMENT_PROCESSOR_FEES: false,
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

    // Copying cMaps to get non-latin characters to work in PDFs (https://github.com/wojtekmaj/react-pdf#support-for-non-latin-characters)
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'cmaps'),
            to: path.join(__dirname, 'public/static/cmaps'),
          },
        ],
      }),
    );

    // Copy pdfjs worker to public folder (used by PDFViewer component)
    // (Workaround for working with react-pdf and CommonJS - if moving to ESM this can be removed)
    // TODO(ESM): Move this to standard ESM
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: require.resolve('pdfjs-dist/build/pdf.worker.min.js'),
            to: path.join(__dirname, 'public/static/scripts'),
          },
        ],
      }),
    );

    // generates a manifest of languages and the respective webpack chunk url
    config.plugins.push(
      new WebpackManifestPlugin({
        fileName: 'language-manifest.json',
        generate(seed, files) {
          return files.reduce((manifest, file) => {
            const match = file.name.match(/i18n-messages-(.*)-json.js$/);
            if (match) {
              manifest[match[1]] = file.path;
            }
            return manifest;
          }, seed);
        },
        filter(file) {
          return file.isChunk && file.name.match(/^i18n-messages-.*/);
        },
      }),
    );

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

let exportedConfig = withSentryConfig(
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

if (process.env.ANALYZE) {
  // eslint-disable-next-line node/no-unpublished-require
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  });
  exportedConfig = withBundleAnalyzer(exportedConfig);
}

module.exports = exportedConfig;
