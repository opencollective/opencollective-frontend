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
    'data:',
    't.paypal.com',
    'opencollective.com', // for widgets on /edit/export
    'blob:', // For upload images previews
  ],
  workerSrc: [
    SELF,
    'blob:', // For confettis worker. TODO: Limit for nonce
  ],
  styleSrc: [
    SELF,
    UNSAFE_INLINE, // For styled-components. TODO: Limit for nonce
  ],
  connectSrc: [
    SELF,
    process.env.API_URL,
    process.env.PDF_SERVICE_URL,
    'wtfismyip.com',
    '*.paypal.com',
    '*.paypalobjects.com',
    'sentry.io',
    '*.sentry.io',
  ],
  scriptSrc: [
    SELF,
    UNSAFE_INLINE, // Required by current PayPal integration. https://developer.paypal.com/docs/checkout/troubleshoot/support/#browser-features-and-polyfills provides a way to deal with that through nonces.
    'maps.googleapis.com',
    'js.stripe.com',
    '*.paypal.com',
    '*.paypalobjects.com',
  ],
  frameSrc: ['www.youtube.com', 'opencollective.com', 'js.stripe.com', '*.paypal.com', '*.openstreetmap.org'],
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
 * to generate the header string. Usefull for plugging to Zeit.
 */
const getHeaderValueFromDirectives = directives => {
  return Object.entries(directives)
    .map(([rawDirectiveName, rawDirectiveValue]) => {
      const directiveName = kebabCase(rawDirectiveName);

      let directiveValue;
      if (typeof rawDirectiveValue === 'string') {
        directiveValue = ` ${rawDirectiveValue}`;
      } else if (Array.isArray(rawDirectiveValue)) {
        directiveValue = '';
        for (const element of rawDirectiveValue) {
          directiveValue = `${directiveValue} ${element}`;
        }
      } else if (typeof rawDirectiveValue === 'boolean' && !rawDirectiveValue) {
        return '';
      }

      if (!directiveValue) {
        return directiveName;
      }

      return `${directiveName}${directiveValue}`;
    })
    .filter(Boolean)
    .join(';');
};

const getContentSecurityPolicyConfig = () => {
  if (env === 'development' || env === 'e2e') {
    return {
      reportOnly: true,
      directives: generateDirectives({
        blockAllMixedContent: false,
        scriptSrc: [UNSAFE_INLINE, UNSAFE_EVAL], // For NextJS scripts
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
      }),
      reportUri: ['https://o105108.ingest.sentry.io/api/1736806/security/?sentry_key=2ab0f7da3f56423d940f36370df8d625'],
    };
  } else if (env === 'production') {
    return {
      reportOnly: true,
      directives: generateDirectives({
        imgSrc: [
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
  getCSPHeaderForNextJS: () => {
    const config = getContentSecurityPolicyConfig();
    if (config) {
      return {
        key: config.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
        value: getHeaderValueFromDirectives(config.directives),
      };
    }
  },
};
