import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { MinusCircle } from '@styled-icons/boxicons-regular/MinusCircle';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import ConfirmationModal from '../ConfirmationModal';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';
import StyledTooltip from '../StyledTooltip';
import { P } from '../Text';

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

export const rejectTransactionMutation = gqlV2/* GraphQL */ `
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
    <Flex flexDirection="column">
      <Box>
        <StyledTooltip content={tooltipContent}>
          <StyledButton
            buttonSize="small"
            buttonStyle="dangerSecondary"
            minWidth={140}
            background="transparent"
            textTransform="capitalize"
            onClick={() => setEnabled(true)}
            ml={props.canRefund ? 2 : 0}
          >
            <Flex alignItems="center" justifyContent="space-evenly">
              <MinusCircle size={16} />
              <FormattedMessage id="actions.reject" defaultMessage="Reject" />
            </Flex>
          </StyledButton>
        </StyledTooltip>
        <ConfirmationModal
          show={isEnabled}
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
                <TransactionRejectMessageForm message={message} onChange={message => setMessage(message)} />
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
      </Box>
    </Flex>
  );
};

TransactionRejectButton.propTypes = {
  id: PropTypes.string.isRequired,
  canRefund: PropTypes.bool,
  onMutationSuccess: PropTypes.func,
};

export default TransactionRejectButton;
