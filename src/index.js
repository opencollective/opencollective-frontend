import React from 'react';
import ReactDOM from 'react-dom';
import EventPage from './containers/EventPage';

import { Router, Route, browserHistory } from 'react-router';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools';
import { ApolloProvider } from 'react-apollo';
import schemaString from './graphql/schemas';

import './index.css';

let API_URL = process.env.REACT_APP_API_URL, API_KEY;
switch (process.env.NODE_ENV) {
  case 'production':
    API_URL = API_URL || `https://opencollective.com/api`;
    break;
  case 'staging':
    API_URL = API_URL || `https://staging.opencollective.com/api`;
    break;
  default:
    API_URL = 'http://localhost:3060';
    API_KEY = 'dvl-1510egmf4a23d80342403fb599qd';
    break;
}

let client;
if (process.env.NODE_ENV === 'test') {
  // Make a GraphQL schema with no resolvers
  const schema = makeExecutableSchema({ typeDefs: schemaString });
  // Add mocks, modifies schema in place
  addMockFunctionsToSchema({ schema });
}
else {
  const api_key_param = (API_KEY) ? `api_key=${API_KEY}` : '';
  const networkInterface = createNetworkInterface({ uri: `${API_URL}/graphql?${api_key_param}` })
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
