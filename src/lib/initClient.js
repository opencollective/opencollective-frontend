import ApolloClient, { createNetworkInterface } from 'apollo-client'

let apolloClient = null

function createClient (initialState, options) {
  return new ApolloClient({
    ssrMode: !process.browser,
    dataIdFromObject: result => result.id || null,
    initialState,
    networkInterface: createNetworkInterface({
      uri: options.uri,
      opts: {
        credentials: 'same-origin'
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
    apolloClient = createClient(initialState, options)
  }
  return apolloClient
}
