const mergeWith = require('lodash/mergeWith');
const env = process.env.NODE_ENV;

const SELF = "'self'";
const NONE = "'none'";
const UNSAFE_INLINE = "'unsafe-inline'";

const COMMON_DIRECTIVES = {
  blockAllMixedContent: true,
  defaultSrc: [SELF],
  imgSrc: [SELF, process.env.IMAGES_URL],
  workerSrc: [NONE],
  frameSrc: [
    'https://www.youtube.com',
    'https://opencollective.com/', // For widgets
  ],
};

const generateDirectives = customValues => {
  return mergeWith(COMMON_DIRECTIVES, customValues, (objValue, srcValue) => {
    if (Array.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  });
};

module.exports = () => {
  if (env === 'development') {
    return {
      reportOnly: true,
      directives: generateDirectives({
        blockAllMixedContent: false,
        styleSrc: [UNSAFE_INLINE], // For StyledComponents dev
        scriptSrc: [UNSAFE_INLINE], // For NextJS scripts
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
    }
  }

  // Disable in other environments
  return false;
};
