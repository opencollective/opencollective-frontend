import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Router } from '../../server/pages';
import Container from '../Container';
import PricingTabs from './PricingTabs';
import SingleCollectiveWithBankAccount from './tabs/SingleCollectiveWithBankAccount';
import SingleCollectiveWithoutBankAccount from './tabs/SingleCollectiveWithoutBankAccount';
import HostOrganization from './tabs/HostOrganization';
import withViewport, { VIEWPORTS } from '../../lib/withViewport';

class Pricing extends Component {
  static propTypes = {
    tab: PropTypes.string,
    viewport: PropTypes.oneOf(Object.values(VIEWPORTS)),
  };

  handleOnChangeTab = async tab => {
    await Router.pushRoute('pricing', { tab: tab });
  };

  renderContent(tab) {
    if (tab === 'singleCollectiveWithAccount') {
      return <SingleCollectiveWithBankAccount />;
    } else if (tab === 'singleCollectiveWithoutAccount') {
      return <SingleCollectiveWithoutBankAccount />;
    } else if (tab === 'organization') {
      return <HostOrganization />;
    }
  }

  getActiveTab() {
    const { viewport, tab } = this.props;
    // Return a default tab for desktop
    if (viewport !== VIEWPORTS.UNKNOWN && viewport !== VIEWPORTS.MOBILE && !tab) {
      return 'singleCollectiveWithAccount';
    }
    return tab;
  }

  render() {
    const tab = this.getActiveTab();

    return (
      <Container>
        <PricingTabs activeTab={tab} onChange={this.handleOnChangeTab} />
        {this.renderContent(tab)}
      </Container>
    );
  }
}

export default withViewport(Pricing);
