import {
  ApolloClient,
  ApolloLink,
  type DocumentNode,
  HttpLink,
  InMemoryCache,
  type OperationVariables,
} from '@apollo/client';
import { Defer20220824Handler } from '@apollo/client/incremental';
import { setContext } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { LocalState } from '@apollo/client/local-state';
import {
  ApolloClient as NextApolloClient,
  InMemoryCache as NextInMemoryCache,
  registerApolloClient,
} from '@apollo/client-integration-nextjs';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { pick } from 'lodash';

import TwoFactorAuthenticationApolloLink from './two-factor-authentication/TwoFactorAuthenticationApolloLink';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from './local-storage';
import { parseToBoolean } from './utils';

const INTERNAL_API_V1_URL = process.env.INTERNAL_API_V1_URL;
const INTERNAL_API_V2_URL = process.env.INTERNAL_API_V2_URL;
const INTERNAL_API_V1_OPERATION_NAMES = process.env.INTERNAL_API_V1_OPERATION_NAMES;
const INTERNAL_API_V2_OPERATION_NAMES = process.env.INTERNAL_API_V2_OPERATION_NAMES;

let customAgent;

const getBaseApiUrl = (apiVersion, internal = false) => {
  if (typeof window !== 'undefined') {
    return '/api';
  }

  if (internal) {
    if (apiVersion === 'v1' && INTERNAL_API_V1_URL) {
      return INTERNAL_API_V1_URL;
    } else if (apiVersion === 'v2' && INTERNAL_API_V2_URL) {
      return INTERNAL_API_V2_URL;
    }
  }

  return process.env.API_URL || 'https://api.opencollective.com';
};

/**
 * Returns the GraphQL api url for the appropriate api version and environment.
 * @param {string} version - api version. Defaults to v1.
 * @returns {string} GraphQL api url.
 */
const getGraphqlUrl = (apiVersion, internal = false) => {
  const apiKey = typeof window === 'undefined' ? process.env.API_KEY : null;
  return `${getBaseApiUrl(apiVersion, internal)}/graphql/${apiVersion}${apiKey ? `?api_key=${apiKey}` : ''}`;
};

const getCustomAgent = () => {
  if (typeof window === 'undefined' && !customAgent) {
    const { FETCH_AGENT_KEEP_ALIVE, FETCH_AGENT_KEEP_ALIVE_MSECS } = process.env;
    const keepAlive = FETCH_AGENT_KEEP_ALIVE !== undefined ? parseToBoolean(FETCH_AGENT_KEEP_ALIVE) : true;
    const keepAliveMsecs = FETCH_AGENT_KEEP_ALIVE_MSECS ? Number(FETCH_AGENT_KEEP_ALIVE_MSECS) : 10000;
    const http = require('http'); // eslint-disable-line @typescript-eslint/no-require-imports
    const https = require('https'); // eslint-disable-line @typescript-eslint/no-require-imports
    const httpAgent = new http.Agent({ keepAlive, keepAliveMsecs });
    const httpsAgent = new https.Agent({ keepAlive, keepAliveMsecs });
    customAgent = _parsedURL => (_parsedURL.protocol === 'http:' ? httpAgent : httpsAgent);
  }
  return customAgent;
};

const logRequest = (action = 'Fetched', start, options, result?) => {
  const end = process.hrtime.bigint();
  const executionTime = Math.round(Number(end - start) / 1000000);
  const apiExecutionTime = result?.headers.get('Execution-Time');
  const graphqlCache = result?.headers.get('GraphQL-Cache');
  const latencyTime = apiExecutionTime ? executionTime - Number(apiExecutionTime) : null;
  const body = JSON.parse(options.body);
  if (body.operationName || body.variables) {
    const pickList = [
      'CollectiveId',
      'collectiveSlug',
      'CollectiveSlug',
      'id',
      'legacyId',
      'legacyExpenseId',
      'slug',
      'term',
      'tierId',
    ];
    const operationName = body.operationName || 'anonymous GraphQL query';
    const variables = process.env.NODE_ENV === 'development' ? body.variables : pick(body.variables || {}, pickList);
    // eslint-disable-next-line no-console
    console.log(
      `-> ${action}`,
      operationName,
      variables,
      executionTime ? `in ${executionTime}ms` : '',
      latencyTime ? `latency=${latencyTime}ms` : '',
      graphqlCache ? `GraphQL Cache ${graphqlCache}` : '',
    );
  }
};

async function serverSideFetch(url: RequestInfo | URL, options: RequestInit = {}) {
  if (typeof window === 'undefined') {
    const nodeFetch = require('node-fetch'); // eslint-disable-line @typescript-eslint/no-require-imports

    options['agent'] = getCustomAgent();

    // Add headers to help the API identify origin of requests
    options.headers = options.headers || {};
    options.headers['oc-env'] = process.env.OC_ENV;
    options.headers['oc-secret'] = process.env.OC_SECRET;
    options.headers['oc-application'] = process.env.OC_APPLICATION;
    options.headers['oc-version'] = process.env.HEROKU_SLUG_COMMIT?.slice(0, 7);
    options.headers['user-agent'] = 'opencollective-frontend/1.0 node-fetch/1.0';

    // Start benchmarking if the request is server side
    const start = process.hrtime.bigint();

    try {
      const result = await nodeFetch(url, options);

      // Complete benchmark measure and log
      if (parseToBoolean(process.env.GRAPHQL_BENCHMARK)) {
        logRequest('Fetched', start, options, result);
      }

      return result;
    } catch (error) {
      if (parseToBoolean(process.env.GRAPHQL_BENCHMARK)) {
        logRequest('Failed', start, options);
      }
      throw error;
    }
  }
}

function createLink({
  twoFactorAuthContext,
  accessToken = null,
}: {
  twoFactorAuthContext?: unknown;
  accessToken?: string | null;
}) {
  const authLink = setContext((_, { headers }) => {
    const token =
      accessToken || (typeof window !== 'undefined' ? getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN) : null);
    if (token) {
      return {
        headers: {
          authorization: `Bearer ${token}`,
          ...headers,
        },
      };
    }
    return {};
  });

  const errorLink = new ErrorLink(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.map(error => {
        if (error) {
          const { message, locations, path } = error;
          // eslint-disable-next-line no-console
          console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
          return;
        }

        // eslint-disable-next-line no-console
        console.error('[GraphQL error]: Received null error');
      });
    }

    if (networkError) {
      // eslint-disable-next-line no-console
      console.error(`[Network error]: ${networkError}`);
    }
  });

  const sentryLink = setContext((_, { headers }) => {
    if (
      headers?.['x-sentry-force-sample'] ||
      (typeof window !== 'undefined' && window.location.search.includes('forceSentryTracing=1'))
    ) {
      return {
        headers: { ...headers, 'x-sentry-force-sample': '1' },
      };
    }
    return {};
  });

  const linkFetch = typeof window !== 'undefined' ? fetch : serverSideFetch;

  const httpHeaders = {
    'oc-application': process.env.OC_APPLICATION || '',
    'oc-version': process.env.HEROKU_SLUG_COMMIT?.slice(0, 7) || '',
  };

  const apiV1DefaultLink = new UploadHttpLink({
    uri: getGraphqlUrl('v1'),
    fetch: linkFetch,
    headers: { ...httpHeaders, 'Apollo-Require-Preflight': 'true' },
    formDataAppendFile(formData, fieldName, file) {
      formData.append(fieldName, new Blob([file as File], { type: file.type }), (file as File).name);
    },
  });
  const apiV2DefaultLink = new UploadHttpLink({
    uri: getGraphqlUrl('v2'),
    fetch: linkFetch,
    headers: { ...httpHeaders, 'Apollo-Require-Preflight': 'true' },
    formDataAppendFile(formData, fieldName, file) {
      formData.append(fieldName, new Blob([file as File], { type: file.type }), (file as File).name);
    },
  });

  // Setup internal links handling to be able to split traffic to different API servers
  const apiV1Link =
    INTERNAL_API_V1_URL && typeof window === 'undefined'
      ? ApolloLink.split(
          ({ operationName }) =>
            !INTERNAL_API_V1_OPERATION_NAMES || INTERNAL_API_V1_OPERATION_NAMES.split(',').includes(operationName),
          new HttpLink({ uri: getGraphqlUrl('v1', true), fetch: linkFetch, headers: httpHeaders }),
          apiV1DefaultLink,
        )
      : apiV1DefaultLink;

  const apiV2Link =
    INTERNAL_API_V2_URL && typeof window === 'undefined'
      ? ApolloLink.split(
          ({ operationName }) =>
            !INTERNAL_API_V2_OPERATION_NAMES || INTERNAL_API_V2_OPERATION_NAMES.split(',').includes(operationName),
          new HttpLink({ uri: getGraphqlUrl('v2', true), fetch: linkFetch, headers: httpHeaders }),
          apiV2DefaultLink,
        )
      : apiV2DefaultLink;

  /** Depending on the value of the context.apiVersion we choose to use the link for the api
   * v1 or the api v2.
   */
  const httpLink = ApolloLink.split(
    operation => operation.getContext().apiVersion === '2', // Routes the query to the proper client
    apiV2Link,
    apiV1Link,
  );

  const twoFactorAuthLink = new TwoFactorAuthenticationApolloLink(twoFactorAuthContext);

  return ApolloLink.from([sentryLink, errorLink, authLink, twoFactorAuthLink, httpLink]);
}

function createInMemoryCache() {
  const inMemoryCache = new NextInMemoryCache({
    // Documentation:
    // https://www.apollographql.com/docs/react/data/fragments/#using-fragments-with-unions-and-interfaces
    possibleTypes: {
      Transaction: ['Expense', 'Order', 'Debit', 'Credit'],
      CollectiveInterface: ['Collective', 'Event', 'Project', 'Fund', 'Organization', 'User', 'Vendor'],
      Account: ['Collective', 'Host', 'Individual', 'Fund', 'Project', 'Bot', 'Event', 'Organization', 'Vendor'],
      AccountWithHost: ['Collective', 'Event', 'Fund', 'Project'],
      AccountWithParent: ['Event', 'Project'],
      AccountWithContributions: ['Collective', 'Organization', 'Event', 'Fund', 'Project', 'Host'],
      AccountWithPlatformSubscription: ['Organization', 'Collective'],
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

// Create a function to get the client with optional accessToken for client-side (RSC)
export function createApolloClient(accessToken?: string | null) {
  return new NextApolloClient({
    cache: createInMemoryCache(),
    link: createLink({ twoFactorAuthContext: null, accessToken }),

    // Disables forceFetch on the server (so queries are only run once)
    ssrMode: typeof window === 'undefined',

    // See https://www.apollographql.com/docs/react/performance/server-side-rendering/#store-rehydration
    ssrForceFetchDelay: 100,

    /*
    Inserted by Apollo Client 3->4 migration codemod.
    If you are not using the `@client` directive in your application,
    you can safely remove this option.
    */
    localState: new LocalState({}),

    devtools: {
      enabled: typeof window !== 'undefined',
    },

    /*
    Inserted by Apollo Client 3->4 migration codemod.
    If you are not using the `@defer` directive in your application,
    you can safely remove this option.
    */
    incrementalHandler: new Defer20220824Handler(),
  });
}

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  return createApolloClient();
});

// Create a server-side Apollo client with regular ApolloClient for queries
function createServerClient(accessToken?: string | null) {
  return new ApolloClient({
    cache: new InMemoryCache({
      possibleTypes: {
        Transaction: ['Expense', 'Order', 'Debit', 'Credit'],
        CollectiveInterface: ['Collective', 'Event', 'Project', 'Fund', 'Organization', 'User', 'Vendor'],
        Account: ['Collective', 'Host', 'Individual', 'Fund', 'Project', 'Bot', 'Event', 'Organization', 'Vendor'],
        AccountWithHost: ['Collective', 'Event', 'Fund', 'Project'],
        AccountWithParent: ['Event', 'Project'],
        AccountWithContributions: ['Collective', 'Organization', 'Event', 'Fund', 'Project', 'Host'],
        AccountWithPlatformSubscription: ['Organization', 'Collective'],
      },
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
    }),

    link: createLink({ twoFactorAuthContext: null, accessToken }),
    ssrMode: true,
    ssrForceFetchDelay: 100,

    /*
    Inserted by Apollo Client 3->4 migration codemod.
    If you are not using the `@client` directive in your application,
    you can safely remove this option.
    */
    localState: new LocalState({}),

    devtools: {
      enabled: false,
    },

    /*
    Inserted by Apollo Client 3->4 migration codemod.
    If you are not using the `@defer` directive in your application,
    you can safely remove this option.
    */
    incrementalHandler: new Defer20220824Handler(),
  });
}

// Export a query function that can accept accessToken
export async function queryWithToken<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>(options: {
  query: DocumentNode;
  variables?: TVariables;
  fetchPolicy?: 'cache-first' | 'network-only' | 'cache-only' | 'no-cache';
  accessToken?: string | null;
}) {
  const client = createServerClient(options.accessToken);
  return client.query<TData, TVariables>({
    query: options.query,
    variables: options.variables,
    fetchPolicy: options.fetchPolicy,
  });
}

/*
Start: Inserted by Apollo Client 3->4 migration codemod.
Copy the contents of this block into a `.d.ts` file in your project to enable correct response types in your custom links.
If you do not use the `@defer` directive in your application, you can safely remove this block.
*/

import '@apollo/client';

declare module '@apollo/client' {
  export interface TypeOverrides extends Defer20220824Handler.TypeOverrides {}
}

/*
End: Inserted by Apollo Client 3->4 migration codemod.
*/

/*
Start: Inserted by Apollo Client 3->4 migration codemod.
Copy the contents of this block into a `.d.ts` file in your project to enable correct response types in your custom links.
If you do not use the `@defer` directive in your application, you can safely remove this block.
*/

declare module '@apollo/client' {
  export interface TypeOverrides extends Defer20220824Handler.TypeOverrides {}
}

/*
End: Inserted by Apollo Client 3->4 migration codemod.
*/
