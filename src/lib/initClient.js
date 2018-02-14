import { ApolloClient, createNetworkInterface } from 'react-apollo'
import fetch from 'isomorphic-fetch'

let apolloClient = null

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch
}

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

function createClient (initialState, options = {}) {

  const headers = {};
  if (options.accessToken) {
    headers.authorization = `Bearer ${options.accessToken}`;
  }

  return new ApolloClient({
    ssrMode: !process.browser,
    dataIdFromObject: result => `${result.__typename}:${result.id || result.name || Math.floor(Math.random()*1000000)}`,
    fragmentMatcher,
    initialState,
    shouldBatch: true, // should speed up performance
    networkInterface: createNetworkInterface({
      uri: options.uri,
      opts: {
        credentials: 'same-origin',
        headers
      }
    })
  })
}

export function initClient (initialState, options) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return createClient(initialState, options)
  }

  // Reuse client on the client-side unless we have an access token
  if (!apolloClient) {
    options.accessToken = process.browser && window.localStorage.getItem('accessToken');
    apolloClient = createClient(initialState, options)
  }

  return apolloClient
}