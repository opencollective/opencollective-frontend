import React, { Component } from 'react';
import { ThemeProvider } from 'styled-components';
import PropTypes from 'prop-types';
import { IntlProvider } from 'react-intl';

import StripeProvider from '../components/StripeProvider';
import theme from '../lib/constants/theme';

const STRIPE_KEY = process.env.STRIPE_KEY || 'pk_test_5aBB887rPuzvWzbdRiSzV3QB';

export default class ThemeWrapper extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  render() {
    return (
      <ThemeProvider theme={theme}>
        <IntlProvider locale="en">
          <StripeProvider token={STRIPE_KEY} loadOnMount>
            {this.props.children}
          </StripeProvider>
        </IntlProvider>
      </ThemeProvider>
    );
  }
}
