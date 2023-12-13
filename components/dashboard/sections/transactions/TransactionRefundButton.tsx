import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Undo } from '@styled-icons/boxicons-regular/Undo';
import { Undo2 } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { refundTransactionMutation } from '../../../../lib/graphql/mutations';

import ConfirmationModal from '../../../ConfirmationModal';
import { Box, Flex } from '../../../Grid';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';

const TransactionRefundButton = props => {
  const [refundTransaction] = useMutation(refundTransactionMutation, {
    context: API_V2_CONTEXT,
  });
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleRefundTransaction = async () => {
    try {
      await refundTransaction({ variables: { transaction: { id: props.id } } });
    } catch (error) {
      setError(error);
      return;
    }
    props?.onMutationSuccess();
    setOpen(false);
  };

  const closeModal = () => {
    setOpen(false);
    setError(null);
  };

  return (
    <Flex flexDirection="column">
      <Box>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="xs" className="gap-1" onClick={() => setOpen(true)}>
              <Undo2 size={16} />
              <span>
                <FormattedMessage id="Refund" defaultMessage="Refund" />
              </span>
            </Button>
          </TooltipTrigger>

          <TooltipContent className="max-w-xs">
            <FormattedMessage defaultMessage="Refunding will reimburse the full amount back to your contributor. They can contribute again in the future." />
          </TooltipContent>
        </Tooltip>

        {open && (
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
