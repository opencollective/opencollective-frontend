import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { injectIntl } from 'react-intl';

import { Box } from '../../components/Grid';
import { withUser } from '../../components/UserProvider';

class NewContributionFlowStepPayment extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
    router: PropTypes.object,
  };

  render() {
    //const { collective, LoggedInUser, router } = this.props;

    return <Box width={1}>Payment method chooser - same for all states</Box>;
  }
}

export default injectIntl(withUser(withRouter(NewContributionFlowStepPayment)));
