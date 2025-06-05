import React, { Component } from 'react';

import Page from '../components/Page';
import Pricing from '../components/pricing';

// next.js export
// ts-unused-exports:disable-next-line
export default class PricingPage extends Component {
  static getInitialProps({ query }) {
    return {
      tab: query.tab || '',
    };
  }

  render() {
    return (
      <Page>
        <Pricing />
      </Page>
    );
  }
}
