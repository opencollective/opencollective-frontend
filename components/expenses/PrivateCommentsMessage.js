import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import { P } from '../Text';

import privateLockIconUrl from '../icons/PrivateLockIcon.png';

const PrivateLockIcon = styled.img.attrs({ src: privateLockIconUrl })`
  width: 32px;
  height: 32px;
  margin-left: 8px;
`;

const PrivateCommentsMessage = ({ isAllowed, isLoading, ...props }) => {
  if (isLoading) {
    return <LoadingPlaceholder height={76} borderRadius={8} />;
  }

  return (
    <MessageBox type="info" {...props}>
      <Flex alignItems="center" my={1}>
        <PrivateLockIcon />
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
