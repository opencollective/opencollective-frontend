import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Page from '../components/Page';
import Pricing from '../components/pricing';

// ignore unused exports default
// next.js export
export default class PricingPage extends Component {
  static getInitialProps({ query }) {
    return {
      tab: query.tab || '',
    };
  }

  static propTypes = {
    tab: PropTypes.string,
  };

  render() {
    return (
      <Page>
        <Pricing />
      </Page>
    );
  }
}
