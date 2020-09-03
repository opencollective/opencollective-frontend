const { ApolloClient, ApolloLink, HttpLink, InMemoryCache } = require('@apollo/client');
const crossFetch = require('cross-fetch'); // We could use node-fetch but cross-fetch is the package we have installed.

const { debugPerformance } = require('./debug');
const { getGraphqlUrl } = require('./utils');

async function serverSideFetch(url, options = {}) {
  // Add headers to help the API identify origin of requests
  options.headers = options.headers || {};
  options.headers['oc-env'] = process.env.OC_ENV;
  options.headers['oc-secret'] = process.env.OC_SECRET;
  options.headers['oc-application'] = process.env.OC_APPLICATION;
  options.headers['user-agent'] = 'opencollective-frontend/1.0 node-fetch/1.0';

  // Start benchmarking
  const start = process.hrtime.bigint();

  const result = await crossFetch(url, options);

  // Complete benchmark measure and log
  if (process.env.GRAPHQL_BENCHMARK) {
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
}

function createHttpLink(graphqlApiUrl) {
  const apiV1Link = new HttpLink({
    uri: graphqlApiUrl || getGraphqlUrl('v1'),
    fetch: process.browser ? crossFetch : serverSideFetch,
  });
  const apiV2Link = new HttpLink({
    uri: graphqlApiUrl || getGraphqlUrl('v2'),
    fetch: process.browser ? crossFetch : serverSideFetch,
  });

  /** Depending on the value of the context.apiVersion we choose to use the link for the api
   * v1 or the api v2.
   */
  const httpLink = ApolloLink.split(
    operation => operation.getContext().apiVersion === '2', // Routes the query to the proper client
    apiV2Link,
    apiV1Link,
  );

  return httpLink;
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

function createClient({ cache, link, initialState, graphqlApiUrl } = {}) {
  if (!cache) {
    cache = createInMemoryCache();
  }
  if (!link) {
    link = createHttpLink(graphqlApiUrl);
  }

  if (initialState) {
    cache = cache.restore(initialState);
  }

  return new ApolloClient({
    cache,
    link,
    connectToDevTools: process.browser,
    // Disables forceFetch on the server (so queries are only run once)
    ssrMode: !process.browser,
    // See https://www.apollographql.com/docs/react/performance/server-side-rendering/#store-rehydration
    ssrForceFetchDelay: 100,
  });
}

let apolloClient, apolloClientClearInterval;

async function shouldUseApolloCache(req) {
  const hyperwatchLog = req.getAugmentedLog ? await req.getAugmentedLog() : null;
  if (!hyperwatchLog) {
    return false;
  }
  switch (process.env.APOLLO_CACHE_LEVEL) {
    case 'BOT_ONLY':
      return hyperwatchLog.has('identity') || hyperwatchLog.getIn(['agent', 'type']) === 'robot';
    case 'ALWAYS':
      return req.get('cache-control') !== 'max-age=0';
    case 'NEVER':
    default:
      return true;
  }
}

async function middleware(req, res, next) {
  const useApolloCache = await shouldUseApolloCache(req);
  if (!useApolloCache) {
    debugPerformance('apollo middleware: dedicated client');
    // Dedicated client with empty cache
    req.apolloClient = createClient();
  } else {
    if (!apolloClient) {
      debugPerformance('apollo middleware: create client without serverState');
      // Shared client with empty cache
      apolloClient = createClient();
      if (apolloClientClearInterval) {
        clearInterval(apolloClientClearInterval);
      }
      // Reset store every 60 seconds
      apolloClientClearInterval = setInterval(() => {
        debugPerformance('apollo middleware: clearStore');
        apolloClient.clearStore();
      }, process.env.APOLLO_CACHE_CLEAR_INTERVAL);
    }
    req.apolloClient = apolloClient;
  }

  next();
}

module.exports = {
  createClient,
  createHttpLink,
  createInMemoryCache,
  middleware,
};
