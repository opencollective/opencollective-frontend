import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Page from '../components/Page';
import Pricing from '../components/pricing';

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
