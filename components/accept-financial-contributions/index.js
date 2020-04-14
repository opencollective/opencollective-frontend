import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';

import ContributionCategoryPicker from './ContributionCategoryPicker';
import ApplyToHost from './ApplyToHost';
import HostSuccessPage from './HostSuccessPage';

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
    const { path, state } = router.query;

    if (!path) {
      return <ContributionCategoryPicker />;
    }

    if (state) {
      return <HostSuccessPage chosenHost={chosenHost} collective={this.props.collective} />;
    }

    return <ApplyToHost collective={this.props.collective} onChange={this.handleChange} />;
  }
}

export default withRouter(AcceptFinancialContributions);
