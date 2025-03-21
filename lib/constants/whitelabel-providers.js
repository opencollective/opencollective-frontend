const env = process.env.OC_ENV || process.env.NODE_ENV || 'development';

/**
 * List of whitelabel providers.
 * @type {Array<{ slug: string, domain: string }>} */
const WHITELABEL_PROVIDERS = [];

// Inject WHITELABEL_DOMAIN for testing purposes
if (['development', 'e2e', 'ci'].includes(env)) {
  WHITELABEL_PROVIDERS.push({
    slug: 'opencollective',
    domain: 'http://local.opencollective:3000',
  });
  if (env === 'development') {
    WHITELABEL_PROVIDERS.push({
      slug: 'opensource',
      domain: 'http://local.osc:3000',
    });
  }
}

const WHITELABEL_DOMAINS = WHITELABEL_PROVIDERS.map(provider => provider.domain);

module.exports = {
  WHITELABEL_PROVIDERS,
  WHITELABEL_DOMAINS,
};
