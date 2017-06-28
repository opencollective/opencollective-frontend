import ApolloClient, { createNetworkInterface } from 'apollo-client'
import { IntrospectionFragmentMatcher } from 'react-apollo';
const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData: {
    __schema: {
      types: [
        {
          kind: "INTERFACE",
          name: "Transaction",
          possibleTypes: [
            { name: "Expense" },
            { name: "Donation" },
          ],
        }
      ],
    },
  }
})
let apolloClient = null

function createClient (initialState, options) {

  const headers = {};
  if (options.accessToken) {
    headers.authorization = `Bearer ${options.accessToken}`;
  }

  return new ApolloClient({
    ssrMode: !process.browser,
    dataIdFromObject: result => `${result.__typename}#${result.id || result.name}` || null,
    fragmentMatcher,
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
    apolloClient = createClient(initialState, options)
  }
  return apolloClient
}
