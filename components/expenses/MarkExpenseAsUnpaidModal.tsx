import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import useProcessExpense from '../../lib/expenses/useProcessExpense';
import type { Expense } from '../../lib/graphql/types/v2/schema';
import { ExpenseStatus, ExpenseType, MarkAsUnPaidExpenseStatus } from '../../lib/graphql/types/v2/schema';
import { i18nExpenseStatus } from '../../lib/i18n/expense';

import type { BaseModalProps } from '../ModalContext';
import RichTextEditor from '../RichTextEditor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/AlertDialog';
import { Checkbox } from '../ui/Checkbox';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
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

type MarkExpenseAsUnpaidModalProps = BaseModalProps & {
  expense: Pick<Expense, 'id' | 'legacyId' | 'type'>;
  onSuccess?: () => void;
};

export default function MarkExpenseAsUnpaidModal({
  expense,
  open,
  setOpen,
  onSuccess,
  onCloseFocusRef,
}: MarkExpenseAsUnpaidModalProps) {
  const intl = useIntl();
  const expenseStatusOptions = React.useMemo(() => generateNewExpenseStatusOptions(intl, expense), [intl, expense]);
  const [newExpenseStatusOption, setNewExpenseStatusOption] = React.useState(expenseStatusOptions[0]);
  const [uploading, setUploading] = React.useState(false);
  const [message, setMessage] = React.useState<string>();
  const [refundPaymentProcessorFee, setRefundPaymentProcessorFee] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const processExpense = useProcessExpense({
    expense,
  });

  const onConfirm = React.useCallback(async () => {
    try {
      setSubmitting(true);
      await processExpense.markAsUnpaid({
        paymentParams: {
          markAsUnPaidStatus: newExpenseStatusOption.value,
          shouldRefundPaymentProcessorFee: refundPaymentProcessorFee,
        },
        message,
      });
      onSuccess?.();
      setOpen(false);
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    } finally {
      setSubmitting(false);
    }
  }, [processExpense, newExpenseStatusOption, refundPaymentProcessorFee, message, intl, onSuccess, setOpen]);

  const onCloseAutoFocus = (e: Event) => {
    if (onCloseFocusRef?.current) {
      e.preventDefault();
      onCloseFocusRef.current.focus();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent
        id="mark-expense-as-unpaid-modal"
        data-cy="mark-expense-as-unpaid-modal"
        onCloseAutoFocus={onCloseAutoFocus}
        className="max-w-md"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            <FormattedMessage id="Expense.markAsUnpaid" defaultMessage="Mark expense as unpaid" />
          </AlertDialogTitle>
          <AlertDialogDescription>
            <FormattedMessage
              id="Expense.markAsUnpaid.details"
              defaultMessage="The amount will be credited back to the Collective balance."
            />
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="new-expense-status" className="mb-2">
              <FormattedMessage id="Expense.markAsUnpaid.newStatus" defaultMessage="New status" />
            </Label>
            <Select
              value={newExpenseStatusOption.value}
              onValueChange={value => {
                const option = expenseStatusOptions.find(opt => opt.value === value);
                if (option) {
                  setNewExpenseStatusOption(option);
                }
              }}
            >
              <SelectTrigger id="new-expense-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expenseStatusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="processorFeeRefunded"
              name="processorFeeRefunded"
              checked={refundPaymentProcessorFee}
              onCheckedChange={checked => setRefundPaymentProcessorFee(Boolean(checked))}
            />
            <Label htmlFor="processorFeeRefunded" className="cursor-pointer font-normal">
              <FormattedMessage
                id="processorFeeRefunded.checkbox.label"
                defaultMessage="Also refund payment processor fees?"
              />
            </Label>
          </div>

          <div>
            <RichTextEditor
              data-cy="confirm-action-text"
              kind="COMMENT"
              version="simplified"
              withBorders
              editorMinHeight={100}
              placeholder={intl.formatMessage(messages.reasonPlaceholder)}
              fontSize="13px"
              onChange={e => setMessage(e.target.value)}
              setUploading={setUploading}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting || uploading}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            loading={submitting}
            disabled={uploading}
            data-cy="confirmation-modal-continue"
            onClick={async e => {
              e.preventDefault();
              await onConfirm();
            }}
          >
            <FormattedMessage id="expense.markAsUnpaid.btn" defaultMessage="Mark as unpaid" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
