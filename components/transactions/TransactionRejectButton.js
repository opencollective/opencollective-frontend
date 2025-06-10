import React from 'react';
import { useMutation } from '@apollo/client';
import { MinusCircle } from '@styled-icons/boxicons-regular/MinusCircle';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import ConfirmationModal from '../ConfirmationModal';
import { Flex } from '../Grid';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledTooltip from '../StyledTooltip';
import { P } from '../Text';
import { Button } from '../ui/Button';

import TransactionRejectMessageForm from './TransactionRejectMessageForm';

const tooltipContent = () => (
  <div>
    <P fontSize="12px" lineHeight="18px">
      <FormattedMessage
        id="transaction.reject.info"
        defaultMessage="Only reject if you want to remove the contributor from your Collective. This will refund their transaction, remove them from your Collective, and display the contribution as 'rejected'."
      />
    </P>
  </div>
);

const rejectTransactionMutation = gql`
  mutation RejectTransaction($transaction: TransactionReferenceInput!, $message: String) {
    rejectTransaction(transaction: $transaction, message: $message) {
      id
    }
  }
`;

const TransactionRejectButton = props => {
  const [rejectTransaction, { error: mutationError }] = useMutation(rejectTransactionMutation, {
    context: API_V2_CONTEXT,
  });
  const [isEnabled, setEnabled] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    setError(mutationError);
  }, [mutationError]);

  const handleRejectTransaction = async () => {
    await rejectTransaction({
      variables: {
        transaction: { id: props.id },
        message,
      },
    });
    props.onMutationSuccess();
    setEnabled(false);
  };

  const closeModal = () => {
    setEnabled(false);
    setError(null);
  };

  return (
    <div>
      <StyledTooltip content={tooltipContent}>
        <Button variant="outlineDestructive" className="gap-1 capitalize" onClick={() => setEnabled(true)}>
          <MinusCircle size={16} />
          <FormattedMessage id="actions.reject" defaultMessage="Reject" />
        </Button>
      </StyledTooltip>
      {isEnabled && (
        <ConfirmationModal
          onClose={closeModal}
          header={<FormattedMessage id="RejectContribution" defaultMessage="Reject and refund" />}
          body={
            <React.Fragment>
              <Flex flexDirection="column" alignItems="center" justifyContent="center">
                <MessageBox type="warning" mx={2}>
                  <FormattedMessage
                    id="transaction.reject.info"
                    defaultMessage="Only reject if you want to remove the contributor from your Collective. This will refund their transaction, remove them from your Collective, and display the contribution as 'rejected'."
                  />
                  <br />
                  <br />
                  {props.canRefund ? (
                    <FormattedMessage
                      id="transaction.reject.info.canRefund"
                      defaultMessage="If you are only trying to refund a mistaken transaction, please use the 'Refund' button instead."
                    />
                  ) : (
                    <FormattedMessage
                      id="transaction.reject.info.cannotRefund"
                      defaultMessage="Please only use this option if you do not wish for this contributor to be a part of your Collective. This will remove them from your Collective."
                    />
                  )}
                </MessageBox>
                {error && <MessageBoxGraphqlError mt="12px" error={error} />}
                <div className="mt-4 w-full">
                  <TransactionRejectMessageForm message={message} onChange={message => setMessage(message)} />
                </div>
              </Flex>
            </React.Fragment>
          }
          continueLabel={
            <Flex alignItems="center" justifyContent="space-evenly">
              <MinusCircle size={16} />
              <FormattedMessage id="transaction.reject.yes.btn" defaultMessage="Yes, reject" />
            </Flex>
          }
          continueHandler={handleRejectTransaction}
          isDanger
        />
      )}
    </div>
  );
};

export default TransactionRejectButton;
