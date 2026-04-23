import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form, useFormikContext } from 'formik';
import { Info } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import type {
  ManageContributionModalQuery,
  ManageContributionModalQueryVariables,
  ManageOrderMutation,
  ManageOrderMutationVariables,
  ManageOrderRefundErrorCode,
  TierFrequency,
} from '../../../../lib/graphql/types/v2/graphql';
import { ContributionFrequency, OrderStatus } from '../../../../lib/graphql/types/v2/graphql';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { FormField } from '../../../FormField';
import { FormikZod } from '../../../FormikZod';
import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import type { BaseModalProps } from '../../../ModalContext';
import OrderStatusTag from '../../../orders/OrderStatusTag';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Collapsible, CollapsibleContent } from '../../../ui/Collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { Switch } from '../../../ui/Switch';
import { Textarea } from '../../../ui/Textarea';
import { useToast } from '../../../ui/useToast';

import { manageContributionModalQuery, manageOrderMutation } from './queries';

const i18nRefundErrorCode = defineMessages({
  ALREADY_REFUNDED: {
    defaultMessage: 'This transaction has already been refunded.',
    id: 'ManageOrder.RefundError.ALREADY_REFUNDED',
  },
  CHARGED_BACK: {
    defaultMessage: 'This transaction has been charged back and cannot be refunded.',
    id: 'ManageOrder.RefundError.CHARGED_BACK',
  },
  STRIPE_REFUND_WINDOW_EXPIRED: {
    defaultMessage: 'Stripe no longer allows refunds for this charge (window expired).',
    id: 'ManageOrder.RefundError.STRIPE_REFUND_WINDOW_EXPIRED',
  },
  INSUFFICIENT_FUNDS: {
    defaultMessage: 'The Collective does not have enough funds to refund this transaction.',
    id: 'ManageOrder.RefundError.INSUFFICIENT_FUNDS',
  },
  PAYMENT_PROCESSOR_UNSUPPORTED: {
    defaultMessage: 'The payment provider used for this transaction does not support refunds.',
    id: 'ManageOrder.RefundError.PAYMENT_PROCESSOR_UNSUPPORTED',
  },
  UNKNOWN: {
    defaultMessage: 'An unknown error happened while refunding this transaction.',
    id: 'ManageOrder.RefundError.UNKNOWN',
  },
});

type OrderData = NonNullable<ManageContributionModalQuery['order']>;
type OrderTransaction = NonNullable<OrderData['transactions']>[number];

type ManageContributionModalProps = BaseModalProps & {
  order: { id: string; legacyId?: number };
  onSuccess?: () => void;
};

const ManageContributionFormSchema = z.object({
  cancel: z.boolean(),
  refundEnabled: z.boolean(),
  selectedTxnIds: z.array(z.string()),
  removeAsContributor: z.boolean(),
  message: z.string().max(2000).optional(),
});

type ManageContributionFormValues = z.infer<typeof ManageContributionFormSchema>;

type RefundError = { code: ManageOrderRefundErrorCode; message: string; transactionId: string };

type PartialFailure = {
  cancelled: boolean;
  removedAsContributor: boolean;
  errors: RefundError[];
};

const isRefundableCharge = (tx: OrderTransaction): boolean => {
  return Boolean(tx.permissions?.canRefund && !tx.isRefund && !tx.isRefunded);
};

const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={`rounded-lg border border-border bg-background p-4 ${className ?? ''}`}>{children}</div>
);

const DetailRow: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
  emphasized?: boolean;
}> = ({ label, value, emphasized }) => (
  <div
    className={`flex items-center justify-between text-sm ${
      emphasized ? 'border-t border-border pt-2 font-semibold' : 'text-muted-foreground'
    }`}
  >
    <span>{label}</span>
    <span className={emphasized ? 'text-foreground' : 'text-foreground'}>{value}</span>
  </div>
);

const SignedMoneyAmount: React.FC<{
  amount: number;
  currency: string;
  sign: 'positive' | 'negative';
  amountClassName?: string;
  showCurrencyCode?: boolean;
}> = ({ amount, currency, sign, amountClassName, showCurrencyCode }) => (
  <span>
    {sign === 'positive' && <span className={amountClassName}>+</span>}
    <FormattedMoneyAmount
      amount={sign === 'negative' ? -Math.abs(amount) : Math.abs(amount)}
      currency={currency}
      showCurrencyCode={showCurrencyCode}
      amountClassName={amountClassName}
    />
  </span>
);

type ManageContributionFormProps = {
  order: OrderData;
  refundableTxns: OrderTransaction[];
  currency?: string;
  canCancel: boolean;
  isRecurring: boolean;
  partialFailure: PartialFailure | null;
  onClose: () => void;
};

const ManageContributionForm: React.FC<ManageContributionFormProps> = ({
  order,
  refundableTxns,
  currency,
  canCancel,
  isRecurring,
  partialFailure,
  onClose,
}) => {
  const intl = useIntl();
  const { values, setFieldValue, isSubmitting } = useFormikContext<ManageContributionFormValues>();

  const selectedTxns = React.useMemo(
    () => refundableTxns.filter(t => values.selectedTxnIds.includes(t.id)),
    [refundableTxns, values.selectedTxnIds],
  );

  const refundSummary = React.useMemo(() => {
    if (!values.refundEnabled || !selectedTxns.length) {
      return null;
    }
    return selectedTxns.reduce(
      (acc, tx) => {
        const gross = tx.amount?.valueInCents ?? 0;
        const hostFee = Math.abs(tx.hostFee?.valueInCents ?? 0);
        const processorFee = Math.abs(tx.paymentProcessorFee?.valueInCents ?? 0);
        return {
          totalRefundedToUser: acc.totalRefundedToUser + gross,
          totalDeductedFromBalance: acc.totalDeductedFromBalance + (gross - hostFee),
          totalHostFeeReversal: acc.totalHostFeeReversal + hostFee,
          totalProcessorCover: acc.totalProcessorCover + processorFee,
        };
      },
      {
        totalRefundedToUser: 0,
        totalDeductedFromBalance: 0,
        totalHostFeeReversal: 0,
        totalProcessorCover: 0,
      },
    );
  }, [values.refundEnabled, selectedTxns]);

  const hasRefund = values.refundEnabled && selectedTxns.length > 0;
  const hasAnyAction = values.cancel || hasRefund || values.removeAsContributor;
  const refundSelectionInvalid = values.refundEnabled && selectedTxns.length === 0;

  const summaryAmount = order.totalAmount?.valueInCents ?? order.amount?.valueInCents ?? 0;
  const fromAccountName = order.fromAccount?.name || order.fromAccount?.slug;
  const toAccountName = order.toAccount?.name || order.toAccount?.slug;

  // Selection is sequential from the most recent charge to the oldest: a charge at index `i`
  // can only be selected if all more recent charges (indices < i) are already selected.
  // Deselecting a charge also deselects all older charges in the same run.
  const firstUnselectedIndex = React.useMemo(() => {
    const idx = refundableTxns.findIndex(tx => !values.selectedTxnIds.includes(tx.id));
    return idx === -1 ? refundableTxns.length : idx;
  }, [refundableTxns, values.selectedTxnIds]);

  const toggleTxn = (id: string) => {
    const index = refundableTxns.findIndex(tx => tx.id === id);
    if (index === -1) {
      return;
    }
    if (values.selectedTxnIds.includes(id)) {
      // Deselect this charge and all older ones
      const keepIds = new Set(refundableTxns.slice(0, index).map(tx => tx.id));
      setFieldValue(
        'selectedTxnIds',
        values.selectedTxnIds.filter(x => keepIds.has(x)),
      );
    } else {
      setFieldValue('selectedTxnIds', [...values.selectedTxnIds, id]);
    }
  };

  const submitLabel = (() => {
    if (values.cancel && hasRefund && values.removeAsContributor) {
      return <FormattedMessage defaultMessage="Cancel, refund & remove contributor" id="ManageOrder.Submit.All" />;
    }
    if (values.cancel && hasRefund) {
      return <FormattedMessage defaultMessage="Cancel & refund" id="ManageOrder.Submit.CancelRefund" />;
    }
    if (values.cancel && values.removeAsContributor) {
      return <FormattedMessage defaultMessage="Cancel & remove contributor" id="ManageOrder.Submit.CancelRemove" />;
    }
    if (hasRefund && values.removeAsContributor) {
      return <FormattedMessage defaultMessage="Refund & remove contributor" id="ManageOrder.Submit.RefundRemove" />;
    }
    if (values.cancel) {
      return <FormattedMessage defaultMessage="Cancel contribution" id="subscription.menu.cancelContribution" />;
    }
    if (hasRefund) {
      return isRecurring ? (
        <FormattedMessage defaultMessage="Refund" id="Refund" />
      ) : (
        <FormattedMessage defaultMessage="Refund contribution" id="ManageOrder.Submit.RefundContribution" />
      );
    }
    if (values.removeAsContributor) {
      return isRecurring ? (
        <FormattedMessage defaultMessage="Remove as contributor" id="ManageOrder.RemoveAsContributor" />
      ) : (
        <FormattedMessage defaultMessage="Remove contributor" id="ManageOrder.RemoveAsContributor.Submit.Single" />
      );
    }
    return <FormattedMessage defaultMessage="Confirm" id="Confirm" />;
  })();

  return (
    <Form className="flex flex-col gap-4">
      <Section>
        <div className="flex flex-col gap-3">
          {order.description && <div className="text-sm font-semibold">{order.description}</div>}
          {order.status && (
            <DetailRow
              label={<FormattedMessage defaultMessage="Status" id="order.status" />}
              value={<OrderStatusTag status={order.status} />}
            />
          )}
          {currency && (
            <DetailRow
              label={<FormattedMessage defaultMessage="Amount" id="Fields.amount" />}
              value={
                <FormattedMoneyAmount
                  amount={summaryAmount}
                  currency={currency}
                  frequency={order.frequency as unknown as TierFrequency}
                  showCurrencyCode
                  amountClassName="font-semibold"
                />
              }
            />
          )}
          {order.fromAccount && (
            <DetailRow
              label={<FormattedMessage defaultMessage="From" id="dM+p3/" />}
              value={
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar size={20} collective={order.fromAccount} displayTitle={false} />
                  <span className="truncate">{fromAccountName}</span>
                </span>
              }
            />
          )}
          {order.toAccount && (
            <DetailRow
              label={<FormattedMessage defaultMessage="To" id="To" />}
              value={
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar size={20} collective={order.toAccount} displayTitle={false} />
                  <span className="truncate">{toAccountName}</span>
                </span>
              }
            />
          )}
        </div>
      </Section>

      {canCancel && (
        <Section>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold">
                <FormattedMessage defaultMessage="Cancel Contribution" id="ManageOrder.Cancel.Title" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                <FormattedMessage
                  defaultMessage="No future charges will be made for this contribution."
                  id="ManageOrder.Cancel.Description"
                />
              </p>
            </div>
            <Switch
              checked={values.cancel}
              onCheckedChange={checked => setFieldValue('cancel', checked)}
              disabled={isSubmitting}
            />
          </div>
        </Section>
      )}

      <Section>
        <div className="flex items-start justify-between gap-4">
          <div className="font-semibold">
            {isRecurring ? (
              <FormattedMessage defaultMessage="Refund Contributions" id="ManageOrder.Refund.Title" />
            ) : (
              <FormattedMessage defaultMessage="Refund Allocation" id="ManageOrder.Refund.AllocationTitle" />
            )}
          </div>
          {isRecurring && (
            <Switch
              checked={values.refundEnabled}
              onCheckedChange={checked => {
                setFieldValue('refundEnabled', checked);
                if (!checked) {
                  setFieldValue('selectedTxnIds', []);
                }
              }}
              disabled={isSubmitting || refundableTxns.length === 0}
            />
          )}
        </div>

        <Collapsible open={values.refundEnabled || !isRecurring}>
          <CollapsibleContent className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            {isRecurring && (
              <div className="text-sm font-semibold">
                <FormattedMessage defaultMessage="Select recent contributions" id="ManageOrder.Refund.Select" />
              </div>
            )}

            {refundableTxns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <FormattedMessage
                  defaultMessage="No refundable charges are available for this contribution."
                  id="ManageOrder.Refund.Empty"
                />
              </p>
            ) : (
              isRecurring && (
                <ul className="flex flex-col gap-2">
                  {refundableTxns.map((tx, index) => {
                    const inputId = `manage-order-refund-${tx.id}`;
                    const isSelected = values.selectedTxnIds.includes(tx.id);
                    const isNextSelectable = index === firstUnselectedIndex;
                    const isDisabled = isSubmitting || (!isSelected && !isNextSelectable);
                    return (
                      <li key={tx.id} className="flex items-center gap-2">
                        <Checkbox
                          id={inputId}
                          checked={isSelected}
                          onCheckedChange={() => toggleTxn(tx.id)}
                          disabled={isDisabled}
                        />
                        <label
                          htmlFor={inputId}
                          className={`flex flex-wrap items-baseline gap-1 text-sm ${
                            isDisabled ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'
                          }`}
                        >
                          <FormattedMessage
                            defaultMessage="{amount} made on {date}"
                            id="ManageOrder.Refund.TxLabel"
                            values={{
                              amount: (
                                <FormattedMoneyAmount
                                  amount={tx.amount.valueInCents}
                                  currency={tx.amount.currency}
                                  showCurrencyCode
                                />
                              ),
                              date: <DateTime value={tx.createdAt} dateStyle="medium" timeStyle="short" />,
                            }}
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )
            )}

            {refundSummary && currency && (
              <div className="mt-2 flex flex-col gap-3">
                {isRecurring ? (
                  <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3">
                    <div className="text-sm font-semibold">
                      <FormattedMessage defaultMessage="Refund details" id="ManageOrder.Refund.DetailsTitle" />
                    </div>
                    <DetailRow
                      label={
                        <FormattedMessage
                          defaultMessage="Total amount deducted from Collective balance:"
                          id="ManageOrder.Refund.DeductedFromBalance"
                        />
                      }
                      value={
                        <FormattedMoneyAmount amount={refundSummary.totalDeductedFromBalance} currency={currency} />
                      }
                    />
                    <DetailRow
                      label={
                        <FormattedMessage
                          defaultMessage="Total Host fee reversal:"
                          id="ManageOrder.Refund.HostFeeReversal"
                        />
                      }
                      value={<FormattedMoneyAmount amount={refundSummary.totalHostFeeReversal} currency={currency} />}
                    />
                    <DetailRow
                      label={
                        <FormattedMessage
                          defaultMessage="Total payment processor cover:"
                          id="ManageOrder.Refund.ProcessorCover"
                        />
                      }
                      value={<FormattedMoneyAmount amount={refundSummary.totalProcessorCover} currency={currency} />}
                    />
                    <DetailRow
                      emphasized
                      label={
                        <FormattedMessage
                          defaultMessage="Total amount refunded to user:"
                          id="ManageOrder.Refund.TotalRefunded"
                        />
                      }
                      value={
                        <FormattedMoneyAmount
                          amount={refundSummary.totalRefundedToUser}
                          currency={currency}
                          showCurrencyCode
                          amountClassName="font-semibold"
                        />
                      }
                    />
                  </div>
                ) : (
                  <React.Fragment>
                    <div className="rounded-md border border-border p-4">
                      <div className="mb-3 font-semibold">
                        <FormattedMessage
                          defaultMessage="Outcome for Collective"
                          id="ManageOrder.Refund.Outcome.Collective"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <FormattedMessage
                            defaultMessage="Deducted from Collective balance:"
                            id="ManageOrder.Refund.DeductedFromBalance.Single"
                          />
                        </span>
                        <SignedMoneyAmount
                          amount={refundSummary.totalDeductedFromBalance}
                          currency={currency}
                          sign="negative"
                          amountClassName="text-lg font-semibold"
                        />
                      </div>
                    </div>

                    <div className="rounded-md border border-border p-4">
                      <div className="mb-3 font-semibold">
                        <FormattedMessage defaultMessage="Outcome for Host" id="ManageOrder.Refund.Outcome.Host" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <DetailRow
                          label={
                            <FormattedMessage
                              defaultMessage="Host fee reversal"
                              id="ManageOrder.Refund.HostFeeReversal.Single"
                            />
                          }
                          value={
                            <SignedMoneyAmount
                              amount={refundSummary.totalHostFeeReversal}
                              currency={currency}
                              sign="positive"
                            />
                          }
                        />
                        <DetailRow
                          label={
                            <FormattedMessage
                              defaultMessage="Payment processor cover"
                              id="ManageOrder.Refund.ProcessorCover.Single"
                            />
                          }
                          value={
                            <SignedMoneyAmount
                              amount={refundSummary.totalProcessorCover}
                              currency={currency}
                              sign="positive"
                            />
                          }
                        />
                        <DetailRow
                          emphasized
                          label={<FormattedMessage defaultMessage="Total" id="Fields.total" />}
                          value={
                            <SignedMoneyAmount
                              amount={refundSummary.totalHostFeeReversal + refundSummary.totalProcessorCover}
                              currency={currency}
                              sign="positive"
                              showCurrencyCode
                              amountClassName="text-lg font-semibold"
                            />
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-md border border-border p-4">
                      <div className="mb-3 font-semibold">
                        <FormattedMessage
                          defaultMessage="Outcome for Contributor"
                          id="ManageOrder.Refund.Outcome.Contributor"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <FormattedMessage
                            defaultMessage="Amount refunded to contributor:"
                            id="ManageOrder.Refund.TotalRefunded.Single"
                          />
                        </span>
                        <SignedMoneyAmount
                          amount={refundSummary.totalRefundedToUser}
                          currency={currency}
                          sign="positive"
                          showCurrencyCode
                          amountClassName="text-lg font-semibold"
                        />
                      </div>
                    </div>
                  </React.Fragment>
                )}
                {isRecurring && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5" aria-hidden />
                    <FormattedMessage
                      defaultMessage="Each contribution will be refunded separately."
                      id="ManageOrder.Refund.Separate"
                    />
                  </p>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </Section>

      <Section>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold">
              {isRecurring ? (
                <FormattedMessage defaultMessage="Remove as contributor" id="ManageOrder.RemoveAsContributor" />
              ) : (
                <FormattedMessage
                  defaultMessage="Remove contributor from collective"
                  id="ManageOrder.RemoveAsContributor.Single"
                />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isRecurring ? (
                <FormattedMessage
                  defaultMessage="The contributor's identity will be removed from the Collective's public profile. The contribution will still be visible in the ledger."
                  id="ManageOrder.RemoveAsContributor.Description"
                />
              ) : (
                <FormattedMessage
                  defaultMessage="The contributor's identity will be hidden on the Collective's public profile and contributor export. The contribution will still be visible in the ledger."
                  id="ManageOrder.RemoveAsContributor.Description.Single"
                />
              )}
            </p>
          </div>
          <Switch
            checked={values.removeAsContributor}
            onCheckedChange={checked => setFieldValue('removeAsContributor', checked)}
            disabled={isSubmitting}
          />
        </div>
      </Section>

      <FormField
        name="message"
        label={
          isRecurring ? (
            <FormattedMessage defaultMessage="Message to contributor" id="ManageOrder.Message.Label" />
          ) : (
            <FormattedMessage
              defaultMessage="Send custom message to contributor"
              id="ManageOrder.Message.Label.Single"
            />
          )
        }
        labelClassName="text-sm font-semibold"
      >
        {({ field }) => (
          <Textarea
            {...field}
            rows={3}
            placeholder={intl.formatMessage({
              defaultMessage: 'Type your message here...',
              id: 'ManageOrder.Message.Placeholder',
            })}
            disabled={isSubmitting}
            maxLength={2000}
          />
        )}
      </FormField>

      {partialFailure && partialFailure.errors.length > 0 && (
        <MessageBox type="warning" withIcon>
          <p className="mb-1 font-semibold">
            {partialFailure.cancelled && partialFailure.removedAsContributor ? (
              <FormattedMessage
                defaultMessage="The contribution was cancelled and the contributor was removed, but one or more charges could not be refunded:"
                id="ManageOrder.PartialFailure.CancelRemove"
              />
            ) : partialFailure.cancelled ? (
              <FormattedMessage
                defaultMessage="The contribution was cancelled, but one or more charges could not be refunded:"
                id="ManageOrder.PartialFailure.Cancel"
              />
            ) : partialFailure.removedAsContributor ? (
              <FormattedMessage
                defaultMessage="The contributor was removed, but one or more charges could not be refunded:"
                id="ManageOrder.PartialFailure.Remove"
              />
            ) : (
              <FormattedMessage
                defaultMessage="One or more charges could not be refunded:"
                id="ManageOrder.PartialFailure.RefundOnly"
              />
            )}
          </p>
          <ul className="list-disc pl-4 text-sm">
            {partialFailure.errors.map(err => {
              const tx = refundableTxns.find(t => t.id === err.transactionId);
              const codeMessage = i18nRefundErrorCode[err.code];
              return (
                <li key={err.transactionId}>
                  {tx ? (
                    <span className="mr-1 font-medium">
                      <FormattedMoneyAmount amount={tx.amount.valueInCents} currency={tx.amount.currency} />
                      {': '}
                    </span>
                  ) : null}
                  {codeMessage ? intl.formatMessage(codeMessage) : err.message}
                </li>
              );
            })}
          </ul>
        </MessageBox>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={!hasAnyAction || refundSelectionInvalid}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </Form>
  );
};

const ManageContributionModal = ({
  order: orderRef,
  open,
  setOpen,
  onCloseFocusRef,
  onSuccess,
}: ManageContributionModalProps) => {
  const intl = useIntl();
  const { toast } = useToast();

  const { data, loading, error } = useQuery<ManageContributionModalQuery, ManageContributionModalQueryVariables>(
    manageContributionModalQuery,
    {
      variables: { order: { id: orderRef.id } },
      skip: !open,
      fetchPolicy: 'cache-and-network',
    },
  );

  const order = data?.order;
  const currency = order?.totalAmount?.currency ?? order?.amount?.currency;
  const isRecurring = Boolean(order?.frequency && order.frequency !== ContributionFrequency.ONETIME);
  const isAlreadyCancelled = order?.status === OrderStatus.CANCELLED;
  const canCancel = Boolean(isRecurring && !isAlreadyCancelled);

  const refundableTxns = React.useMemo(
    () =>
      (order?.transactions ?? [])
        .filter(isRefundableCharge)
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [order?.transactions],
  );

  const [runManageOrder] = useMutation<ManageOrderMutation, ManageOrderMutationVariables>(manageOrderMutation);

  const [partialFailure, setPartialFailure] = React.useState<PartialFailure | null>(null);

  const handleClose = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        setPartialFailure(null);
      }
    },
    [setOpen],
  );

  const initialValues = React.useMemo<ManageContributionFormValues>(
    () => ({
      cancel: canCancel,
      refundEnabled: !isRecurring && refundableTxns.length > 0,
      selectedTxnIds: !isRecurring ? refundableTxns.map(tx => tx.id) : [],
      removeAsContributor: false,
      message: '',
    }),
    [canCancel, isRecurring, refundableTxns],
  );

  const handleSubmit = async (
    values: ManageContributionFormValues,
    formikHelpers: FormikProps<ManageContributionFormValues>,
  ) => {
    if (!order) {
      return;
    }
    setPartialFailure(null);
    try {
      const result = await runManageOrder({
        variables: {
          order: { id: order.id },
          action: {
            cancel: values.cancel,
            removeAsContributor: values.removeAsContributor,
            refund:
              values.refundEnabled && values.selectedTxnIds.length
                ? { transactions: values.selectedTxnIds.map(id => ({ id })) }
                : null,
            messageForContributor: values.message?.trim() || null,
          },
        },
      });

      const errors = result.data?.manageOrder?.refundErrors ?? [];
      if (errors.length > 0) {
        const failure: PartialFailure = {
          cancelled: values.cancel,
          removedAsContributor: values.removeAsContributor,
          errors: errors.map(e => ({
            code: e.code,
            message: e.message,
            transactionId: e.transaction.id,
          })),
        };
        setPartialFailure(failure);
        // Refresh the outer list so successful cancel / remove-as-contributor are reflected.
        onSuccess?.();
        const toastMessage =
          failure.cancelled && failure.removedAsContributor
            ? intl.formatMessage({
                defaultMessage:
                  'The contribution was cancelled and the contributor was removed, but one or more charges could not be refunded. Review the errors below.',
                id: 'ManageOrder.PartialFailure.Toast.CancelRemove',
              })
            : failure.cancelled
              ? intl.formatMessage({
                  defaultMessage:
                    'The contribution was cancelled, but one or more charges could not be refunded. Review the errors below.',
                  id: 'ManageOrder.PartialFailure.Toast.Cancel',
                })
              : failure.removedAsContributor
                ? intl.formatMessage({
                    defaultMessage:
                      'The contributor was removed, but one or more charges could not be refunded. Review the errors below.',
                    id: 'ManageOrder.PartialFailure.Toast.Remove',
                  })
                : intl.formatMessage({
                    defaultMessage: 'One or more charges could not be refunded. Review the errors below.',
                    id: 'ManageOrder.PartialFailure.Toast.RefundOnly',
                  });
        toast({
          variant: 'error',
          message: toastMessage,
        });
        formikHelpers.setSubmitting?.(false);
        return;
      }

      toast({
        variant: 'success',
        message:
          !isRecurring && values.refundEnabled
            ? intl.formatMessage({
                defaultMessage: 'Contribution refunded',
                id: 'ManageOrder.Success.RefundSingle',
              })
            : intl.formatMessage({
                defaultMessage: 'Contribution updated',
                id: 'ManageOrder.Success',
              }),
      });
      onSuccess?.();
      handleClose(false);
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  const summaryAmount = order?.totalAmount?.valueInCents ?? order?.amount?.valueInCents ?? 0;
  const dialogTitle = !order ? (
    <FormattedMessage defaultMessage="Manage Contribution" id="ManageOrder.Title" />
  ) : isRecurring ? (
    <FormattedMessage defaultMessage="Manage Recurring Contribution" id="ManageOrder.Title.Recurring" />
  ) : currency ? (
    <FormattedMessage
      defaultMessage="Refund Contribution of {amount}"
      id="ManageOrder.Title.RefundSingleWithAmount"
      values={{
        amount: <FormattedMoneyAmount amount={summaryAmount} currency={currency} showCurrencyCode />,
      }}
    />
  ) : (
    <FormattedMessage defaultMessage="Refund Contribution" id="ManageOrder.Title.RefundSingle" />
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={e => {
          if (onCloseFocusRef?.current) {
            e.preventDefault();
            onCloseFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {!order ? (
              <FormattedMessage defaultMessage="Manage this contribution." id="ManageOrder.Description.Loading" />
            ) : isRecurring ? (
              <FormattedMessage
                defaultMessage="Cancel, refund, or remove a contributor from this contribution."
                id="ManageOrder.Description"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Review the refund allocation before refunding this contribution."
                id="ManageOrder.Description.RefundSingle"
              />
            )}
          </DialogDescription>
        </DialogHeader>

        {loading && !order ? (
          <Loading />
        ) : error || !order ? (
          <MessageBox type="error" withIcon>
            {error ? (
              i18nGraphqlException(intl, error)
            ) : (
              <FormattedMessage defaultMessage="Contribution not found" id="ManageOrder.NotFound" />
            )}
          </MessageBox>
        ) : (
          <FormikZod<ManageContributionFormValues>
            // Re-mount the form whenever the modal is (re)opened to ensure a clean slate
            key={open ? order.id : 'closed'}
            schema={ManageContributionFormSchema}
            initialValues={initialValues}
            onSubmit={handleSubmit}
          >
            <ManageContributionForm
              order={order}
              refundableTxns={refundableTxns}
              currency={currency}
              canCancel={canCancel}
              isRecurring={isRecurring}
              partialFailure={partialFailure}
              onClose={() => handleClose(false)}
            />
          </FormikZod>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManageContributionModal;
