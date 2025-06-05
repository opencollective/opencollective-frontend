import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { formatErrorMessage, getErrorFromGraphqlException } from '../lib/errors';

import MessageBox from './MessageBox';

/**
 * A `MessageBox` specialized to display GraphQL errors.
 * Accepts all props from `MessageBox`.
 */
const MessageBoxGraphqlError = ({ error, ...props }) => {
  const intl = useIntl();
  return (
    <MessageBox type="error" withIcon {...props}>
      {formatErrorMessage(intl, getErrorFromGraphqlException(error))}
    </MessageBox>
  );
};

MessageBoxGraphqlError.propTypes = {
  error: PropTypes.any,
};

export default MessageBoxGraphqlError;
