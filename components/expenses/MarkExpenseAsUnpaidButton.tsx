import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import useProcessExpense from '../../lib/expenses/useProcessExpense';
import type { Expense } from '../../lib/graphql/types/v2/schema';
import { ExpenseStatus, ExpenseType, MarkAsUnPaidExpenseStatus } from '../../lib/graphql/types/v2/schema';
import { i18nExpenseStatus } from '../../lib/i18n/expense';

import ConfirmationModal from '../ConfirmationModal';
import { Box } from '../Grid';
import RichTextEditor from '../RichTextEditor';
import StyledCheckbox from '../StyledCheckbox';
import StyledInputAmount from '../StyledInputAmount';
import StyledSelect from '../StyledSelect';
import { Label, P } from '../Text';
import { Button } from '../ui/Button';
import { toast } from '../ui/useToast';

const generateNewExpenseStatusOptions = (intl, expense) => {
  if (expense.type === ExpenseType.CHARGE) {
    return [
      {
        value: MarkAsUnPaidExpenseStatus.ERROR,
        label: i18nExpenseStatus(intl, ExpenseStatus.ERROR),
      },
    ];
  }

  return [
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
};

const messages = defineMessages({
  reasonPlaceholder: {
    defaultMessage: 'e.g. Failed transfer',
    id: 'mOdpl+',
  },
});

type MarkExpenseAsUnpaidButtonProps = {
  expense: Pick<Expense, 'id' | 'legacyId' | 'permissions' | 'currency' | 'type'>;
};

const MarkExpenseAsUnpaidButton = ({ expense, ...props }: MarkExpenseAsUnpaidButtonProps) => {
  const intl = useIntl();
  const expenseStatusOptions = React.useMemo(() => generateNewExpenseStatusOptions(intl, expense), [intl, expense]);
  const [newExpenseStatusOption, setNewExpenseStatusOption] = React.useState(expenseStatusOptions[0]);
  const [uploading, setUploading] = React.useState(false);
  const [message, setMessage] = React.useState<string>();
  const [hasModal, setHasModal] = React.useState(false);
  const [refundPaymentProcessorFee, setRefundPaymentProcessorFee] = React.useState(true);
  const [refundedPaymentProcessorFeeAmount, setRefundedPaymentProcessorFeeAmount] = React.useState<number | null>(null);

  const processExpense = useProcessExpense({
    expense,
  });

  const onConfirm = React.useCallback(async () => {
    try {
      await processExpense.markAsUnpaid({
        paymentParams: {
          markAsUnPaidStatus: newExpenseStatusOption.value,
          shouldRefundPaymentProcessorFee: refundPaymentProcessorFee,
          refundedPaymentProcessorFeeAmount: refundPaymentProcessorFee ? refundedPaymentProcessorFeeAmount : null,
        },
        message,
      });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }

    setHasModal(false);
  }, [processExpense, newExpenseStatusOption, refundPaymentProcessorFee, refundedPaymentProcessorFeeAmount, message, intl]);

  const button = (
    <Button {...props} variant="outlineDestructive" onClick={() => setHasModal(true)}>
      <FormattedMessage id="expense.markAsUnpaid.btn" defaultMessage="Mark as unpaid" />
    </Button>
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
          {refundPaymentProcessorFee && (
            <Box mt={2} ml="1.4rem">
              <Label mb={1}>
                <FormattedMessage
                  id="refundedPaymentProcessorFeeAmount.label"
                  defaultMessage="Refunded processor fee amount"
                />
              </Label>
              <StyledInputAmount
                id="refunded-processor-fee-amount"
                currency={expense.currency || 'USD'}
                value={refundedPaymentProcessorFeeAmount}
                onChange={value => setRefundedPaymentProcessorFeeAmount(value)}
                placeholder="0.00"
              />
            </Box>
          )}
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

export default MarkExpenseAsUnpaidButton;
