import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import useProcessExpense from '../../lib/expenses/useProcessExpense';
import type { Expense } from '../../lib/graphql/types/v2/graphql';
import { ExpenseStatus, MarkAsUnPaidExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import { i18nExpenseStatus } from '../../lib/i18n/expense';

import ConfirmationModal from '../ConfirmationModal';
import { Box } from '../Grid';
import RichTextEditor from '../RichTextEditor';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledSelect from '../StyledSelect';
import { Label, P } from '../Text';
import { toast } from '../ui/useToast';

const generateNewExpenseStatusOptions = intl => [
  {
    value: MarkAsUnPaidExpenseStatus.APPROVED,
    label: i18nExpenseStatus(intl, ExpenseStatus.APPROVED),
  },
  {
    value: MarkAsUnPaidExpenseStatus.INCOMPLETE,
    label: i18nExpenseStatus(intl, ExpenseStatus.INCOMPLETE),
  },
  {
    value: MarkAsUnPaidExpenseStatus.ERROR,
    label: i18nExpenseStatus(intl, ExpenseStatus.ERROR),
  },
];

const messages = defineMessages({
  reasonPlaceholder: {
    defaultMessage: 'e.g. Failed transfer',
  },
});

type MarkExpenseAsUnpaidButtonProps = {
  expense: Pick<Expense, 'id' | 'legacyId' | 'permissions'>;
};

const MarkExpenseAsUnpaidButton = ({ expense, ...props }: MarkExpenseAsUnpaidButtonProps) => {
  const intl = useIntl();
  const expenseStatusOptions = React.useMemo(() => generateNewExpenseStatusOptions(intl), [intl]);
  const [newExpenseStatusOption, setNewExpenseStatusOption] = React.useState(expenseStatusOptions[0]);
  const [uploading, setUploading] = React.useState(false);
  const [message, setMessage] = React.useState<string>();
  const [hasModal, setHasModal] = React.useState(false);
  const [refundPaymentProcessorFee, setRefundPaymentProcessorFee] = React.useState(true);

  const processExpense = useProcessExpense({
    expense,
  });

  const onConfirm = React.useCallback(async () => {
    try {
      await processExpense.markAsUnpaid({
        paymentParams: {
          markAsUnPaidStatus: newExpenseStatusOption.value,
          shouldRefundPaymentProcessorFee: refundPaymentProcessorFee,
        },
        message,
      });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }

    setHasModal(false);
  }, [processExpense, newExpenseStatusOption, refundPaymentProcessorFee, message]);

  const button = (
    <StyledButton {...props} buttonStyle="dangerSecondary" onClick={() => setHasModal(true)}>
      <FormattedMessage id="expense.markAsUnpaid.btn" defaultMessage="Mark as unpaid" />
    </StyledButton>
  );

  if (!hasModal) {
    return button;
  }

  return (
    <React.Fragment>
      {button}
      <ConfirmationModal
        id="mark-expense-as-unpaid-modal"
        header={<FormattedMessage id="Expense.markAsUnpaid" defaultMessage="Mark expense as unpaid" />}
        width="100%"
        minWidth={280}
        maxWidth={450}
        isDanger
        onClose={() => setHasModal(false)}
        data-cy="mark-expense-as-unpaid-modal"
        disableSubmit={uploading}
        continueHandler={onConfirm}
      >
        <Label mb={2}>
          <FormattedMessage id="Expense.markAsUnpaid.newStatus" defaultMessage="New status" />
        </Label>
        <Box>
          <StyledSelect
            inputId="new-expense-status"
            options={expenseStatusOptions}
            onChange={(newValue: { value: MarkAsUnPaidExpenseStatus; label: string }) =>
              setNewExpenseStatusOption(newValue)
            }
            value={newExpenseStatusOption}
            width="100%"
          />
        </Box>
        <Box mt={3}>
          <StyledCheckbox
            name="processorFeeRefunded"
            checked={refundPaymentProcessorFee}
            onChange={({ checked }) => setRefundPaymentProcessorFee(checked)}
            label={
              <FormattedMessage
                id="processorFeeRefunded.checkbox.label"
                defaultMessage="Also refund payment processor fees?"
              />
            }
          />
          <P fontSize="14px" lineHeight="18px" color="black.600" ml="1.4rem">
            <FormattedMessage
              id="Expense.markAsUnpaid.details"
              defaultMessage="The amount will be credited back to the Collective balance."
            />
          </P>
        </Box>
        <Box mt={3}>
          <RichTextEditor
            data-cy="confirm-action-text"
            kind="COMMENT"
            version="simplified"
            withBorders
            editorMinHeight={120}
            placeholder={intl.formatMessage(messages.reasonPlaceholder)}
            fontSize="13px"
            onChange={e => setMessage(e.target.value)}
            setUploading={setUploading}
          />
        </Box>
      </ConfirmationModal>
    </React.Fragment>
  );
};

MarkExpenseAsUnpaidButton.propTypes = {
  onConfirm: PropTypes.func.isRequired,
};

export default MarkExpenseAsUnpaidButton;
