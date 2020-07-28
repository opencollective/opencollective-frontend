import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '../../components/Grid';

class NewContributionFlowStepPayment extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
  };

  render() {
    return <Box width={1}>Payment method chooser - same for all states</Box>;
  }
}

export default NewContributionFlowStepPayment;
