import ApolloClient, { createNetworkInterface } from 'apollo-client'

let apolloClient = null

function createClient (options) {
  return new ApolloClient({
    ssrMode: !process.browser,
    dataIdFromObject: result => result.id || null,
    networkInterface: createNetworkInterface({
      uri: options.uri,
      opts: {
        credentials: 'same-origin'
        // Pass options.headers here if your graphql server requires them
      }
    })
  })
}

export const initClient = (options) => {
  if (!process.browser) {
    return createClient(options)
  }
  if (!apolloClient) {
    apolloClient = createClient(options)
  }
  return apolloClient
}
