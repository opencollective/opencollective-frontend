// This file is mostly adapted from:
// https://github.com/zeit/next.js/blob/3949c82bdfe268f841178979800aa8e71bbf412c/examples/with-apollo/lib/withData.js

import React from 'react';
import PropTypes from 'prop-types';
import { getDataFromTree } from '@apollo/react-ssr';
import Head from 'next/head';
import { omit } from 'lodash';

import initClient from './initClient';
import ErrorPage from '../components/ErrorPage';

// Gets the display name of a JSX component for dev tools
function getComponentDisplayName(Component) {
  return Component.displayName || Component.name || 'Unknown';
}

export default ComposedComponent => {
  return class WithData extends React.Component {
    static async getInitialProps(ctx) {
      // Initial serverState with apollo (empty)
      let serverState = {
        apollo: {
          data: {},
        },
      };
      const { Component, router } = ctx;

      const options = {
        headers: ctx.req ? ctx.req.headers : {},
      };

      // Evaluate the composed component's getInitialProps()
      let composedInitialProps = {};
      if (ComposedComponent.getInitialProps) {
        composedInitialProps = await ComposedComponent.getInitialProps(ctx);
      }

      // Run all GraphQL queries in the component tree
      // and extract the resulting data
      const apollo = initClient(undefined);
      try {
        // create the url prop which is passed to every page
        const url = {
          query: ctx.query,
          asPath: ctx.asPath,
          pathname: ctx.pathname,
        };

        // Run all GraphQL queries
        const result = await getDataFromTree(
          <ComposedComponent
            ctx={ctx}
            url={url}
            client={apollo}
            Component={Component}
            router={router}
            {...composedInitialProps}
          />,
          {
            router: {
              asPath: ctx.asPath,
              pathname: ctx.pathname,
              query: ctx.query,
            },
            client: apollo,
          },
        );

        if (result.startsWith('<div id="__page_404_not_found__">')) {
          if (ctx.res) {
            ctx.res.statusCode = 404;
          }
        }
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
      serverState = {
        apollo: {
          data: apollo.cache.extract(),
        },
      };

      return {
        options,
        serverState,
        ...composedInitialProps,
      };
    }

    static displayName = `WithData(${getComponentDisplayName(ComposedComponent)})`;

    static propTypes = {
      serverState: PropTypes.object.isRequired,
      options: PropTypes.object,
      statusCode: PropTypes.number,
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
      this.apollo = initClient(serverState.apollo.data);
    }

    render() {
      return <ComposedComponent {...this.props} client={this.apollo} />;
    }
  };
};
