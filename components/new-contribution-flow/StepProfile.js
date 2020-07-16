import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { injectIntl } from 'react-intl';

import { Box } from '../../components/Grid';
import { P } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

class NewContributionFlowStepPayment extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
    router: PropTypes.object,
    loadingLoggedInUser: PropTypes.object,
  };

  renderForm = (LoggedInUser, router) => {
    const guestLowContribution = !LoggedInUser && router.query.amount < 500000;
    const guestHighContribution = !LoggedInUser && router.query.amount > 500000;
    const guestRecurrentContribution = !LoggedInUser && router.query.frequency;
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
    const { LoggedInUser, router } = this.props;

    return <Box width={1}>{this.renderForm(LoggedInUser, router)}</Box>;
  }
}

export default injectIntl(withUser(withRouter(NewContributionFlowStepPayment)));
