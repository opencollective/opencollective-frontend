import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '../../components/Grid';
import { P } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

class NewContributionFlowStepPayment extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.object,
    stepDetails: PropTypes.shape({
      amount: PropTypes.number,
      interval: PropTypes.string,
    }),
  };

  renderForm = () => {
    const { LoggedInUser } = this.props;
    const { amount, interval } = this.props.stepDetails;
    const guestLowContribution = !LoggedInUser && amount < 500000;
    const guestHighContribution = !LoggedInUser && amount > 500000;
    const guestRecurrentContribution = !LoggedInUser && interval;
    const loggedInContribution = LoggedInUser;

    if (guestLowContribution) {
      return <P>Placeholder for form for contributions under $5000 by guests</P>;
    } else if (guestHighContribution) {
      return <P>Placeholder for form for contributions over $5000 by guests</P>;
    } else if (guestRecurrentContribution) {
      return <P>Placeholder for form for recurring contributions under $5000 by guests</P>;
    } else if (loggedInContribution) {
      return <P>Placeholder for form for contributions & recurring contributions by logged in users</P>;
    }
  };

  render() {
    return <Box width={1}>{this.renderForm()}</Box>;
  }
}

export default withUser(NewContributionFlowStepPayment);
