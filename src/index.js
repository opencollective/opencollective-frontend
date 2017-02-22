import React from 'react';
import ReactDOM from 'react-dom';
import EventPage from './containers/EventPage';

import { Router, Route, browserHistory } from 'react-router';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools';
import { ApolloProvider } from 'react-apollo';
import schemaString from './graphql/schemas';

import './index.css';

let { REACT_APP_API_URL, REACT_APP_API_KEY } = process.env;
if (process.env.NODE_ENV === 'development') {
  REACT_APP_API_URL = 'http://localhost:3060';
  REACT_APP_API_KEY = 'dvl-1510egmf4a23d80342403fb599qd';
}

console.log("Using API at ", REACT_APP_API_URL);

let client;
if (process.env.NODE_ENV === 'test') {
  // Make a GraphQL schema with no resolvers
  const schema = makeExecutableSchema({ typeDefs: schemaString });
  // Add mocks, modifies schema in place
  addMockFunctionsToSchema({ schema });
}
else {
  const api_key_param = (REACT_APP_API_KEY) ? `api_key=${REACT_APP_API_KEY}` : '';
  const networkInterface = createNetworkInterface({ uri: `${REACT_APP_API_URL}/graphql?${api_key_param}` })
  client = new ApolloClient({ networkInterface })
}

ReactDOM.render((
  <ApolloProvider client={client}>
    <Router history={browserHistory}>
      <Route path='/:collectiveSlug/events/:eventSlug' component={EventPage} />
    </Router>
  </ApolloProvider>
  ),
  document.getElementById('root')
)
