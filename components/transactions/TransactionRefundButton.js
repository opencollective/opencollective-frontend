import React from 'react';
import { useMutation } from '@apollo/client';
import { Undo } from '@styled-icons/boxicons-regular/Undo';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import ConfirmationModal from '../ConfirmationModal';
import { Box, Flex } from '../Grid';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { Button } from '../ui/Button';

const refundTransactionMutation = gql`
  mutation RefundTransaction($transaction: TransactionReferenceInput!) {
    refundTransaction(transaction: $transaction) {
      id
    }
  }
`;

const TransactionRefundButton = props => {
  const [refundTransaction] = useMutation(refundTransactionMutation, {
    context: API_V2_CONTEXT,
  });
  const [isEnabled, setEnabled] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleRefundTransaction = async () => {
    try {
      await refundTransaction({ variables: { transaction: { id: props.id } } });
    } catch (error) {
      setError(error);
      return;
    }
    props?.onMutationSuccess();
    setEnabled(false);
  };

  const closeModal = () => {
    setEnabled(false);
    setError(null);
  };

  return (
    <Flex flexDirection="column">
      <Box>
        <Button className="flex gap-1 capitalize" onClick={() => setEnabled(true)}>
          <Undo size={16} />
          <FormattedMessage id="transaction.refund.btn" defaultMessage="refund" />
        </Button>
        {isEnabled && (
          <ConfirmationModal
            onClose={closeModal}
            header={<FormattedMessage id="Refund" defaultMessage="Refund" />}
            body={
              <div>
                <div>
                  <FormattedMessage
                    id="transaction.refund.info"
                    defaultMessage="The contributor will be refunded the full amount."
                  />
                </div>
                {error && <MessageBoxGraphqlError mt="12px" error={error} />}
              </div>
            }
            continueLabel={
              <Flex alignItems="center" justifyContent="space-evenly">
                <Undo size={16} />
                <FormattedMessage id="Refund" defaultMessage="Refund" />
              </Flex>
            }
            continueHandler={handleRefundTransaction}
          />
        )}
      </Box>
    </Flex>
  );
};

export default TransactionRefundButton;
