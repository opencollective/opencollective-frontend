import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';

import ContributionCategoryPicker from './ContributionCategoryPicker';
import ApplyToHost from './ApplyToHost';
import SuccessPage from './SuccessPage';
import AcceptContributionsMyself from './AcceptContributionsMyself';
import AcceptContributionsOrganization from './AcceptContributionsOrganization';

class AcceptFinancialContributions extends Component {
  static propTypes = {
    router: PropTypes.object,
    data: PropTypes.object,
    host: PropTypes.object,
    collective: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      path: null,
      chosenHost: null,
    };
  }

  handleChange = (key, value) => {
    this.setState({ [key]: value });
  };

  render() {
    const { router } = this.props;
    const { chosenHost } = this.state;
    const { path, state, message } = router.query;

    if (!path) {
      return <ContributionCategoryPicker collective={this.props.collective} />;
    }

    if (state || message === 'StripeAccountConnected') {
      return <SuccessPage chosenHost={chosenHost} collective={this.props.collective} />;
    }

    if (path === 'host') {
      return <ApplyToHost collective={this.props.collective} onChange={this.handleChange} />;
    } else if (path === 'myself') {
      return <AcceptContributionsMyself collective={this.props.collective} />;
    } else if (path === 'organization') {
      return <AcceptContributionsOrganization collective={this.props.collective} />;
    }
  }
}

export default withRouter(AcceptFinancialContributions);
