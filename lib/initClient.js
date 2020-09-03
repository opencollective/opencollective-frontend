import { ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

import { createClient, createHttpLink } from '../server/apollo-client';
import { debugPerformance } from '../server/debug';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from './local-storage';

let apolloClient = null;

function createLink() {
  const httpLink = createHttpLink();

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

  return ApolloLink.from([errorLink, authLink, httpLink]);
}

export default function initGenericClient({ initialState, graphqlApiUrl } = {}) {
  debugPerformance('initClient: initGenericClient');

  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return createClient({ initialState, link: createLink(), graphqlApiUrl });
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = createClient({ initialState, link: createLink(), graphqlApiUrl });
  }

  return apolloClient;
}

export function initServerSideClient() {
  debugPerformance('initClient: initServerSideClient');

  return createClient();
}
