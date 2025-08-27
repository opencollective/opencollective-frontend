import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { getEnvVar } from '@/lib/env-utils';
import { parseToBoolean } from '@/lib/utils';

import NewPricing from '../components/new-pricing';
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

  static propTypes = {
    tab: PropTypes.string,
  };

  render() {
    return <Page>{parseToBoolean(getEnvVar('NEW_PRICING')) ? <NewPricing /> : <Pricing />}</Page>;
  }
}
