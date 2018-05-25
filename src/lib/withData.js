import { ApolloProvider, getDataFromTree } from 'react-apollo'
import React from 'react'
import PropTypes from 'prop-types';
import { initClient } from './initClient'
import Head from 'next/head'

export default ComposedComponent => {

  return class WithData extends React.Component {

    static displayName = `WithData(${ComposedComponent.displayName})`

    static propTypes = {
      serverState: PropTypes.object.isRequired,
      options: PropTypes.object
    }

    static async getInitialProps (ctx) {
      let serverState = {}

      const headers = ctx.req ? ctx.req.headers : {}

      const options = {
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
            if (process.env.DEBUG) console.error(">>> apollo error: ", e);
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
