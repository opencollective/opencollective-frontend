import React from 'react';
import type { QueryOptions } from '@apollo/client';
import { Query } from '@apollo/client/react/components';
import { getDataFromTree } from '@apollo/client/react/ssr';
import { cloneDeep, isUndefined, omitBy, pick } from 'lodash';

import { APOLLO_STATE_PROP_NAME, APOLLO_VARIABLES_PROP_NAME, initClient } from '../apollo-client';

type QueryParams = QueryOptions & {
  getVariablesFromProps?: (props: any) => any;
  /** Whether to fetch data for nested queries. This currently doesn't work for pages with a `useRouter` call, see https://github.com/opencollective/opencollective/issues/7013 */
  fetchDataFromTree?: boolean;
  /** @deprecated Whether to use the legacy data structure from Apollo, as returned by `withData`. Intended to make the transition from old pages smoother, should not be used in new developments */
  useLegacyDataStructure?: boolean;
  /** A custom function to preload more data on the client */
  preload?: (client: any, mainQueryResult: any) => Promise<void>;
};

export const ssrGraphQLQuery = ({
  getVariablesFromProps,
  fetchDataFromTree,
  preload,
  useLegacyDataStructure,
  ...queryParams
}: QueryParams) => {
  return ComposedComponent => {
    return class WithSSRQuery extends React.Component {
      static async getInitialProps(context) {
        const client = initClient();
        let composedInitialProps = {};
        if (ComposedComponent.getInitialProps) {
          composedInitialProps = await ComposedComponent.getInitialProps(context);
        }

        const variables = cloneDeep(composedInitialProps);
        if (getVariablesFromProps) {
          Object.assign(variables, getVariablesFromProps(composedInitialProps));
        }

        try {
          // Run main query
          const mainQueryResult = await client.query({ ...queryParams, variables });

          // Run preload function
          if (preload) {
            await preload(client, mainQueryResult);
          }

          // Run nested GraphQL queries
          if (fetchDataFromTree) {
            await getDataFromTree(<ComposedComponent Component={context.Component} {...composedInitialProps} />, {
              client,
            });
          }
        } catch (error) {
          // Prevent Apollo Client GraphQL errors from crashing SSR.
          // eslint-disable-next-line no-console
          console.error('Apollo error: ', error);
        }

        return {
          ...composedInitialProps,
          [APOLLO_STATE_PROP_NAME]: client.cache.extract(), // This will be used in `_app` to initialize the Apollo client
          [APOLLO_VARIABLES_PROP_NAME]: omitBy(variables, isUndefined),
        };
      }

      static displayName = `WithData(${ComposedComponent.displayName || ComposedComponent.name || 'Unknown'})`;

      render() {
        const variables = this.props[APOLLO_VARIABLES_PROP_NAME];
        return (
          <Query {...queryParams} variables={variables}>
            {queryProps => {
              if (!useLegacyDataStructure) {
                return <ComposedComponent {...this.props} {...queryProps} />;
              } else {
                return (
                  <ComposedComponent
                    {...this.props}
                    data={{
                      ...queryProps.data,
                      ...pick(queryProps, [
                        'loading',
                        'networkStatus',
                        'refetch',
                        'reobserve',
                        'fetchMore',
                        'updateQuery',
                        'startPolling',
                        'stopPolling',
                        'subscribeToMore',
                        'observable',
                        'variables',
                        'called',
                        'previousData',
                      ]),
                    }}
                  />
                );
              }
            }}
          </Query>
        );
      }
    };
  };
};
