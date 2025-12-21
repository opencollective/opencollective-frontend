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
const { default: supportedLanguages } = require('./lib/i18n/supported-languages');

const isHeroku = process.env.IS_HEROKU === 'true';

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  useFileSystemPublicRoutes: true,
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    styledComponents: {
      displayName: ['ci', 'test', 'development', 'e2e'].includes(process.env.OC_ENV),
    },
  },
  images: {
    disableStaticImages: true,
    unoptimized: isHeroku, // See https://github.com/vercel/next.js/issues/54482. Should try to remove after updating to NextJS 15.
  },
  outputFileTracingIncludes: {
    '/_document': ['./.next/language-manifest.json'],
  },
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/canvas/build', // https://github.com/wojtekmaj/react-pdf/issues/1504#issuecomment-2007090872
    ],
  },
  turbopack: {
    rules: {
      '*.md': {
        loaders: ['raw-loader', 'markdown-loader'],
        as: '*.js',
      },
    },
  },
  webpack: (config, { webpack, isServer, dev }) => {
    // NOTE: The following webpack configuration has been partially migrated to turbopack:
    // - Resolve aliases: Moved to turbopack.resolveAlias
    // - .md loader: Moved to turbopack.rules
    //
    // The following webpack-specific features cannot be migrated to turbopack:
    // - Plugins: IgnorePlugin, ContextReplacementPlugin, EnvironmentPlugin, CircularDependencyPlugin,
    //   DefinePlugin, CopyPlugin, WebpackManifestPlugin, codecovWebpackPlugin
    // - Asset loaders: file-loader, url-loader, html-loader (Turbopack handles assets differently)
    // - Custom module rules for images, HTML, and .mjs files
    // - Optimization split chunks configuration
    //

    // TODO: Didn't find a way to migrate this to turbopack yet, there's a potential solution if we migrate to swc: https://www.apollographql.com/docs/react/development-testing/reducing-bundle-size
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
  // Transfer public environment variables
  env: {
    PORT: process.env.PORT ?? 3000,
    HOSTNAME: process.env.HOSTNAME ?? 'localhost',
    API_KEY: process.env.API_KEY ?? '09u624Pc9F47zoGLlkg1TBSbOl2ydSAq',
    API_URL: process.env.API_URL ?? 'https://api-staging.opencollective.com',
    IMAGES_URL: process.env.IMAGES_URL ?? 'https://images-staging.opencollective.com',
    WEBSITE_URL: process.env.WEBSITE_URL ?? 'http://localhost:3000',
    REST_URL: process.env.REST_URL ?? 'https://rest-staging.opencollective.com',
    PDF_SERVICE_URL: process.env.PDF_SERVICE_URL ?? 'https://pdf-staging.opencollective.com',
    ML_SERVICE_URL: process.env.ML_SERVICE_URL ?? 'https://ml.opencollective.com',
    DISABLE_MOCK_UPLOADS: process.env.DISABLE_MOCK_UPLOADS ?? false,
    PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT ?? 'sandbox',
    STRIPE_KEY: process.env.STRIPE_KEY ?? 'pk_test_VgSB4VSg2wb5LdAkz7p38Gw8',
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? 'AIzaSyAZJnIxtBw5bxnu2QoCUiLCjV1nk84Vnk0',
    RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY ?? '6LcyeXoUAAAAAFtdHDZfsxncFUkD9NqydqbIFcCK',
    HCAPTCHA_SITEKEY: process.env.HCAPTCHA_SITEKEY ?? '10000000-ffff-ffff-ffff-000000000001',
    TURNSTILE_SITEKEY: process.env.TURNSTILE_SITEKEY ?? '0x4AAAAAAAS6okaJ_ThVJqYq',
    CAPTCHA_ENABLED: process.env.CAPTCHA_ENABLED ?? false,
    CAPTCHA_PROVIDER: process.env.CAPTCHA_PROVIDER ?? 'HCAPTCHA',
    CLIENT_ANALYTICS_ENABLED: process.env.CLIENT_ANALYTICS_ENABLED ?? false,
    CLIENT_ANALYTICS_DOMAIN: process.env.CLIENT_ANALYTICS_DOMAIN ?? 'localhost',
    CLIENT_ANALYTICS_EXCLUSIONS:
      process.env.CLIENT_ANALYTICS_EXCLUSIONS ?? '/**/banner.html, /**/contribute/button, /**/donate/button',
    WISE_PLATFORM_COLLECTIVE_SLUG: process.env.WISE_PLATFORM_COLLECTIVE_SLUG ?? 'opencollective-host',
    OC_APPLICATION: process.env.OC_APPLICATION ?? 'frontend',
    OC_ENV: process.env.OC_ENV ?? 'development',
    OC_SECRET: process.env.OC_SECRET ?? crypto.randomBytes(16).toString('hex'),
    WISE_ENVIRONMENT: process.env.WISE_ENVIRONMENT ?? 'sandbox',
    API_PROXY: process.env.API_PROXY ?? true,
    SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE ?? null,
    LEDGER_SEPARATE_TAXES_AND_PAYMENT_PROCESSOR_FEES:
      process.env.LEDGER_SEPARATE_TAXES_AND_PAYMENT_PROCESSOR_FEES ?? false,
    DISABLE_CONTACT_FORM: process.env.DISABLE_CONTACT_FORM ?? false,
    NEW_PRICING: process.env.NEW_PRICING ?? false,
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
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  });
  exportedConfig = withBundleAnalyzer(exportedConfig);
}

module.exports = exportedConfig;
