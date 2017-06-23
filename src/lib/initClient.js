import ApolloClient, { createNetworkInterface } from 'apollo-client'

let apolloClient = null

function createClient (initialState, options) {

  const headers = {};
  if (options.accessToken) {
    headers.authorization = `Bearer ${options.accessToken}`;
  }

  return new ApolloClient({
    ssrMode: !process.browser,
    dataIdFromObject: result => `${result.__typename}#${result.id}` || null,
    initialState,
    networkInterface: createNetworkInterface({
      uri: options.uri,
      opts: {
        credentials: 'same-origin',
        headers
        // Pass options.headers here if your graphql server requires them
      }
    })
  })
}

export const initClient = (initialState, options) => {
  if (!process.browser) {
    return createClient(initialState, options)
  }
  if (!apolloClient) {
    if (window.localStorage) {
      options.accessToken = window.localStorage.getItem('accessToken');
    }
    console.log("creating client with options", options);
    apolloClient = createClient(initialState, options)
  }
  return apolloClient
}
