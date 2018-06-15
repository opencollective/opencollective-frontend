// This file is mostly adapted from:
// https://github.com/zeit/next.js/blob/3949c82bdfe268f841178979800aa8e71bbf412c/examples/with-apollo/lib/initApollo.js

import fetch from 'cross-fetch';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';

import { getGraphqlUrl } from './utils';

let apolloClient = null;

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
});

function createClient(initialState, options = {}) {
  const headers = {};
  if (options.accessToken) {
    headers.authorization = `Bearer ${options.accessToken}`;
  }

  const cache = new InMemoryCache({
    dataIdFromObject: result => `${result.__typename}:${result.id || result.name || result.slug || Math.floor(Math.random()*1000000)}`,
    fragmentMatcher,
  });

  return new ApolloClient({
    connectToDevTools: process.browser,
    ssrMode: !process.browser, // Disables forceFetch on the server (so queries are only run once)
    cache: cache.restore(initialState),
    link: new HttpLink({
      uri: getGraphqlUrl(),
      fetch,
      headers,
    }),
  });
}

export default function initClient(initialState, options = {}) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return createClient(initialState, options);
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    options.accessToken = process.browser && window.localStorage.getItem('accessToken');
    apolloClient = createClient(initialState, options);
  }

  return apolloClient;
}
