const mergeWith = require('lodash/mergeWith');
const { kebabCase } = require('lodash');
const env = process.env.NODE_ENV;

const SELF = "'self'";
const UNSAFE_INLINE = "'unsafe-inline'";
const UNSAFE_EVAL = "'unsafe-eval'";

const COMMON_DIRECTIVES = {
  blockAllMixedContent: true,
  defaultSrc: [SELF],
  imgSrc: [SELF, process.env.IMAGES_URL, 'data:', 't.paypal.com'],
  workerSrc: [
    SELF,
    'blob:', // For confettis worker. TODO: Limit for nonce
  ],
  styleSrc: [
    SELF,
    UNSAFE_INLINE, // For styled-components/styled-jsx. TODO: Limit for nonce
  ],
  connectSrc: [
    SELF,
    process.env.API_URL,
    process.env.PDF_SERVICE_URL,
    'wtfismyip.com',
    '*.paypal.com',
    '*.paypalobjects.com',
  ],
  scriptSrc: [
    SELF,
    UNSAFE_INLINE, // Required by current PayPal integration. https://developer.paypal.com/docs/checkout/troubleshoot/support/#browser-features-and-polyfills provides a way to deal with that through nonces.
    'maps.googleapis.com',
    'js.stripe.com',
    '*.paypal.com',
    '*.paypalobjects.com',
  ],
  frameSrc: ['www.youtube.com', 'opencollective.com', 'js.stripe.com', '*.paypal.com'],
  objectSrc: ['opencollective.com'],
};

const generateDirectives = customValues => {
  return mergeWith(COMMON_DIRECTIVES, customValues, (objValue, srcValue) => {
    if (Array.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  });
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
  if (env === 'development') {
    return {
      reportOnly: true,
      directives: generateDirectives({
        blockAllMixedContent: false,
        scriptSrc: [UNSAFE_INLINE, UNSAFE_EVAL], // For NextJS scripts
      }),
    };
  } else if (env === 'production') {
    if (process.env.WEBSITE_URL === 'https://staging.opencollective.com') {
      return {
        reportOnly: true,
        directives: generateDirectives(),
      };
    } else if (process.env.WEBSITE_URL === 'https://opencollective.com') {
      // Disabled for production until ready
      return false;
    } else {
      // Third party deploy, or Zeit deploy preview
      return {
        reportOnly: true,
        directives: generateDirectives(),
      };
    }
  }

  // Disabled in other environments
  return false;
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
