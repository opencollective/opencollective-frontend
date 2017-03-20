import ApolloClient, { createNetworkInterface } from 'apollo-client'

let apolloClient = null


let { REACT_APP_API_URL, REACT_APP_API_KEY } = process.env;
switch (process.env.NODE_ENV) {
  case 'development':
    REACT_APP_API_URL = 'http://localhost:3060';
    REACT_APP_API_KEY = 'dvl-1510egmf4a23d80342403fb599qd';
    break;
  case 'production':
    REACT_APP_API_URL = 'https://opencollective.com/api';
    break;
  case 'staging':
    REACT_APP_API_URL = 'https://staging.opencollective.com/api';
    break;
}

const api_key_param = (REACT_APP_API_KEY) ? `?api_key=${REACT_APP_API_KEY}` : '';
const uri = `${REACT_APP_API_URL}/graphql${api_key_param}`;

function createClient (headers) {
  return new ApolloClient({
    ssrMode: !process.browser,
    dataIdFromObject: result => result.id || null,
    networkInterface: createNetworkInterface({
      uri,
      opts: {
        credentials: 'same-origin'
        // Pass headers here if your graphql server requires them
      }
    })
  })
}

export const initClient = (headers) => {
  if (!process.browser) {
    return createClient(headers)
  }
  if (!apolloClient) {
    apolloClient = createClient(headers)
  }
  return apolloClient
}
