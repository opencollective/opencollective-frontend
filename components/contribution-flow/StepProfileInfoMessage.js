import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import MessageBox from '../MessageBox';

const StepProfileInfoMessage = ({ amount, interval }) => {
  const renderInfoMessage = amount => {
    if (interval) {
      return (
        <FormattedMessage
          id="ContributionFlow.recurringAccountInfo"
          defaultMessage="Please provide a valid email. We need to create an account so you can manage your contribution."
        />
      );
    } else if (amount < 25000) {
      return (
        <FormattedMessage
          id="ContributionFlow.lowestContributionInfoMessage"
          defaultMessage="Please provide a valid email. We need to send you a receipt for your contribution."
        />
      );
    } else if (amount >= 25000 && amount < 500000) {
      return (
        <FormattedMessage
          id="ContributionFlow.lowContributionInfoMessage"
          defaultMessage="Every contribution must be linked to an email account for legal reasons. Please provide a valid email."
        />
      );
    } else if (amount >= 500000) {
      return (
        <FormattedMessage
          id="ContributionFlow.highContributionInfoMessage"
          defaultMessage="While we'll email you a receipt, we are still required to collect a phyisical address for donations over $5000 USD."
        />
      );
    }
  };

  return (
    <MessageBox type="info" fontSize="12px" color="black.800" my={3} py={2}>
      {renderInfoMessage(amount)}{' '}
      {!interval && (
        <FormattedMessage
          id="SpteProfile.EmailNoSpam"
          defaultMessage="We won't send any spam or advertising, pinky promise."
        />
      )}
    </MessageBox>
  );
};

StepProfileInfoMessage.propTypes = {
  amount: PropTypes.number,
  interval: PropTypes.string,
};

export default StepProfileInfoMessage;
