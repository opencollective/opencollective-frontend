// This file is mostly adapted from:
// https://github.com/zeit/next.js/blob/3949c82bdfe268f841178979800aa8e71bbf412c/examples/with-apollo/lib/initApollo.js

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from './local-storage';

let apolloClient, customAgent;

const getBaseApiUrl = () => {
  if (process.browser) {
    return '/api';
  }

  return process.env.INTERNAL_API_URL || process.env.API_URL || 'https://api.opencollective.com';
};

/**
 * Returns the GraphQL api url for the appropriate api version and environment.
 * @param {string} version - api version. Defaults to v1.
 * @returns {string} GraphQL api url.
 */
const getGraphqlUrl = apiVersion => {
  const apiKey = !process.browser ? process.env.API_KEY : null;
  return `${getBaseApiUrl()}/graphql${apiVersion ? `/${apiVersion}` : ''}${apiKey ? `?api_key=${apiKey}` : ''}`;
};

const getCustomAgent = () => {
  if (!customAgent) {
    const http = require('http');
    const https = require('https');
    const httpAgent = new http.Agent({ keepAlive: true });
    const httpsAgent = new https.Agent({ keepAlive: true });
    customAgent = _parsedURL => (_parsedURL.protocol == 'http:' ? httpAgent : httpsAgent);
  }
  return customAgent;
};

const serverSideFetch = async (url, options = {}) => {
  options.agent = getCustomAgent();

  // Add headers to help the API identify origin of requests
  options.headers = options.headers || {};
  options.headers['oc-env'] = process.env.OC_ENV;
  options.headers['oc-secret'] = process.env.OC_SECRET;
  options.headers['oc-application'] = process.env.OC_APPLICATION;
  options.headers['user-agent'] = 'opencollective-frontend/1.0 node-fetch/1.0';

  // Start benchmarking if the request is server side
  const start = process.hrtime.bigint();

  const result = await fetch(url, options);

  // Complete benchmark measure and log
  if (start && process.env.GRAPHQL_BENCHMARK) {
    const end = process.hrtime.bigint();
    const body = JSON.parse(options.body);
    if (body.operationName || body.variables) {
      console.log(
        '-> Fetched',
        body.operationName || 'anonymous GraphQL query',
        body.variables || {},
        `in ${Math.round(Number(end - start) / 1000000)}ms`,
      );
    }
  }

  return result;
};

function createLink({ graphqlUrl } = {}) {
  const authLink = setContext((_, { headers }) => {
    const token = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${token}`,
        },
      };
    }
  });

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.map(error => {
        if (error) {
          const { message, locations, path } = error;
          console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
          return;
        }

        console.error('[GraphQL error]: Received null error');
      });
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
    }
  });

  const apiV1Link = new HttpLink({
    uri: graphqlUrl || getGraphqlUrl('v1'),
    fetch: process.browser ? fetch : serverSideFetch,
  });
  const apiV2Link = new HttpLink({
    uri: graphqlUrl || getGraphqlUrl('v2'),
    fetch: process.browser ? fetch : serverSideFetch,
  });

  /** Depending on the value of the context.apiVersion we choose to use the link for the api
   * v1 or the api v2.
   */
  const httpLink = ApolloLink.split(
    operation => operation.getContext().apiVersion === '2', // Routes the query to the proper client
    apiV2Link,
    apiV1Link,
  );

  return ApolloLink.from([errorLink, authLink, httpLink]);
}

function createInMemoryCache() {
  const inMemoryCache = new InMemoryCache({
    // Documentation:
    // https://www.apollographql.com/docs/react/data/fragments/#using-fragments-with-unions-and-interfaces
    possibleTypes: {
      Transaction: ['Expense', 'Order'],
      CollectiveInterface: ['Collective', 'Event', 'Project', 'Fund', 'Organization', 'User'],
      Account: ['Collective', 'Host', 'Individual', 'Fund', 'Project', 'Bot', 'Event', 'Organization'],
      AccountWithHost: ['Collective', 'Event', 'Fund', 'Project'],
      AccountWithContributions: ['Collective', 'Event', 'Fund', 'Project'],
    },
    // Documentation:
    // https://www.apollographql.com/docs/react/caching/cache-field-behavior/#merging-non-normalized-objects
    typePolicies: {
      Event: {
        fields: {
          tiers: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  });

  return inMemoryCache;
}

function createClient({ initialState, graphqlUrl } = {}) {
  const cache = createInMemoryCache();
  if (initialState) {
    cache.restore(initialState);
  }

  const link = createLink({ graphqlUrl });

  return new ApolloClient({
    cache,
    link,
    connectToDevTools: process.browser,
    ssrMode: !process.browser, // Disables forceFetch on the server (so queries are only run once)
    ssrForceFetchDelay: 100, // See https://www.apollographql.com/docs/react/performance/server-side-rendering/#store-rehydration
  });
}

export function initClient({ initialState, graphqlUrl } = {}) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return createClient({ initialState, graphqlUrl });
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = createClient({ initialState, graphqlUrl });
  }

  return apolloClient;
}
