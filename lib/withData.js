// This file is mostly adapted from:
// https://github.com/zeit/next.js/blob/3949c82bdfe268f841178979800aa8e71bbf412c/examples/with-apollo/lib/withData.js

import React from 'react';
import PropTypes from 'prop-types';
import { getDataFromTree } from '@apollo/client/react/ssr';
import Head from 'next/head';

import { debugPerformance } from '../server/debug';

import initClient, { initServerSideClient } from './initClient';

// Gets the display name of a JSX component for dev tools
function getComponentDisplayName(Component) {
  return Component.displayName || Component.name || 'Unknown';
}

const withData = ComposedComponent => {
  return class WithData extends React.Component {
    static async getInitialProps(context) {
      debugPerformance('withData: getInitialProps');

      const { Component, ctx } = context;

      let client;
      if (ctx.req) {
        if (ctx.req.apolloClient) {
          debugPerformance('withData: apolloClient reused');
          client = ctx.req.apolloClient;
        } else {
          debugPerformance('withData: initServerSideClient without serverState');
          client = ctx.req.apolloClient = initServerSideClient();
        }
      } else {
        debugPerformance('withData: initClient without serverState');
        client = initClient();
      }

      // Evaluate the composed component's getInitialProps()
      let composedInitialProps = {};
      if (ComposedComponent.getInitialProps) {
        debugPerformance('withData: ComposedComponent.getInitialProps');
        composedInitialProps = await ComposedComponent.getInitialProps(context);
      }

      // Run all GraphQL queries in the component tree
      // and extract the resulting data
      try {
        // Run all GraphQL queries
        debugPerformance('withData: getDataFromTree');
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
    };

    static defaultProps = {
      serverState: { apollo: { data: {} } },
    };

    constructor(props) {
      debugPerformance('withData: constructor');
      super(props);
      debugPerformance('withData: initClient with serverState');
      this.apolloClient = initClient({ initialState: props.serverState.apollo.data });
    }

    render() {
      debugPerformance('withData: render');
      return <ComposedComponent {...this.props} client={this.apolloClient} />;
    }
  };
};

export default withData;
