const mergeWith = require('lodash/mergeWith');
const { kebabCase, omit } = require('lodash');
const env = process.env.OC_ENV;

const SELF = "'self'";
const UNSAFE_INLINE = "'unsafe-inline'";
const UNSAFE_EVAL = "'unsafe-eval'";

const COMMON_DIRECTIVES = {
  blockAllMixedContent: [],
  defaultSrc: [SELF],
  imgSrc: [
    SELF,
    process.env.IMAGES_URL,
    process.env.NEXT_IMAGES_URL,
    'data:',
    '*.paypal.com',
    'opencollective.com', // for widgets on /admin/export
    'blog.opencollective.com', // used to easily link images in static pages
    'blob:', // For upload images previews
  ].filter(Boolean),
  workerSrc: [
    SELF,
    'blob:', // For confettis worker. TODO: Limit for nonce
  ],
  styleSrc: [
    SELF,
    UNSAFE_INLINE, // For styled-components. TODO: Limit for nonce
    'https://hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
  ],
  connectSrc: [
    SELF,
    process.env.API_URL,
    process.env.PDF_SERVICE_URL,
    process.env.REST_URL,
    process.env.ML_SERVICE_URL,
    'wtfismyip.com',
    '*.paypal.com',
    '*.paypalobjects.com',
    'sentry.io',
    '*.sentry.io',
    'atlas.shopifycloud.com',
    'atlas.shopifysvc.com',
    'country-service.shopifycloud.com',
    'maps.googleapis.com',
    'https://wise.com',
    'https://transferwise.com',
    'https://sandbox.transferwise.tech',
    'https://hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
    'https://www.google.com',
    'https://api.cryptonator.com',
    'https://plausible.io',
  ],
  scriptSrc: [
    SELF,
    UNSAFE_INLINE, // Required by current PayPal integration. https://developer.paypal.com/docs/checkout/troubleshoot/support/#browser-features-and-polyfills provides a way to deal with that through nonces.
    "'nonce-__OC_REQUEST_NONCE__'",
    'maps.googleapis.com',
    'js.stripe.com',
    '*.paypal.com',
    '*.paypalobjects.com',
    'https://hcaptcha.com',
    'https://js.hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
    'https://www.google.com',
    'https://plausible.io',
  ],
  frameSrc: [
    'blob:', // For expense invoice previews in the modal, as they're rendered in a blob
    'www.youtube.com',
    'www.youtube-nocookie.com',
    'opencollective.com',
    'anchor.fm',
    'podcasters.spotify.com',
    'player.vimeo.com',
    'js.stripe.com',
    '*.paypal.com',
    '*.openstreetmap.org',
    'https://wise.com',
    'https://transferwise.com',
    'https://sandbox.transferwise.tech',
    'https://hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
    'https://www.google.com',
  ],
  objectSrc: ['opencollective.com'],
};

const generateDirectives = customValues => {
  const toRemove = [];

  const result = mergeWith(COMMON_DIRECTIVES, customValues, (objValue, srcValue, key) => {
    if (typeof srcValue === 'boolean') {
      if (!srcValue) {
        toRemove.push(key);
      }
      return srcValue;
    } else if (Array.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  });

  return omit(result, toRemove);
};

/**
 * A adapter inspired by  https://github.com/helmetjs/helmet/blob/master/middlewares/content-security-policy/index.ts
 * to generate the header string. Useful for plugging to Vercel.
 */
const getHeaderValueFromDirectives = directives => {
  return Object.entries(directives)
    .map(([rawDirectiveName, rawDirectiveValue]) => {
      const directiveName = kebabCase(rawDirectiveName);

      let directiveValue;
      if (typeof rawDirectiveValue === 'string') {
        directiveValue = ` ${rawDirectiveValue}`;
      } else if (Array.isArray(rawDirectiveValue)) {
        directiveValue = rawDirectiveValue.join(' ');
      } else if (typeof rawDirectiveValue === 'boolean' && !rawDirectiveValue) {
        return '';
      }

      if (!directiveValue) {
        return directiveName;
      }

      return `${directiveName} ${directiveValue}`;
    })
    .filter(Boolean)
    .join('; ');
};

/**
 * Get a config compatible with Helmet's format
 */
const getContentSecurityPolicyConfig = () => {
  if (env === 'development' || env === 'e2e') {
    return {
      reportOnly: true,
      directives: generateDirectives({
        blockAllMixedContent: false,
        scriptSrc: [UNSAFE_INLINE, UNSAFE_EVAL], // For NextJS scripts
        imgSrc: [
          'opencollective-staging.s3.us-west-1.amazonaws.com',
          'opencollective-staging.s3-us-west-1.amazonaws.com',
        ],
      }),
    };
  } else if (env === 'staging') {
    return {
      reportOnly: false,
      directives: generateDirectives({
        imgSrc: [
          'opencollective-staging.s3.us-west-1.amazonaws.com',
          'opencollective-staging.s3-us-west-1.amazonaws.com',
        ],
        connectSrc: [
          'opencollective-staging.s3.us-west-1.amazonaws.com',
          'opencollective-staging.s3-us-west-1.amazonaws.com',
        ],
      }),
      reportUri: ['https://o105108.ingest.sentry.io/api/1736806/security/?sentry_key=2ab0f7da3f56423d940f36370df8d625'],
    };
  } else if (env === 'production') {
    return {
      reportOnly: false,
      directives: generateDirectives({
        imgSrc: [
          'opencollective-production.s3.us-west-1.amazonaws.com',
          'opencollective-production.s3-us-west-1.amazonaws.com',
        ],
        connectSrc: [
          'opencollective-production.s3.us-west-1.amazonaws.com',
          'opencollective-production.s3-us-west-1.amazonaws.com',
        ],
      }),
      reportUri: ['https://o105108.ingest.sentry.io/api/1736806/security/?sentry_key=2ab0f7da3f56423d940f36370df8d625'],
    };
  } else if (env === 'test' || env === 'ci') {
    // Disabled
    return false;
  } else {
    // Third party deploy, or Zeit deploy preview
    return {
      reportOnly: true,
      directives: generateDirectives(),
    };
  }
};

module.exports = {
  getContentSecurityPolicyConfig,
  getCSPHeader: () => {
    const config = getContentSecurityPolicyConfig();
    if (config) {
      return {
        key: config.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
        value: getHeaderValueFromDirectives(config.directives),
      };
    }
  },
};
