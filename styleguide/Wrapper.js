import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ApolloProvider } from '@apollo/client';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import { initClient } from '../lib/apollo-client';
import theme from '../lib/theme';

import StripeProvider from '../components/StripeProvider';
import UserProvider from '../components/UserProvider';

import 'trix/dist/trix.css';

const STRIPE_KEY = 'pk_test_VgSB4VSg2wb5LdAkz7p38Gw8';

export default class ThemeWrapper extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  getGraphqlUrl() {
    if (process.env.NODE_ENV === 'production') {
      return `https://staging.opencollective.com/api/graphql`;
    } else {
      return `http://localhost:3000/api/graphql`;
    }
  }

  render() {
    return (
      <ThemeProvider theme={theme}>
        <IntlProvider locale="en">
          <StripeProvider token={STRIPE_KEY} loadOnMount>
            <ApolloProvider client={initClient({ graphqlUrl: this.getGraphqlUrl() })}>
              <UserProvider skipRouteCheck>{this.props.children}</UserProvider>
            </ApolloProvider>
          </StripeProvider>
        </IntlProvider>
      </ThemeProvider>
    );
  }
}
