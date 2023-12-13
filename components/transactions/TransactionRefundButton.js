import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Undo } from '@styled-icons/boxicons-regular/Undo';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { refundTransactionMutation } from '../../lib/graphql/mutations';

import ConfirmationModal from '../ConfirmationModal';
import { Box, Flex } from '../Grid';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';

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

TransactionRefundButton.propTypes = {
  id: PropTypes.string.isRequired,
  onMutationSuccess: PropTypes.func,
};

export default TransactionRefundButton;
