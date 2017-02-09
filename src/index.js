import React from 'react';
import ReactDOM from 'react-dom';
import EventPage from './containers/EventPage';
import TierPage from './containers/TierPage'

import { Router, Route, browserHistory } from 'react-router'
import ApolloClient, { createNetworkInterface } from 'apollo-client'
import { ApolloProvider } from 'react-apollo'
import './index.css'

let { API_URL, API_KEY } = process.env;
if (process.env.NODE_ENV === 'development') {
  API_URL = 'http://localhost:3060';
  API_KEY = 'dvl-1510egmf4a23d80342403fb599qd';
}

const networkInterface = createNetworkInterface({ uri: `${API_URL}/graphql?api_key=${API_KEY}` })

// The x-graphcool-source header is to let the server know that the example app has started.
// (Not necessary for normal projects)
// networkInterface.use([{
//   applyMiddleware (req, next) {
//     if (!req.options.headers) {
//       // Create the header object if needed.
//       req.options.headers = {}
//     }
//     req.options.headers['x-graphcool-source'] = 'example:react-apollo-instagram'

//     // get the authentication token from local storage if it exists
//     if (localStorage.getItem('graphcoolToken')) {
//       req.options.headers.authorization = `Bearer ${localStorage.getItem('graphcoolToken')}`
//     }
//     next()
//   },
// }])

const client = new ApolloClient({ networkInterface })

ReactDOM.render((
  <ApolloProvider client={client}>
    <Router history={browserHistory}>
      <Route path='/:collectiveSlug/events/:eventSlug' component={EventPage} />
    </Router>
  </ApolloProvider>
  ),
  document.getElementById('root')
)
