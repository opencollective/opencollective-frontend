import ApolloClient, { createNetworkInterface } from 'apollo-client'

let apolloClient = null


let { API_URL, API_KEY } = process.env;
switch (process.env.NODE_ENV) {
  case 'development':
    API_URL = 'http://localhost:3060';
    API_KEY = 'dvl-1510egmf4a23d80342403fb599qd';
    break;
  case 'production':
    API_URL = 'https://opencollective.com/api';
    break;
  case 'staging':
    API_URL = 'https://staging.opencollective.com/api';
    break;
}

const api_key_param = (API_KEY) ? `?api_key=${API_KEY}` : '';
const uri = `${API_URL}/graphql${api_key_param}`;

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
