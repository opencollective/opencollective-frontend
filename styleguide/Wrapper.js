import React, { Component } from 'react';
import { ThemeProvider } from 'styled-components';
import PropTypes from 'prop-types';
import { IntlProvider } from 'react-intl';
import { ApolloProvider } from '@apollo/react-components';

import StripeProvider from '../components/StripeProvider';
import theme from '../lib/theme';
import initClient from '../lib/initClient';
import { getBaseApiUrl } from '../lib/utils';

const STRIPE_KEY = 'pk_test_VgSB4VSg2wb5LdAkz7p38Gw8';

export default class ThemeWrapper extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  getGraphQLAPIURL() {
    const baseURL = getBaseApiUrl();
    const stagingApiKey = '09u624Pc9F47zoGLlkg1TBSbOl2ydSAq';
    const devApiKey = 'dvl-1510egmf4a23d80342403fb599qd';

    if (process.env.NODE_ENV === 'production') {
      return `https://staging.opencollective.com${baseURL}/graphql?api_key=${stagingApiKey}`;
    } else {
      return `http://localhost:3000${baseURL}/graphql?api_key=${devApiKey}`;
    }
  }

  render() {
    return (
      <ThemeProvider theme={theme}>
        <IntlProvider locale="en">
          <StripeProvider token={STRIPE_KEY} loadOnMount>
            <ApolloProvider client={initClient(undefined, this.getGraphQLAPIURL())}>
              {this.props.children}
            </ApolloProvider>
          </StripeProvider>
        </IntlProvider>
      </ThemeProvider>
    );
  }
}
