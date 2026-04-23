import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Form, useFormikContext } from 'formik';
import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import type {
  HostRefundPaymentMutation,
  HostRefundPaymentMutationVariables,
  HostRefundPaymentTransactionQuery,
  HostRefundPaymentTransactionQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import {
  AccountType,
  ContributionFrequency,
  OrderStatus,
  TransactionKind,
  TransactionType,
} from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import { i18nTransactionKind } from '../../../../lib/i18n/transaction';

import { AccountHoverCard, accountHoverCardFields } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { FormField } from '../../../FormField';
import { FormikZod } from '../../../FormikZod';
import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import type { BaseModalProps } from '../../../ModalContext';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { Separator } from '../../../ui/Separator';
import { Textarea } from '../../../ui/Textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';
import { useToast } from '../../../ui/useToast';

const hostRefundPaymentTransactionQuery = gql`
  query HostRefundPaymentTransaction($transaction: TransactionReferenceInput!) {
    transaction(transaction: $transaction) {
      id
      legacyId
      kind
      type
      isRefund
      isRefunded
      createdAt
      description
      amount {
        valueInCents
        currency
      }
      netAmount {
        valueInCents
        currency
      }
      host {
        id
        slug
        name
        imageUrl
        type
        ...AccountHoverCardFields
      }
      account {
        id
        slug
        name
        imageUrl
        type
        ...AccountHoverCardFields
        stats {
          id
          balanceWithBlockedFunds: balance(withBlockedFunds: true) {
            valueInCents
            currency
          }
        }
      }
      oppositeAccount {
        id
        slug
        name
        imageUrl
        type
        ...AccountHoverCardFields
        stats {
          id
          balanceWithBlockedFunds: balance(withBlockedFunds: true) {
            valueInCents
            currency
          }
        }
      }
      relatedTransactions {
        id
        legacyId
        type
        kind
        netAmount {
          valueInCents
          currency
        }
        account {
          id
          slug
          name
          imageUrl
          type
          ...AccountHoverCardFields
          stats {
            id
            balanceWithBlockedFunds: balance(withBlockedFunds: true) {
              valueInCents
              currency
            }
          }
        }
        oppositeAccount {
          id
          slug
          name
          imageUrl
          type
          ...AccountHoverCardFields
        }
      }
      order {
        id
        status
        frequency
        description
        permissions {
          id
          canHostCancel
          canHostRemoveAsContributor
        }
      }
      permissions {
        id
        canRefund
      }
    }
  }
  ${accountHoverCardFields}
`;

const hostRefundPaymentMutation = gql`
  mutation HostRefundPayment(
    $transaction: TransactionReferenceInput!
    $cancelRecurringContribution: Boolean
    $removeAsContributor: Boolean
    $messageForContributor: String
    $ignoreBalanceCheck: Boolean
  ) {
    refundTransaction(
      transaction: $transaction
      cancelRecurringContribution: $cancelRecurringContribution
      removeAsContributor: $removeAsContributor
      messageForContributor: $messageForContributor
      ignoreBalanceCheck: $ignoreBalanceCheck
    ) {
      id
      isRefunded
      refundTransaction {
        id
        group
      }
      order {
        id
        status
        activities {
          nodes {
            id
            type
            createdAt
          }
        }
        transactions {
          id
          createdAt
        }
      }
    }
  }
`;

type TransactionData = NonNullable<HostRefundPaymentTransactionQuery['transaction']>;

type HostRefundPaymentModalProps = BaseModalProps & {
  transaction: { id: string; legacyId?: number };
  onSuccess?: () => void;
};

const HostRefundPaymentFormSchema = z.object({
  cancelRecurringContribution: z.boolean(),
  removeAsContributor: z.boolean(),
  message: z.string().max(2000).optional(),
  ignoreBalanceCheck: z.boolean(),
});

type HostRefundPaymentFormValues = z.infer<typeof HostRefundPaymentFormSchema>;

const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={`rounded-lg border border-border bg-background p-4 ${className ?? ''}`}>{children}</div>
);

type AllocationAccount = React.ComponentProps<typeof AccountHoverCard>['account'];

type AllocationLine = {
  key: string;
  qualifier?: React.ReactNode;
  amount: number;
  sortKey?: string;
  kind?: TransactionKind;
};

type AllocationEntry = Pick<
  TransactionData,
  'id' | 'legacyId' | 'type' | 'kind' | 'netAmount' | 'account' | 'oppositeAccount'
>;

type AllocationGroupData = {
  key: string;
  account: AllocationAccount | null | undefined;
  lines: AllocationLine[];
  total: number;
};

type PrincipalAccount = NonNullable<TransactionData['account'] | TransactionData['oppositeAccount']>;

type RefundAllocation = {
  currency?: string;
  principalAccountId?: string;
  principalAccount?: PrincipalAccount | null;
  principalOutflowAmount: number;
  refundAmount: number;
  outflow: AllocationGroupData[];
  inflow: AllocationGroupData[];
};

const getAllocationAccountName = (account: AllocationAccount | null | undefined) =>
  account?.name || account?.slug || account?.id || '';

const getAllocationEntrySortValue = (entry: AllocationGroupData, priorityAccountId?: string) => {
  if (entry.account?.id === priorityAccountId) {
    return `0-${getAllocationAccountName(entry.account)}`;
  }

  return `1-${getAllocationAccountName(entry.account)}`;
};

const buildRefundAllocation = (transaction: TransactionData, intl: IntlShape): RefundAllocation => {
  const currency = transaction.amount?.currency ?? transaction.netAmount?.currency;
  const isCredit = transaction.type === TransactionType.CREDIT;
  const principalAccount = isCredit ? transaction.account : transaction.oppositeAccount;
  const contributorAccount = isCredit ? transaction.oppositeAccount : transaction.account;
  const groups = new Map<string, AllocationGroupData>();

  const addLine = (account: AllocationAccount | null | undefined, line: AllocationLine) => {
    const key = account?.id ?? 'unknown';
    const group = groups.get(key) ?? {
      key,
      account,
      lines: [],
      total: 0,
    };

    group.lines.push(line);
    group.total += line.amount;
    groups.set(key, group);
  };

  const entries: AllocationEntry[] = [transaction, ...(transaction.relatedTransactions ?? [])];

  entries
    .filter(entry => entry.type === TransactionType.CREDIT)
    .forEach(entry => {
      const amount = Math.abs(entry.netAmount?.valueInCents ?? 0);

      if (!amount) {
        return;
      }

      const sourceAccount = entry.account?.type === AccountType.VENDOR ? entry.account : null;
      const outflowAccount = sourceAccount && transaction.host ? transaction.host : entry.account;
      const kindLabel = entry.kind ? i18nTransactionKind(intl, entry.kind) : undefined;
      const sortKey = entry.kind === TransactionKind.CONTRIBUTION ? '' : (kindLabel ?? '');
      const lineKey = `${entry.id}-${entry.kind ?? 'transaction'}`;

      addLine(outflowAccount, {
        key: `${lineKey}-outflow`,
        qualifier: kindLabel,
        amount: -amount,
        sortKey,
        kind: entry.kind ?? undefined,
      });
      addLine(entry.oppositeAccount, {
        key: `${lineKey}-inflow`,
        qualifier: kindLabel,
        amount,
        sortKey,
        kind: entry.kind ?? undefined,
      });
    });

  groups.forEach(group => {
    group.lines.sort((a, b) => String(a.sortKey ?? '').localeCompare(String(b.sortKey ?? '')));
  });

  const outflow = [...groups.values()]
    .filter(group => group.total < 0)
    .sort((a, b) =>
      getAllocationEntrySortValue(a, principalAccount?.id).localeCompare(
        getAllocationEntrySortValue(b, principalAccount?.id),
      ),
    );
  const inflow = [...groups.values()]
    .filter(group => group.total > 0)
    .sort((a, b) =>
      getAllocationEntrySortValue(a, contributorAccount?.id).localeCompare(
        getAllocationEntrySortValue(b, contributorAccount?.id),
      ),
    );
  const outflowWithReturnedLines = outflow.map(group => ({
    ...group,
    lines: group.lines.map(line => {
      if (line.amount <= 0 || !line.kind) {
        return line;
      }

      return {
        ...line,
        qualifier: intl.formatMessage(
          { defaultMessage: '{kind} returned', id: 'HostRefundPayment.Allocation.ReturnedLineQualifier' },
          { kind: i18nTransactionKind(intl, line.kind) },
        ),
      };
    }),
  }));

  const principalOutflowGroup = outflow.find(group => group.account?.id === principalAccount?.id);

  return {
    currency,
    principalAccountId: principalAccount?.id,
    principalAccount,
    principalOutflowAmount: principalOutflowGroup ? Math.abs(principalOutflowGroup.total) : 0,
    refundAmount: inflow.reduce((sum, group) => sum + group.total, 0),
    outflow: outflowWithReturnedLines,
    inflow,
  };
};

const AllocationGroup: React.FC<{
  account: AllocationAccount | null | undefined;
  lines: AllocationLine[];
  currency: string;
  showBalance?: boolean;
}> = ({ account, lines, currency, showBalance }) => {
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const hasQualifiers = lines.some(line => line.qualifier);
  const getPrefix = (amount: number) => (amount > 0 ? '+' : '');

  const accountForHoverCard = account ? (showBalance ? account : { ...account, stats: undefined }) : null;

  const accountTrigger = (
    <div className="flex min-w-0 cursor-default items-center gap-2">
      <Avatar collective={account ?? undefined} radius={20} />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{account?.name || account?.slug}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        {accountForHoverCard ? (
          <AccountHoverCard account={accountForHoverCard} trigger={accountTrigger} />
        ) : (
          accountTrigger
        )}
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {getPrefix(total)}
          <FormattedMoneyAmount amount={total} currency={currency} showCurrencyCode={false} />
        </span>
      </div>
      {hasQualifiers && (
        <div className="mt-1 ml-7 flex flex-col gap-0.5">
          {lines.map(line => (
            <div key={line.key} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">{line.qualifier}</span>
              <span className="shrink-0 tabular-nums">
                {getPrefix(line.amount)}
                <FormattedMoneyAmount amount={line.amount} currency={currency} showCurrencyCode={false} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

type RefundOptions = {
  showCancelRecurring: boolean;
  showRemoveAsContributor: boolean;
  showHostMessage: boolean;
  canIgnoreBalanceCheck: boolean;
};

type HostRefundPaymentFormProps = {
  transaction: TransactionData;
  options: RefundOptions;
  onClose: () => void;
};

const HostRefundPaymentForm: React.FC<HostRefundPaymentFormProps> = ({ transaction, options, onClose }) => {
  const intl = useIntl();
  const { values, setFieldValue, isSubmitting } = useFormikContext<HostRefundPaymentFormValues>();

  const refundAllocation = React.useMemo(() => buildRefundAllocation(transaction, intl), [intl, transaction]);
  const { currency, outflow, inflow, principalAccountId, principalAccount, principalOutflowAmount } = refundAllocation;

  const principalBalanceAmount = principalAccount?.stats?.balanceWithBlockedFunds;
  const principalBalanceInCents = principalBalanceAmount?.valueInCents;
  const principalBalanceCurrency = principalBalanceAmount?.currency ?? currency;
  const isInsufficientBalance =
    options.canIgnoreBalanceCheck &&
    principalOutflowAmount > 0 &&
    typeof principalBalanceInCents === 'number' &&
    principalBalanceInCents < principalOutflowAmount;

  const submitLabel = (() => {
    if (values.cancelRecurringContribution && values.removeAsContributor) {
      return (
        <FormattedMessage defaultMessage="Refund, cancel & remove contributor" id="tcfKDv"  />
      );
    }
    if (values.cancelRecurringContribution) {
      return <FormattedMessage defaultMessage="Refund & cancel contribution" id="A3w8tJ"  />;
    }
    if (values.removeAsContributor) {
      return <FormattedMessage defaultMessage="Refund & remove contributor" id="gbYv/S"  />;
    }
    return <FormattedMessage defaultMessage="Refund" id="Refund" />;
  })();

  return (
    <Form className="flex flex-col gap-4">
      {currency && (outflow.length > 0 || inflow.length > 0) && (
        <Section>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <FormattedMessage defaultMessage="Refund from" id="SVyby7"  />
                <ArrowDownRight className="size-5 shrink-0 text-red-600" aria-hidden />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-4">
                {outflow.map(group => (
                  <AllocationGroup
                    key={group.key}
                    account={group.account}
                    lines={group.lines}
                    currency={currency}
                    showBalance={group.account?.id === principalAccountId}
                  />
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <FormattedMessage defaultMessage="Refund to" id="BMuEYE" />
                <ArrowUpRight className="size-5 shrink-0 text-green-600" aria-hidden />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-4">
                {inflow.map(group => (
                  <AllocationGroup key={group.key} account={group.account} lines={group.lines} currency={currency} />
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {isInsufficientBalance && principalBalanceCurrency && (
        <MessageBox type="warning" withIcon px={3} py={2}>
          <FormattedMessage
            defaultMessage="{collective}'s balance ({balance}) won't cover the {amount} that would be deducted to process this refund." id="RB/W6s"
            values={{
              collective: <span className="font-medium">{principalAccount?.name || principalAccount?.slug}</span>,
              balance: (
                <span className="font-medium tabular-nums">
                  <FormattedMoneyAmount
                    amount={principalBalanceInCents}
                    currency={principalBalanceCurrency}
                    showCurrencyCode={false}
                  />
                </span>
              ),
              amount: (
                <span className="font-medium tabular-nums">
                  <FormattedMoneyAmount
                    amount={principalOutflowAmount}
                    currency={principalBalanceCurrency}
                    showCurrencyCode={false}
                  />
                </span>
              ),
            }}
          />
        </MessageBox>
      )}

      {(options.showCancelRecurring ||
        options.showRemoveAsContributor ||
        options.showHostMessage ||
        isInsufficientBalance) && (
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <FormattedMessage defaultMessage="Options" id="header.options"  />
          </div>

          {(options.showCancelRecurring || options.showRemoveAsContributor || isInsufficientBalance) && (
            <div className="mb-1.5 flex flex-col gap-2">
              {isInsufficientBalance && principalBalanceCurrency && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={values.ignoreBalanceCheck}
                        onCheckedChange={checked => setFieldValue('ignoreBalanceCheck', checked === true)}
                        disabled={isSubmitting}
                      />
                      <span className="font-medium">
                        <FormattedMessage
                          defaultMessage="Allow negative balance" id="CcDFSI"
                        />
                      </span>
                    </label>
                    <Tooltip>
                      <TooltipTrigger className="inline-flex text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        <Info className="size-3.5" aria-hidden />
                        <span className="sr-only">
                          <FormattedMessage defaultMessage="More info" id="moreInfo"  />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <FormattedMessage
                          defaultMessage="Process the refund and ignore the balance. The Collective's balance will go negative until additional contributions are received." id="+vpPIw"
                        />
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}

              {options.showCancelRecurring && (
                <div className="flex items-center gap-1.5 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={values.cancelRecurringContribution}
                      onCheckedChange={checked => setFieldValue('cancelRecurringContribution', checked === true)}
                      disabled={isSubmitting}
                    />
                    <span className="font-medium">
                      <FormattedMessage
                        defaultMessage="Cancel recurring contribution" id="rvR3Fm"
                      />
                    </span>
                  </label>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      <Info className="size-3.5" aria-hidden />
                      <span className="sr-only">
                        <FormattedMessage defaultMessage="More info" id="moreInfo"  />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <FormattedMessage
                        defaultMessage="No future charges will be made for this contribution." id="pB1jn6"
                      />
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              {options.showRemoveAsContributor && (
                <div className="flex items-center gap-1.5 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={values.removeAsContributor}
                      onCheckedChange={checked => setFieldValue('removeAsContributor', checked === true)}
                      disabled={isSubmitting}
                    />
                    <span className="font-medium">
                      <FormattedMessage
                        defaultMessage="Remove contributor from Collective" id="BkIpny"
                      />
                    </span>
                  </label>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      <Info className="size-3.5" aria-hidden />
                      <span className="sr-only">
                        <FormattedMessage defaultMessage="More info" id="moreInfo" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <FormattedMessage
                        defaultMessage="The contributor will be hidden from public profile and exports, but the contribution stays in the ledger." id="qGlrSx"
                      />
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          )}

          {options.showHostMessage && (
            <FormField
              name="message"
              label={<FormattedMessage defaultMessage="Message to contributor" id="TD/rN2"  />}
              labelClassName="text-sm font-medium"
            >
              {({ field }) => (
                <Textarea
                  {...field}
                  rows={3}
                  className="h-auto min-h-20"
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Type your message here...', id: 'Olq7Wf',
                  })}
                  disabled={isSubmitting}
                  maxLength={2000}
                />
              )}
            </FormField>
          )}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={isInsufficientBalance && !values.ignoreBalanceCheck}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </Form>
  );
};

export const HostRefundPaymentModal = ({
  transaction: transactionRef,
  open,
  setOpen,
  onCloseFocusRef,
  onSuccess,
}: HostRefundPaymentModalProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const { LoggedInUser } = useLoggedInUser();

  const { data, previousData, loading, error } = useQuery<
    HostRefundPaymentTransactionQuery,
    HostRefundPaymentTransactionQueryVariables
  >(hostRefundPaymentTransactionQuery, {
    variables: { transaction: { id: transactionRef.id } },
    skip: !open,
    fetchPolicy: 'cache-and-network',
  });

  const queriedTransaction = data?.transaction ?? previousData?.transaction;
  const transaction = queriedTransaction?.id === transactionRef.id ? queriedTransaction : undefined;
  const order = transaction?.order;
  const refundAmount = transaction ? buildRefundAllocation(transaction, intl).refundAmount : 0;

  const isFiscalHostAdmin = Boolean(transaction?.host && LoggedInUser?.isAdminOfCollective(transaction.host));
  const isRecurringOrder = Boolean(order?.frequency && order.frequency !== ContributionFrequency.ONETIME);
  const orderIsCancellable = Boolean(
    order?.status &&
    ![OrderStatus.CANCELLED, OrderStatus.REFUNDED, OrderStatus.REJECTED].includes(order.status as OrderStatus),
  );

  const options: RefundOptions = {
    showCancelRecurring: Boolean(isRecurringOrder && orderIsCancellable && order?.permissions?.canHostCancel),
    showRemoveAsContributor: Boolean(order?.permissions?.canHostRemoveAsContributor),
    showHostMessage: isFiscalHostAdmin,
    canIgnoreBalanceCheck: isFiscalHostAdmin,
  };

  const [runRefund] = useMutation<HostRefundPaymentMutation, HostRefundPaymentMutationVariables>(
    hostRefundPaymentMutation,
  );

  const handleClose = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
    },
    [setOpen],
  );

  const initialValues = React.useMemo<HostRefundPaymentFormValues>(
    () => ({
      cancelRecurringContribution: options.showCancelRecurring,
      removeAsContributor: false,
      message: '',
      ignoreBalanceCheck: false,
    }),
    [options.showCancelRecurring],
  );

  const handleSubmit = async (values: HostRefundPaymentFormValues) => {
    if (!transaction) {
      return;
    }

    try {
      await runRefund({
        variables: {
          transaction: { id: transaction.id },
          cancelRecurringContribution: options.showCancelRecurring ? values.cancelRecurringContribution : null,
          removeAsContributor: options.showRemoveAsContributor ? values.removeAsContributor : null,
          messageForContributor: options.showHostMessage ? values.message?.trim() || null : null,
          ignoreBalanceCheck: options.canIgnoreBalanceCheck ? values.ignoreBalanceCheck : null,
        },
      });

      toast({
        variant: 'success',
        message: intl.formatMessage({ defaultMessage: 'Transaction refunded', id: 's766TH' }),
      });
      onSuccess?.();
      handleClose(false);
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  const dialogTitle = transaction?.amount ? (
    <FormattedMessage
      defaultMessage="Refund Payment of {amount}" id="jwmoP6"
      values={{
        amount: <FormattedMoneyAmount amount={refundAmount} currency={transaction.amount.currency} showCurrencyCode />,
      }}
    />
  ) : (
    <FormattedMessage defaultMessage="Refund Payment" id="er7gIB"  />
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg"
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
            <FormattedMessage
              defaultMessage="Review and confirm the refund details." id="i4akIU"
            />
          </DialogDescription>
        </DialogHeader>

        {loading && !transaction ? (
          <Loading />
        ) : error || !transaction ? (
          <MessageBox type="error" withIcon>
            {error ? (
              i18nGraphqlException(intl, error)
            ) : (
              <FormattedMessage defaultMessage="Transaction not found" id="zAGlVG"  />
            )}
          </MessageBox>
        ) : (
          <FormikZod<HostRefundPaymentFormValues>
            key={transaction.id}
            schema={HostRefundPaymentFormSchema}
            initialValues={initialValues}
            onSubmit={handleSubmit}
          >
            <HostRefundPaymentForm transaction={transaction} options={options} onClose={() => handleClose(false)} />
          </FormikZod>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HostRefundPaymentModal;
