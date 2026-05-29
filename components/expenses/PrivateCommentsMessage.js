import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ExpenseType } from '@/lib/graphql/types/v2/graphql';

import { Box, Flex } from '../Grid';
import Image from '../Image';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import { P } from '../Text';

const PrivateCommentsMessage = ({ isAllowed, isLoading, ...props }) => {
  if (isLoading) {
    return <LoadingPlaceholder height={76} borderRadius={8} />;
  }

  return (
    <MessageBox type="info" {...props}>
      <Flex alignItems="center" my={1}>
        <Image alt="" className="ml-2 min-w-6" src="/static/images/PrivateLockIcon.png" width={32} height={32} />
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
              props.expenseType === ExpenseType.GRANT ? (
                <FormattedMessage
                  defaultMessage="Grant request comments are private, because they sometimes contain confidential information such as payment details. Only the grant request submitter, the admins and the accountants can see them."
                  id="OysmzD"
                />
              ) : (
                <FormattedMessage
                  id="PrivateCommentsMessage.AllowedDetails"
                  defaultMessage="Expenses comments are private, because they sometimes contain confidential information such as payment details. Only the expense submitter, the admins and the accountants can see them."
                />
              )
            ) : (
              <FormattedMessage
                id="PrivateCommentsMessage.NotAllowedDetails"
                defaultMessage="You must be signed in as an admin, an accountant or the expense submitter to read comments on an expense."
              />
            )}
          </P>
        </Box>
      </Flex>
    </MessageBox>
  );
};

export default PrivateCommentsMessage;
