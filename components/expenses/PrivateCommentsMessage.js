import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import Image from '../Image';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import { P, Span } from '../Text';

const PrivateCommentsMessage = ({ isAllowed, isLoading, ...props }) => {
  if (isLoading) {
    return <LoadingPlaceholder height={76} borderRadius={8} />;
  }

  return (
    <MessageBox type="info" {...props}>
      <Flex alignItems="center" my={1}>
        <Span ml="8px">
          <Image alt="" src="/static/images/PrivateLockIcon.png" width={32} height={32} />
        </Span>
        <Box ml={3}>
          <P fontWeight="bold" fontSize="12px" lineHeight="20px">
            {isAllowed ? (
              <FormattedMessage id="PrivateCommentsMessage.Allowed" defaultMessage="Your comments are private." />
            ) : (
              <FormattedMessage id="PrivateCommentsMessage.NotAllowed" defaultMessage="Comments are private." />
            )}
          </P>
          <P fontSize="12px" lineHeight="18px">
            {isAllowed ? (
              <FormattedMessage
                id="PrivateCommentsMessage.AllowedDetails"
                defaultMessage="Expenses comments are private, because they sometimes contain confidential information such as payment details. Only the expense submitter and the admins can see them."
              />
            ) : (
              <FormattedMessage
                id="PrivateCommentsMessage.NotAllowedDetails"
                defaultMessage="You must be signed in as an admin or the expense submitter to read comments on an expense."
              />
            )}
          </P>
        </Box>
      </Flex>
    </MessageBox>
  );
};

PrivateCommentsMessage.propTypes = {
  isLoading: PropTypes.bool,
  isAllowed: PropTypes.bool,
};

export default PrivateCommentsMessage;
