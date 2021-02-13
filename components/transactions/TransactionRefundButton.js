import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Undo } from '@styled-icons/boxicons-regular/Undo';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import ConfirmationModal from '../ConfirmationModal';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';

export const refundTransactionMutation = gqlV2/* GraphQL */ `
  mutation RefundTransaction($transaction: TransactionReferenceInput!) {
    refundTransaction(transaction: $transaction) {
      id
    }
  }
`;

const TransactionRefundButton = props => {
  const [refundTransaction, { error: mutationError }] = useMutation(refundTransactionMutation, {
    context: API_V2_CONTEXT,
  });
  const [isEnabled, setEnabled] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    setError(mutationError);
  }, [mutationError]);

  const handleRefundTransaction = async () => {
    await refundTransaction({ variables: { transaction: { id: props.id } } });
    props.onMutationSuccess();
    setEnabled(false);
  };

  const closeModal = () => {
    setEnabled(false);
    setError(null);
  };

  return (
    <Flex flexDirection="column">
      <Box>
        <StyledButton
          buttonSize="small"
          buttonStyle="secondary"
          minWidth={140}
          background="transparent"
          textTransform="capitalize"
          onClick={() => setEnabled(true)}
        >
          <Flex alignItems="center" justifyContent="space-evenly">
            <Undo size={16} />
            <FormattedMessage id="transaction.refund.btn" defaultMessage="refund" />
          </Flex>
        </StyledButton>
        <ConfirmationModal
          show={isEnabled}
          onClose={closeModal}
          header={<FormattedMessage id="Refund" defaultMessage="Refund" />}
          body={
            <React.Fragment>
              <Flex alignItems="center" justifyContent="center">
                <MessageBox type="info" mx={2}>
                  <FormattedMessage
                    id="transaction.refund.info"
                    defaultMessage="The contributor will be refunded the full amount."
                  />
                </MessageBox>
                {error && <MessageBoxGraphqlError mt="12px" error={error} />}
              </Flex>
            </React.Fragment>
          }
          continueLabel={
            <Flex alignItems="center" justifyContent="space-evenly">
              <Undo size={16} />
              <FormattedMessage id="Refund" defaultMessage="Refund" />
            </Flex>
          }
          continueHandler={handleRefundTransaction}
        />
      </Box>
    </Flex>
  );
};

TransactionRefundButton.propTypes = {
  id: PropTypes.string.isRequired,
  onMutationSuccess: PropTypes.func,
};

export default TransactionRefundButton;
