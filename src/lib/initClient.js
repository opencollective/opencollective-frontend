import ApolloClient, { createNetworkInterface } from 'apollo-client'

let apolloClient = null


let { REACT_APP_API_URL, REACT_APP_API_KEY } = process.env;
if (process.env.NODE_ENV === 'development') {
  REACT_APP_API_URL = 'http://localhost:3060';
  REACT_APP_API_KEY = 'dvl-1510egmf4a23d80342403fb599qd';
}

console.log("Using API at ", REACT_APP_API_URL);

function createClient (headers) {
  return new ApolloClient({
    ssrMode: !process.browser,
    dataIdFromObject: result => result.id || null,
    networkInterface: createNetworkInterface({
      uri: `${REACT_APP_API_URL}/graphql?api_key=${REACT_APP_API_KEY}`,
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
