// This file is mostly adapted from:
// https://github.com/zeit/next.js/blob/3949c82bdfe268f841178979800aa8e71bbf412c/examples/with-apollo/lib/withData.js

import React from 'react';
import PropTypes from 'prop-types';
import type { ApolloClient } from '@apollo/client';
import { getDataFromTree } from '@apollo/client/react/ssr';

import { withTwoFactorAuthentication } from './two-factor-authentication/TwoFactorAuthenticationContext';
import { initClient } from './apollo-client';
import { compose } from './utils';

// Gets the display name of a JSX component for dev tools
function getComponentDisplayName(Component) {
  return Component.displayName || Component.name || 'Unknown';
}

type WithDataProps = {
  serverState: any;
  twoFactorAuthContext: any;
};

const withData = ComposedComponent => {
  return class WithData extends React.Component<WithDataProps> {
    static async getInitialProps(context) {
      const { Component } = context;

      const client = initClient();

      // Evaluate the composed component's getInitialProps()
      let composedInitialProps = {};
      if (ComposedComponent.getInitialProps) {
        composedInitialProps = await ComposedComponent.getInitialProps({ ...context, client });
      }

      try {
        // Run all GraphQL queries
        const skipDataFromTree = composedInitialProps['pageProps']?.skipDataFromTree || false;
        if (!skipDataFromTree) {
          await getDataFromTree(<ComposedComponent Component={Component} {...composedInitialProps} />, { client });
        }
      } catch (error) {
        // Prevent Apollo Client GraphQL errors from crashing SSR.
        // Handle them in components via the data.error prop:
        // http://dev.apollodata.com/react/api-queries.html#graphql-query-data-error
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.error('>>> apollo error: ', error);
        }
      }

      // Extract query data from the Apollo store
      const serverState = {
        apollo: {
          data: client.cache.extract(),
        },
      };

      return {
        serverState,
        ...composedInitialProps,
      };
    }

    static displayName = `WithData(${getComponentDisplayName(ComposedComponent)})`;

    static propTypes = {
      serverState: PropTypes.object.isRequired,
      options: PropTypes.object,
      twoFactorAuthContext: PropTypes.object,
    };

    static defaultProps = {
      serverState: {
        apollo: {
          data: {},
        },
      },
    };

    constructor(props) {
      super(props);
      const { serverState, twoFactorAuthContext } = this.props;
      this.client = initClient({ initialState: serverState.apollo.data, twoFactorAuthContext });
    }

    client: ApolloClient<object> | null;

    render() {
      return <ComposedComponent {...this.props} client={this.client} />;
    }
  };
};

export default compose(withTwoFactorAuthentication, withData);
