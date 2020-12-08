import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';

import AcceptContributionsOurselvesOrOrg from './AcceptContributionsOurselvesOrOrg';
import ApplyToHost from './ApplyToHost';
import ContributionCategoryPicker from './ContributionCategoryPicker';
import SuccessPage from './SuccessPage';

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
    } else {
      return <AcceptContributionsOurselvesOrOrg collective={this.props.collective} />;
    }
  }
}

export default withRouter(AcceptFinancialContributions);
