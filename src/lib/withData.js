import { ApolloProvider, getDataFromTree } from 'react-apollo'
import React from 'react'
import PropTypes from 'prop-types';
import 'isomorphic-fetch'
import { initClient } from './initClient'
import Head from 'next/head'

const env = process.env.NODE_ENV || "development";

let { API_URL, API_KEY } = process.env;
switch (env) {
  case 'development':
    API_KEY = (API_URL || (API_KEY && API_KEY.length > 24)) ? API_KEY : 'dvl-1510egmf4a23d80342403fb599qd';
    API_URL = API_URL || 'http://localhost:3060';
    break;
  case 'production':
    API_URL = API_URL || 'https://opencollective.com/api';
    break;
  case 'staging':
    API_URL = API_URL || 'https://staging.opencollective.com/api';
    break;
}

const api_key_param = (API_KEY) ? `?api_key=${API_KEY}` : '';
const graphqlUri = `${API_URL}/graphql${api_key_param}`;

export default ComposedComponent => {
  return class WithData extends React.Component {
    static displayName = `WithData(${ComposedComponent.displayName})`
    static propTypes = {
      serverState: PropTypes.object.isRequired
    }

    static async getInitialProps (ctx) {
      let serverState = {}

      const headers = ctx.req ? ctx.req.headers : {}
      const options = {
        uri: graphqlUri,
        headers
      }

      // Evaluate the composed component's getInitialProps()
      let composedInitialProps = {}
      if (ComposedComponent.getInitialProps) {
        composedInitialProps = await ComposedComponent.getInitialProps(ctx)
      }
      // Run all graphql queries in the component tree
      // and extract the resulting data
      if (!process.browser) {
        const apollo = initClient(undefined, options)
        // Provide the `url` prop data in case a graphql query uses it
        const url = {query: ctx.query, pathname: ctx.pathname}

        // Run all graphql queries
        const app = (
          <ApolloProvider client={apollo}>
            <ComposedComponent client={apollo} url={url} {...composedInitialProps} />
          </ApolloProvider>
        )
        if (composedInitialProps.ssr === undefined || composedInitialProps.ssr === true) {
          try {
            await getDataFromTree(app)
          } catch (e) {
            console.error(">>> apollo error: ", e);
          }
          // getDataFromTree does not call componentWillUnmount
          // head side effect therefore need to be cleared manually
          Head.rewind()

          // Extract query data from the Apollo's store
          const state = apollo.getInitialState()

          serverState = {
            apollo: { // Make sure to only include Apollo's data state
              data: state.data
            }
          }
        }
      }

      return {
        options,
        serverState,
        ...composedInitialProps
      }
    }

    constructor (props) {
      super(props)
      this.apollo = initClient(this.props.serverState, this.props.options)
    }

    render () {
      return (
        <ApolloProvider client={this.apollo}>
          <ComposedComponent {...this.props} client={this.apollo} />
        </ApolloProvider>
      )
    }
  }
}
