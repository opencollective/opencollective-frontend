import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';
import { i18nGraphqlException } from '../../lib/errors';
import useProcessExpense from '../../lib/expenses/useProcessExpense';
import type { Currency as CurrencyEnum, Expense } from '../../lib/graphql/types/v2/schema';
import { ExpenseStatus, ExpenseType, MarkAsUnPaidExpenseStatus } from '../../lib/graphql/types/v2/schema';
import { i18nExpenseStatus } from '../../lib/i18n/expense';

import InputAmount from '../InputAmount';
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
import { Input } from '../ui/Input';
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
  amountRefundedLabel: {
    id: 'expense.markAsUnpaid.amountRefunded',
    defaultMessage: 'Amount refunded',
  },
  originalProcessorFeeHelper: {
    id: 'expense.markAsUnpaid.originalProcessorFee',
    defaultMessage: 'Original payment processor fee: {amount}',
  },
});

type ExpenseWithPaymentInfo = Pick<Expense, 'id' | 'legacyId' | 'type'> & {
  amountInHostCurrency?: { valueInCents: number; currency: string } | null;
  paymentInfo?: { processorFee: { valueInCents: number; currency: string } } | null;
};

type MarkExpenseAsUnpaidModalProps = BaseModalProps & {
  expense: ExpenseWithPaymentInfo;
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
  const [submitting, setSubmitting] = React.useState(false);

  const totalPaidCents =
    (expense.amountInHostCurrency?.valueInCents ?? 0) + (expense.paymentInfo?.processorFee?.valueInCents ?? 0);
  const hostCurrency = expense.amountInHostCurrency?.currency ?? expense.paymentInfo?.processorFee?.currency ?? 'USD';
  const processorFeeCents = expense.paymentInfo?.processorFee?.valueInCents ?? 0;

  const [amountRefundedDisplay, setAmountRefundedDisplay] = React.useState<string>(() =>
    totalPaidCents > 0 ? (totalPaidCents / 100).toString() : '',
  );

  React.useEffect(() => {
    if (open && totalPaidCents > 0) {
      setAmountRefundedDisplay((totalPaidCents / 100).toString());
    }
  }, [open, totalPaidCents]);

  const processExpense = useProcessExpense({
    expense,
  });

  const onConfirm = React.useCallback(async () => {
    const parsed = parseFloat(amountRefundedDisplay);
    const amountRefundedCents = Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
    if (amountRefundedCents <= 0) {
      toast({
        variant: 'error',
        message: intl.formatMessage({ id: 'errors.amountInvalid', defaultMessage: 'Amount must be greater than 0' }),
      });
      return;
    }
    if (totalPaidCents > 0 && amountRefundedCents > totalPaidCents) {
      toast({
        variant: 'error',
        message: intl.formatMessage({
          id: 'errors.amountExceedsTotal',
          defaultMessage: 'Amount refunded cannot exceed the total amount paid',
        }),
      });
      return;
    }
    try {
      setSubmitting(true);
      await processExpense.markAsUnpaid({
        paymentParams: {
          markAsUnPaidStatus: newExpenseStatusOption.value,
          amountRefunded: {
            valueInCents: amountRefundedCents,
            currency: hostCurrency as unknown as CurrencyEnum,
          },
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
  }, [
    processExpense,
    newExpenseStatusOption,
    amountRefundedDisplay,
    totalPaidCents,
    hostCurrency,
    message,
    intl,
    onSuccess,
    setOpen,
  ]);

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

          <div>
            <Label htmlFor="amount-refunded" className="mb-2">
              <FormattedMessage {...messages.amountRefundedLabel} />
            </Label>
            <InputAmount
              id="amount-refunded"
              data-cy="amount-refunded-input"
              type="number"
              min={0.01}
              currency={hostCurrency}
              max={totalPaidCents > 0 ? totalPaidCents / 100 : undefined}
              step="0.01"
              value={totalPaidCents}
              onChange={e => setAmountRefundedDisplay(e.target.value)}
              placeholder={totalPaidCents > 0 ? (totalPaidCents / 100).toString() : undefined}
            />
            {processorFeeCents > 0 && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                <FormattedMessage
                  defaultMessage="Expense amount: {amount}. Paid processor fees: {processorFeeAmount}."
                  id="wTeO7u"
                  values={{
                    amount: formatCurrency(
                      expense.amountInHostCurrency.valueInCents,
                      expense.amountInHostCurrency.currency,
                    ),
                    processorFeeAmount: formatCurrency(processorFeeCents, hostCurrency as unknown as CurrencyEnum),
                  }}
                />
              </p>
            )}
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
