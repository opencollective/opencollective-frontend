// This file is mostly adapted from:
// https://github.com/zeit/next.js/blob/3949c82bdfe268f841178979800aa8e71bbf412c/examples/with-apollo/lib/withData.js

import React from 'react';
import PropTypes from 'prop-types';
import { getDataFromTree } from '@apollo/client/react/ssr';
import Head from 'next/head';

import { initClient } from './apollo-client';

// Gets the display name of a JSX component for dev tools
function getComponentDisplayName(Component) {
  return Component.displayName || Component.name || 'Unknown';
}

const withData = ComposedComponent => {
  return class WithData extends React.Component {
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
        await getDataFromTree(<ComposedComponent Component={Component} {...composedInitialProps} />, { client });
      } catch (error) {
        // Prevent Apollo Client GraphQL errors from crashing SSR.
        // Handle them in components via the data.error prop:
        // http://dev.apollodata.com/react/api-queries.html#graphql-query-data-error
        if (process.env.DEBUG) {
          console.error('>>> apollo error: ', error);
        }
      }
      if (!process.browser) {
        // getDataFromTree does not call componentWillUnmount
        // head side effect therefore need to be cleared manually
        Head.rewind();
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
      const { serverState } = this.props;
      this.client = initClient({ initialState: serverState.apollo.data });
    }

    render() {
      return <ComposedComponent {...this.props} client={this.client} />;
    }
  };
};

export default withData;
