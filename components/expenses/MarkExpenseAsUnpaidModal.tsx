import React from 'react';
import { Form } from 'formik';
import { round } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { formatCurrency } from '../../lib/currency-utils';
import { i18nGraphqlException } from '../../lib/errors';
import useProcessExpense from '../../lib/expenses/useProcessExpense';
import type { Currency, Expense, ProcessExpensePaymentParams } from '../../lib/graphql/types/v2/graphql';
import { ExpenseStatus, ExpenseType, MarkAsUnPaidExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import { i18nExpenseStatus } from '../../lib/i18n/expense';

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
import { Checkbox } from '../ui/Checkbox';
import { Collapsible, CollapsibleContent } from '../ui/Collapsible';
import { Label } from '../ui/Label';
import { RadioGroup, RadioGroupCard } from '../ui/RadioGroup';
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

const AMOUNT_REFUND_TYPE = {
  FULL: 'full',
  EXPENSE_AMOUNT: 'expense-amount',
  OTHER: 'other',
} as const;

const createMarkAsUnpaidSchema = (totalPaidCents: number, intl: ReturnType<typeof useIntl>) =>
  z
    .object({
      newExpenseStatus: z.nativeEnum(MarkAsUnPaidExpenseStatus),
      amountRefundType: z.enum([AMOUNT_REFUND_TYPE.FULL, AMOUNT_REFUND_TYPE.EXPENSE_AMOUNT, AMOUNT_REFUND_TYPE.OTHER]),
      amountToRefund: z.number(),
      message: z.string().optional(),
      isHostCoveringPaymentProcessorFees: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (data.amountRefundType !== AMOUNT_REFUND_TYPE.OTHER) {
        return;
      }
      if (data.amountToRefund < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amountToRefund'],
          message: intl.formatMessage({ id: 'errors.amountInvalid', defaultMessage: 'Amount must be greater than 0' }),
        });
        return;
      }
      if (data.amountToRefund > totalPaidCents) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amountToRefund'],
          message: intl.formatMessage({
            id: 'errors.amountExceedsTotal',
            defaultMessage: 'Amount refunded cannot exceed the total amount paid',
          }),
        });
      }
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

  const expenseAmountCents = expense.amountInHostCurrency?.valueInCents ?? 0;

  const schema = React.useMemo(() => createMarkAsUnpaidSchema(totalPaidCents, intl), [totalPaidCents, intl]);
  const initialValues: MarkAsUnpaidFormValues = React.useMemo(
    () => ({
      newExpenseStatus: expenseStatusOptions[0]?.value ?? MarkAsUnPaidExpenseStatus.APPROVED,
      amountRefundType: AMOUNT_REFUND_TYPE.FULL,
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
          {({ values, setFieldValue, isSubmitting }) => (
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
                  {() => (
                    <div className="space-y-2">
                      <RadioGroup
                        value={values.amountRefundType}
                        onValueChange={value => {
                          const type = value as MarkAsUnpaidFormValues['amountRefundType'];
                          setFieldValue('amountRefundType', type);
                          if (type === AMOUNT_REFUND_TYPE.FULL) {
                            setFieldValue('amountToRefund', totalPaidCents);
                          } else if (type === AMOUNT_REFUND_TYPE.EXPENSE_AMOUNT) {
                            setFieldValue('amountToRefund', expenseAmountCents);
                          } else if (type === AMOUNT_REFUND_TYPE.OTHER) {
                            setFieldValue('amountToRefund', values.amountToRefund || expenseAmountCents);
                          }
                        }}
                        className="flex flex-col gap-2"
                      >
                        <RadioGroupCard value={AMOUNT_REFUND_TYPE.FULL} className="flex flex-col">
                          <div>
                            <FormattedMessage id="expense.markAsUnpaid.fullAmount" defaultMessage="Full amount" />
                            <p className="text-xs text-muted-foreground">
                              <strong>{formatCurrency(totalPaidCents, hostCurrency as Currency)}</strong>
                              {processorFeeCents > 0 && (
                                <FormattedMessage
                                  defaultMessage=" (including {fee} processor fees)"
                                  id="expense.markAsUnpaid.fullAmount.helper"
                                  values={{ fee: formatCurrency(processorFeeCents, hostCurrency as Currency) }}
                                />
                              )}
                            </p>
                          </div>
                        </RadioGroupCard>
                        {processorFeeCents > 0 && (
                          <RadioGroupCard value={AMOUNT_REFUND_TYPE.EXPENSE_AMOUNT} className="flex flex-col">
                            <div>
                              <FormattedMessage
                                id="expense.markAsUnpaid.expenseAmountWithoutFees"
                                defaultMessage="Expense amount"
                              />
                              <p className="text-xs text-muted-foreground">
                                <strong>{formatCurrency(expenseAmountCents, hostCurrency as Currency)}</strong>
                                <FormattedMessage
                                  defaultMessage=" ({fee} processor fees were not refunded)"
                                  id="4GGoUc"
                                  values={{ fee: formatCurrency(processorFeeCents, hostCurrency as Currency) }}
                                />
                              </p>
                            </div>
                          </RadioGroupCard>
                        )}
                        <RadioGroupCard
                          value={AMOUNT_REFUND_TYPE.OTHER}
                          showSubcontent={values.amountRefundType === AMOUNT_REFUND_TYPE.OTHER}
                          subContent={
                            <FormField name="amountToRefund" className="mt-1">
                              {({ meta: amountMeta }) => (
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
                                    error={Boolean(amountMeta.error)}
                                  />
                                  {amountMeta.error && (
                                    <p className="mt-1 pl-2 text-xs text-red-500">{amountMeta.error}</p>
                                  )}
                                </div>
                              )}
                            </FormField>
                          }
                          className="flex flex-col"
                        >
                          <FormattedMessage id="expense.markAsUnpaid.otherAmount" defaultMessage="Other" />
                        </RadioGroupCard>
                      </RadioGroup>
                    </div>
                  )}
                </FormField>

                <Collapsible open={values.amountToRefund < totalPaidCents}>
                  <CollapsibleContent>
                    <FormField
                      name="isHostCoveringPaymentProcessorFees"
                      label={
                        <FormattedMessage
                          id="expense.markAsUnpaid.coverProcessorFees"
                          defaultMessage="Cover lost payment processor fees"
                        />
                      }
                    >
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
                              className="cursor-pointer text-xs text-muted-foreground"
                            >
                              <FormattedMessage
                                id="expense.markAsUnpaid.coverProcessorFees.helper"
                                defaultMessage="Restore the collective's full balance, covering the {feeAmount} non-refunded processor fees from the host budget."
                                values={{
                                  feeAmount: formatCurrency(
                                    round(totalPaidCents - values.amountToRefund, 2),
                                    hostCurrency as Currency,
                                  ),
                                }}
                              />
                            </Label>
                          </div>
                        </div>
                      )}
                    </FormField>
                  </CollapsibleContent>
                </Collapsible>

                <FormField
                  name="message"
                  label={<FormattedMessage id="expense.markAsUnpaid.reason" defaultMessage="Reason" />}
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
                  disabled={
                    uploading || (values.amountRefundType === AMOUNT_REFUND_TYPE.OTHER && values.amountToRefund <= 0)
                  }
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
