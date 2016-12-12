import React from 'react';
import ReactDOM from 'react-dom';
import EventPage from './containers/EventPage';
import TierPage from './containers/TierPage'

import { Router, Route, browserHistory } from 'react-router'
import ApolloClient, { createNetworkInterface } from 'apollo-client'
import { ApolloProvider } from 'react-apollo'
import './index.css'

const networkInterface = createNetworkInterface('https://api.graph.cool/simple/v1/ciwic323g06pa0122uhnf0ljz')

// The x-graphcool-source header is to let the server know that the example app has started.
// (Not necessary for normal projects)
networkInterface.use([{
  applyMiddleware (req, next) {
    if (!req.options.headers) {
      // Create the header object if needed.
      req.options.headers = {}
    }
    req.options.headers['x-graphcool-source'] = 'example:react-apollo-instagram'

    // get the authentication token from local storage if it exists
    if (localStorage.getItem('graphcoolToken')) {
      req.options.headers.authorization = `Bearer ${localStorage.getItem('graphcoolToken')}`
    }
    next()
  },
}])

const client = new ApolloClient({ networkInterface })

ReactDOM.render((
  <ApolloProvider client={client}>
    <Router history={browserHistory}>
      <Route path='/' component={EventPage} />
      <Route path='/events/:eventid/tickets/:tierid' component={TierPage} />
    </Router>
  </ApolloProvider>
  ),
  document.getElementById('root')
)
