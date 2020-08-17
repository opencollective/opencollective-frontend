import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../../lib/errors/';
import { GraphQLContext } from '../../lib/graphql/context';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';

/* eslint-disable graphql/template-strings */
export const refundTransactionMutation = gqlV2/* GraphQL */ `
  mutation RefundTransaction($transaction: TransactionReferenceInput!) {
    refundTransaction(transaction: $transaction) {
      id
    }
  }
`;

const TransactionRefundButton = props => {
  const [refundTransaction, { loading, error }] = useMutation(refundTransactionMutation, {
    context: API_V2_CONTEXT,
  });
  const transactionsDataContext = React.useContext(GraphQLContext);
  const [isEnabled, setEnabled] = React.useState(false);

  const handleRefundTransaction = async () => {
    await refundTransaction({ variables: { transaction: { id: props.id } } });
    setEnabled(false);
    transactionsDataContext?.refetch?.();
  };

  return (
    <Flex flexDirection="column">
      <Box>
        {!isEnabled && (
          <StyledButton
            buttonSize="small"
            minWidth={140}
            background="transparent"
            textTransform="capitalize"
            onClick={() => setEnabled(true)}
          >
            <FormattedMessage id="transaction.refund.btn" defaultMessage="refund" />
          </StyledButton>
        )}
        {isEnabled && (
          <React.Fragment>
            <StyledButton
              minWidth={140}
              buttonSize="small"
              mr={2}
              textTransform="capitalize"
              onClick={() => setEnabled(false)}
            >
              <FormattedMessage id="form.cancel" defaultMessage="cancel" />
            </StyledButton>
            <StyledButton
              onClick={handleRefundTransaction}
              buttonSize="small"
              buttonStyle="dangerSecondary"
              loading={loading}
            >
              <FormattedMessage id="transaction.refund.yes.btn" defaultMessage="Yes, refund!" />
            </StyledButton>
          </React.Fragment>
        )}
      </Box>
      {error && (
        <MessageBox type="error" withIcon mt="12px">
          {getErrorFromGraphqlException(error)?.message}
        </MessageBox>
      )}
    </Flex>
  );
};

TransactionRefundButton.propTypes = {
  id: PropTypes.string.isRequired,
};

export default TransactionRefundButton;
