import React from 'react';
import { Form } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { formatCurrency } from '../../lib/currency-utils';
import { i18nGraphqlException } from '../../lib/errors';
import useProcessExpense from '../../lib/expenses/useProcessExpense';
import type { Currency, Expense, ProcessExpensePaymentParams } from '../../lib/graphql/types/v2/graphql';
import { ExpenseStatus, ExpenseType, MarkAsUnPaidExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import { i18nExpenseStatus } from '../../lib/i18n/expense';
import { cn } from '@/lib/utils';

import { FormField } from '../FormField';
import { FormikZod } from '../FormikZod';
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
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Collapsible, CollapsibleContent } from '../ui/Collapsible';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Separator } from '../ui/Separator';
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

type MarkExpenseAsUnpaidModalExpense = Pick<Expense, 'id' | 'legacyId' | 'type'> & {
  amountInHostCurrency?: { valueInCents?: number; currency?: string } | null;
  paymentInfo?: { processorFee?: { valueInCents?: number; currency?: string } | null } | null;
};

type MarkExpenseAsUnpaidModalProps = BaseModalProps & {
  expense: MarkExpenseAsUnpaidModalExpense;
  onSuccess?: () => void;
};

const createMarkAsUnpaidSchema = (totalPaidCents: number, intl: ReturnType<typeof useIntl>) =>
  z.object({
    newExpenseStatus: z.nativeEnum(MarkAsUnPaidExpenseStatus),
    amountToRefund: z
      .number()
      .min(1, {
        message: intl.formatMessage({ id: 'errors.amountInvalid', defaultMessage: 'Amount must be greater than 0' }),
      })
      .max(totalPaidCents, {
        message: intl.formatMessage({
          id: 'errors.amountExceedsTotal',
          defaultMessage: 'Amount refunded cannot exceed the total amount paid',
        }),
      }),
    message: z.string().optional(),
    isHostCoveringPaymentProcessorFees: z.boolean(),
  });

export type MarkAsUnpaidFormValues = z.infer<ReturnType<typeof createMarkAsUnpaidSchema>>;

export default function MarkExpenseAsUnpaidModal({
  expense,
  open,
  setOpen,
  onSuccess,
  onCloseFocusRef,
}: MarkExpenseAsUnpaidModalProps) {
  const intl = useIntl();
  const expenseStatusOptions = React.useMemo(() => generateNewExpenseStatusOptions(intl, expense), [intl, expense]);
  const [uploading, setUploading] = React.useState(false);

  const totalPaidCents =
    (expense.amountInHostCurrency?.valueInCents ?? 0) + (expense.paymentInfo?.processorFee?.valueInCents ?? 0);
  const hostCurrency = expense.amountInHostCurrency?.currency ?? expense.paymentInfo?.processorFee?.currency;
  const processorFeeCents = expense.paymentInfo?.processorFee?.valueInCents ?? 0;

  const schema = React.useMemo(() => createMarkAsUnpaidSchema(totalPaidCents, intl), [totalPaidCents, intl]);
  const initialValues: MarkAsUnpaidFormValues = React.useMemo(
    () => ({
      newExpenseStatus: expenseStatusOptions[0]?.value ?? MarkAsUnPaidExpenseStatus.APPROVED,
      amountToRefund: totalPaidCents,
      message: undefined,
      isHostCoveringPaymentProcessorFees: true,
    }),
    [expenseStatusOptions, totalPaidCents],
  );

  const processExpense = useProcessExpense({
    expense,
  });

  const onSubmit = React.useCallback(
    async (values: MarkAsUnpaidFormValues) => {
      try {
        await processExpense.markAsUnpaid({
          paymentParams: {
            markAsUnPaidStatus: values.newExpenseStatus,
            amountRefunded: {
              valueInCents: values.amountToRefund,
              currency: hostCurrency as unknown as Currency,
            },
            isHostCoveringPaymentProcessorFees: values.isHostCoveringPaymentProcessorFees,
          } as unknown as ProcessExpensePaymentParams, // amountRefunded & isHostCoveringPaymentProcessorFees exist in API schema
          message: values.message,
        });
        onSuccess?.();
        setOpen(false);
      } catch (e) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
      }
    },
    [processExpense, hostCurrency, intl, onSuccess, setOpen],
  );

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
        <FormikZod<MarkAsUnpaidFormValues>
          key={open ? `open-${expense.id}` : 'closed'}
          schema={schema}
          initialValues={initialValues}
          onSubmit={onSubmit}
          enableReinitialize
          validateOnChange
        >
          {({ values, setFieldValue, errors, isSubmitting }) => (
            <Form>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  <FormattedMessage id="Expense.markAsUnpaid" defaultMessage="Mark expense as unpaid" />
                </AlertDialogTitle>
                <AlertDialogDescription className="mb-4">
                  <FormattedMessage
                    id="Expense.markAsUnpaid.details"
                    defaultMessage="The amount will be credited back to the Collective balance."
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4">
                <FormField
                  name="newExpenseStatus"
                  label={<FormattedMessage id="Expense.markAsUnpaid.newStatus" defaultMessage="New status" />}
                  htmlFor="new-expense-status"
                >
                  {() => (
                    <Select
                      value={values.newExpenseStatus}
                      onValueChange={value => {
                        const option = expenseStatusOptions.find(opt => opt.value === value);
                        if (option) {
                          setFieldValue('newExpenseStatus', option.value);
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
                  )}
                </FormField>

                <FormField
                  name="amountToRefund"
                  label={intl.formatMessage({
                    id: 'expense.markAsUnpaid.amountRefunded',
                    defaultMessage: 'Amount refunded',
                  })}
                >
                  {({ meta }) => (
                    <div>
                      <InputAmount
                        id="amount-refunded"
                        data-cy="amount-refunded-input"
                        type="number"
                        currency={hostCurrency}
                        min={1}
                        max={totalPaidCents}
                        value={values.amountToRefund}
                        onChange={value => setFieldValue('amountToRefund', value)}
                        required={true}
                        error={Boolean(meta.error)}
                      />
                      {meta.error && <p className="mt-1 pl-2 text-xs text-red-500">{meta.error}</p>}
                      {processorFeeCents > 0 && (
                        <ul className="mt-1.5 list-inside list-disc space-y-0.5 pl-3 text-xs text-muted-foreground">
                          <li>
                            <FormattedMessage
                              defaultMessage="Total amount: {total} (including {fee} processor fees)"
                              id="expense.markAsUnpaid.totalAmount"
                              values={{
                                total: (
                                  <Button
                                    type="button"
                                    variant="link"
                                    className="h-auto p-0 text-xs text-muted-foreground underline hover:text-foreground"
                                    onClick={() => setFieldValue('amountToRefund', totalPaidCents)}
                                  >
                                    {formatCurrency(totalPaidCents, hostCurrency as Currency)}
                                  </Button>
                                ),
                                fee: formatCurrency(processorFeeCents, hostCurrency as Currency),
                              }}
                            />
                          </li>
                          <li>
                            <FormattedMessage
                              defaultMessage="Expense amount: {expenseAmount}"
                              id="expense.markAsUnpaid.expenseAmount"
                              values={{
                                expenseAmount: (
                                  <Button
                                    type="button"
                                    variant="link"
                                    className="h-auto p-0 text-xs text-muted-foreground underline hover:text-foreground"
                                    onClick={() =>
                                      setFieldValue('amountToRefund', expense.amountInHostCurrency?.valueInCents ?? 0)
                                    }
                                  >
                                    {formatCurrency(
                                      expense.amountInHostCurrency?.valueInCents ?? 0,
                                      (expense.amountInHostCurrency?.currency ?? hostCurrency) as Currency,
                                    )}
                                  </Button>
                                ),
                              }}
                            />
                          </li>
                        </ul>
                      )}
                    </div>
                  )}
                </FormField>

                <Collapsible open={values.amountToRefund < totalPaidCents}>
                  <CollapsibleContent>
                    <FormField name="isHostCoveringPaymentProcessorFees">
                      {() => (
                        <div className="flex items-start gap-3 space-y-0 rounded-md border p-4">
                          <Checkbox
                            id="cover-processor-fees"
                            data-cy="cover-processor-fees-checkbox"
                            checked={values.isHostCoveringPaymentProcessorFees}
                            onCheckedChange={checked =>
                              setFieldValue('isHostCoveringPaymentProcessorFees', checked === true)
                            }
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label
                              htmlFor="cover-processor-fees"
                              className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              <FormattedMessage
                                id="expense.markAsUnpaid.coverProcessorFees"
                                defaultMessage="Cover lost payment processor fees"
                              />
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              <FormattedMessage
                                id="expense.markAsUnpaid.coverProcessorFees.helper"
                                defaultMessage="Check this to restore the collective's full balance, covering the processor fees from the host budget."
                              />
                            </p>
                          </div>
                        </div>
                      )}
                    </FormField>
                    <p className="mt-2 text-sm text-muted-foreground italic">
                      {values.isHostCoveringPaymentProcessorFees ? (
                        <FormattedMessage
                          id="expense.markAsUnpaid.summary.hostCoveringFees"
                          defaultMessage="The collective will be refunded {amount}, including {paymentProcessorFees} in non-refunded payment processor fees covered by the host budget."
                          values={{
                            amount: formatCurrency(totalPaidCents, hostCurrency as Currency),
                            paymentProcessorFees: formatCurrency(processorFeeCents, hostCurrency as Currency),
                          }}
                        />
                      ) : (
                        <FormattedMessage
                          id="expense.markAsUnpaid.summary.hostNotCoveringFees"
                          defaultMessage="The collective will be refunded {amount}. The {paymentProcessorFees} in non-refunded payment processor fees are lost."
                          values={{
                            amount: formatCurrency(values.amountToRefund, hostCurrency as Currency),
                            paymentProcessorFees: formatCurrency(processorFeeCents, hostCurrency as Currency),
                          }}
                        />
                      )}
                    </p>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-6" />

                <FormField
                  name="message"
                  label={<FormattedMessage id="expense.markAsUnpaid.reason" defaultMessage="Reason (optional)" />}
                >
                  {() => (
                    <RichTextEditor
                      data-cy="confirm-action-text"
                      kind="COMMENT"
                      version="simplified"
                      withBorders
                      editorMinHeight={100}
                      placeholder={intl.formatMessage({ id: 'mOdpl+', defaultMessage: 'e.g. Failed transfer' })}
                      fontSize="13px"
                      onChange={e => setFieldValue('message', e.target.value)}
                      setUploading={setUploading}
                    />
                  )}
                </FormField>
              </div>

              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel type="button" disabled={isSubmitting || uploading}>
                  <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                </AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  variant="destructive"
                  loading={isSubmitting}
                  disabled={uploading || values.amountToRefund <= 0}
                  data-cy="confirmation-modal-continue"
                >
                  <FormattedMessage id="expense.markAsUnpaid.btn" defaultMessage="Mark as unpaid" />
                </AlertDialogAction>
              </AlertDialogFooter>
            </Form>
          )}
        </FormikZod>
      </AlertDialogContent>
    </AlertDialog>
  );
}
