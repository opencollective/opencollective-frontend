import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import MessageBox from './MessageBox';
import { withUser } from './UserProvider';

/**
 * Displays warnings related to the user account.
 */
const UserWarnings = ({ LoggedInUser }) => {
  if (LoggedInUser && LoggedInUser.isLimited) {
    return (
      <MessageBox type="warning" fontSize="LeadParagraph" textAlign="center" withIcon borderRadius={0}>
        <FormattedMessage
          id="warning.limitedAccount"
          defaultMessage="Your account is currently limited. If you think this is a mistake, please contact support@opencollective.com."
        />
      </MessageBox>
    );
  }

  return null;
};

UserWarnings.propTypes = {
  LoggedInUser: PropTypes.shape({
    isLimited: PropTypes.bool,
  }),
};

export default withUser(UserWarnings);
