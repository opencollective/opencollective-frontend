const parseToBooleanDefaultFalse = value => {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  const string = value.toString().trim().toLowerCase();
  return ['on', 'enabled', '1', 'true', 'yes'].includes(string);
};

function getGraphqlUrl(apiVersion) {
  if (process.browser) {
    return `/api/graphql${apiVersion ? `/${apiVersion}` : ''}`;
  }

  const apiKey = process.env.API_KEY;
  const baseApiUrl = process.env.INTERNAL_API_URL || process.env.API_URL;
  return `${baseApiUrl}/graphql${apiVersion ? `/${apiVersion}` : ''}${apiKey ? `?api_key=${apiKey}` : ''}`;
}

module.exports = { parseToBooleanDefaultFalse, getGraphqlUrl };
