import { ApolloProvider, getDataFromTree } from 'react-apollo'
import React from 'react'
import 'isomorphic-fetch'
import { initClient } from './initClient'
import { logger } from '../lib/logger';

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

export default (Component) => (
  class extends React.Component {
    static async getInitialProps (ctx) {
      const headers = ctx.req ? ctx.req.headers : {}
      const options = {
        uri: graphqlUri,
        headers
      }
      const client = initClient(null, options)

      const props = {
        url: { query: ctx.query, pathname: ctx.pathname },
        ...await (Component.getInitialProps ? Component.getInitialProps(ctx) : {})
      }

      if (!process.browser) {
        const app = (
          <ApolloProvider client={client}>
            <Component {...props} />
          </ApolloProvider>
        )
        await getDataFromTree(app).catch(err => {
          logger.error(">>> error in getDataFromTree", err);
        });
      }

      return {
        initialState: {
          [client.reduxRootKey]: { data: client.getInitialState().data }
        },
        options,
        ...props
      }
    }

    constructor (props) {
      super(props);
      this.client = initClient(this.props.initialState, this.props.options);
    }

    render () {
      return (
        <ApolloProvider client={this.client}>
          <Component {...this.props} />
        </ApolloProvider>
      )
    }
  }
)
