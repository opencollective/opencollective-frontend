import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Form, useFormikContext } from 'formik';
import { Info } from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import type {
  HostRefundPaymentMutation,
  HostRefundPaymentMutationVariables,
  HostRefundPaymentTransactionQuery,
  HostRefundPaymentTransactionQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { AccountType, TransactionKind, TransactionType } from '../../../../lib/graphql/types/v2/graphql';
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
import { Switch } from '../../../ui/Switch';
import { Textarea } from '../../../ui/Textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';
import { useToast } from '../../../ui/useToast';

const hostRefundChargeTransactionQuery = gql`
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
          canCancel
          canRemoveAsContributor
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

const hostRefundChargeMutation = gql`
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

type HostRefundChargeModalProps = BaseModalProps & {
  transaction: { id: string; legacyId?: number };
  onSuccess?: () => void;
};

const HostRefundChargeFormSchema = z.object({
  cancelRecurringContribution: z.boolean(),
  removeAsContributor: z.boolean(),
  sendMessage: z.boolean(),
  message: z.string().max(2000).optional(),
  ignoreBalanceCheck: z.boolean(),
});

type HostRefundChargeFormValues = z.infer<typeof HostRefundChargeFormSchema>;

const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={`rounded-lg border border-border bg-background p-4 ${className ?? ''}`}>{children}</div>
);

type AllocationAccount = React.ComponentProps<typeof AccountHoverCard>['account'];
type AllocationRole = 'contributor' | 'collective' | 'host' | 'platform' | 'other';
type AllocationDirection = 'in' | 'out';

type AllocationLine = {
  key: string;
  qualifier?: React.ReactNode;
  amount: number;
  sortKey?: string;
  kind?: TransactionKind;
  direction: AllocationDirection;
  role: AllocationRole;
};

type AllocationEntry = Pick<
  TransactionData,
  'id' | 'legacyId' | 'type' | 'kind' | 'netAmount' | 'account' | 'oppositeAccount'
>;

type AllocationGroupData = {
  key: string;
  account: AllocationAccount | null | undefined;
  role: AllocationRole;
  lines: AllocationLine[];
  total: number;
};

type PrincipalAccount = NonNullable<TransactionData['account'] | TransactionData['oppositeAccount']>;

type RefundAllocation = {
  currency?: string;
  principalAccount?: PrincipalAccount | null;
  principalOutflowAmount: number;
  refundAmount: number;
  outflow: AllocationGroupData[];
  inflow: AllocationGroupData[];
};

const getAllocationAccountName = (account: AllocationAccount | null | undefined) =>
  account?.name || account?.slug || account?.id || '';

const getRefundAccounts = (transaction: TransactionData) => {
  const isCredit = transaction.type === TransactionType.CREDIT;

  return {
    principalAccount: isCredit ? transaction.account : transaction.oppositeAccount,
    contributorAccount: isCredit ? transaction.oppositeAccount : transaction.account,
  };
};

const getAllocationRole = (
  account: AllocationAccount | null | undefined,
  principalAccount: AllocationAccount | null | undefined,
  contributorAccount: AllocationAccount | null | undefined,
  host: AllocationAccount | null | undefined,
): AllocationRole => {
  if (!account?.id) {
    return 'other';
  }

  if (account.id === contributorAccount?.id) {
    return 'contributor';
  } else if (account.id === principalAccount?.id) {
    return 'collective';
  } else if (account.id === host?.id) {
    return 'host';
  }

  return 'other';
};

const isPlatformTransactionKind = (kind: TransactionKind | null | undefined) =>
  [
    TransactionKind.PLATFORM_TIP,
    TransactionKind.PLATFORM_TIP_DEBT,
    TransactionKind.PLATFORM_FEE,
    TransactionKind.HOST_FEE_SHARE,
    TransactionKind.HOST_FEE_SHARE_DEBT,
  ].includes(kind as TransactionKind);

const getLineQualifier = (
  intl: IntlShape,
  kind: TransactionKind | undefined,
  direction: AllocationDirection,
  role: AllocationRole,
) => {
  if (!kind) {
    return undefined;
  }

  switch (`${kind}:${direction}:${role}`) {
    case `${TransactionKind.CONTRIBUTION}:in:contributor`:
      return intl.formatMessage({ defaultMessage: 'Contribution', id: '0LK5eg' });
    case `${TransactionKind.CONTRIBUTION}:out:collective`:
      return intl.formatMessage({
        defaultMessage: 'Contribution Amount deducted',
        id: 'SLzvAI',
      });
    case `${TransactionKind.HOST_FEE}:in:collective`:
      return intl.formatMessage({
        defaultMessage: 'Host fee returned',
        id: 'bfw5ca',
      });
    case `${TransactionKind.HOST_FEE}:out:host`:
      return intl.formatMessage({
        defaultMessage: 'Host fee returned to the collective',
        id: 'sjf07L',
      });
    case `${TransactionKind.PAYMENT_PROCESSOR_COVER}:in:collective`:
      return intl.formatMessage({
        defaultMessage: 'Payment processor fee covered by host',
        id: '0sT3hf',
      });
    case `${TransactionKind.PAYMENT_PROCESSOR_COVER}:out:host`:
      return intl.formatMessage({
        defaultMessage: 'Payment processor cover',
        id: 'Transaction.kind.PAYMENT_PROCESSOR_COVER',
      });
    case `${TransactionKind.PAYMENT_PROCESSOR_FEE}:out:host`:
      return intl.formatMessage({
        defaultMessage: 'Payment processor cover',
        id: 'Transaction.kind.PAYMENT_PROCESSOR_COVER',
      });
    case `${TransactionKind.PAYMENT_PROCESSOR_FEE}:in:collective`:
      return intl.formatMessage({
        defaultMessage: 'Payment processor fee refunded',
        id: 'Ff/q7S',
      });
    case `${TransactionKind.PAYMENT_PROCESSOR_FEE}:out:platform`:
      return intl.formatMessage({
        defaultMessage: 'Payment processor fee',
        id: 'contribution.paymentFee',
      });
    case `${TransactionKind.PLATFORM_TIP}:in:contributor`:
      return intl.formatMessage({
        defaultMessage: 'Platform tip',
        id: 'Transaction.kind.PLATFORM_TIP',
      });
    case `${TransactionKind.PLATFORM_TIP}:out:platform`:
      return intl.formatMessage({
        defaultMessage: 'Platform tip reversal',
        id: 'zLk0ik',
      });
  }

  if (kind === TransactionKind.TAX) {
    return direction === 'in'
      ? intl.formatMessage({ defaultMessage: 'Tax refunded', id: 'GCqf3v' })
      : intl.formatMessage({ defaultMessage: 'Tax reversal', id: 'unSvmK' });
  }

  return i18nTransactionKind(intl, kind);
};

const buildRefundAllocation = (transaction: TransactionData, intl: IntlShape): RefundAllocation => {
  const currency = transaction.amount?.currency ?? transaction.netAmount?.currency;
  const { principalAccount, contributorAccount } = getRefundAccounts(transaction);
  const groups = new Map<string, AllocationGroupData>();

  const addLine = (account: AllocationAccount | null | undefined, line: AllocationLine) => {
    const key = account?.id ?? 'unknown';
    const role = line.role;
    const group = groups.get(key) ?? {
      key,
      account,
      role,
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

      const outflowAccount =
        !isPlatformTransactionKind(entry.kind) && entry.account?.type === AccountType.VENDOR && transaction.host
          ? transaction.host
          : entry.account;
      const outflowRole = isPlatformTransactionKind(entry.kind)
        ? 'platform'
        : getAllocationRole(outflowAccount, principalAccount, contributorAccount, transaction.host);
      const inflowRole = getAllocationRole(
        entry.oppositeAccount,
        principalAccount,
        contributorAccount,
        transaction.host,
      );
      const outflowLabel = getLineQualifier(intl, entry.kind ?? undefined, 'out', outflowRole);
      const inflowLabel = getLineQualifier(intl, entry.kind ?? undefined, 'in', inflowRole);
      const sortKey = entry.kind === TransactionKind.CONTRIBUTION ? '' : String(inflowLabel ?? outflowLabel ?? '');
      const lineKey = `${entry.id}-${entry.kind ?? 'transaction'}`;

      addLine(outflowAccount, {
        key: `${lineKey}-outflow`,
        qualifier: outflowLabel,
        amount: -amount,
        sortKey,
        kind: entry.kind ?? undefined,
        direction: 'out',
        role: outflowRole,
      });
      addLine(entry.oppositeAccount, {
        key: `${lineKey}-inflow`,
        qualifier: inflowLabel,
        amount,
        sortKey,
        kind: entry.kind ?? undefined,
        direction: 'in',
        role: inflowRole,
      });
    });

  groups.forEach(group => {
    group.lines.sort((a, b) => String(a.sortKey ?? '').localeCompare(String(b.sortKey ?? '')));
  });

  const outflow = [...groups.values()]
    .filter(group => group.total < 0)
    .sort((a, b) => getAllocationAccountName(a.account).localeCompare(getAllocationAccountName(b.account)));
  const inflow = [...groups.values()]
    .filter(group => group.total > 0)
    .sort((a, b) => getAllocationAccountName(a.account).localeCompare(getAllocationAccountName(b.account)));

  const principalOutflowGroup = outflow.find(group => group.role === 'collective');

  return {
    currency,
    principalAccount,
    principalOutflowAmount: principalOutflowGroup ? Math.abs(principalOutflowGroup.total) : 0,
    refundAmount: inflow.reduce((sum, group) => sum + group.total, 0),
    outflow,
    inflow,
  };
};

const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`text-xs font-semibold tracking-wide text-muted-foreground uppercase ${className ?? ''}`}>
    {children}
  </div>
);

const AccountSummary: React.FC<{ account: AllocationAccount | null | undefined }> = ({ account }) => {
  const accountTrigger = (
    <div className="flex min-w-0 cursor-default items-center gap-2">
      <Avatar collective={account ?? undefined} radius={20} />
      <span className="min-w-0 truncate text-sm font-medium">{getAllocationAccountName(account)}</span>
    </div>
  );

  return account ? <AccountHoverCard account={account} trigger={accountTrigger} /> : accountTrigger;
};

const ContributionDetail: React.FC<{ transaction: TransactionData; amount: number; currency?: string }> = ({
  transaction,
  amount,
  currency,
}) => {
  const { principalAccount, contributorAccount } = getRefundAccounts(transaction);

  return (
    <Section>
      <SectionTitle className="mb-4">
        <FormattedMessage defaultMessage="Contribution detail" id="oJIBP2" />
      </SectionTitle>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="text-muted-foreground">
            <FormattedMessage defaultMessage="Contributed by" id="DdgpvU" />
          </div>
          <AccountSummary account={contributorAccount} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-muted-foreground">
            <FormattedMessage defaultMessage="Contribution to" id="kQwHjA" />
          </div>
          <AccountSummary account={principalAccount} />
        </div>

        {currency && (
          <div className="flex items-center justify-between gap-4">
            <div className="text-muted-foreground">
              <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
            </div>
            <div className="text-right font-medium tabular-nums">
              <FormattedMoneyAmount amount={amount} currency={currency} showCurrencyCode />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="text-muted-foreground">
            <FormattedMessage defaultMessage="Date" id="expense.incurredAt" />
          </div>
          <div className="text-right font-medium">
            <FormattedDate value={transaction.createdAt} day="numeric" month="long" year="numeric" />
          </div>
        </div>
      </div>
    </Section>
  );
};

const AllocationGroupHeading: React.FC<{ group: AllocationGroupData }> = ({ group }) => {
  if (group.role === 'contributor') {
    return <FormattedMessage defaultMessage="Amount refunded to contributor" id="AYMOhy" />;
  } else if (group.role === 'collective') {
    return <FormattedMessage defaultMessage="Deducted from Collective balance" id="zh1XTV" />;
  } else if (group.role === 'host') {
    return <FormattedMessage defaultMessage="Deducted from Host balance" id="W3mNpa" />;
  } else if (group.role === 'platform') {
    return <FormattedMessage defaultMessage="Deducted from platform" id="vxQI0/" />;
  }

  return group.total > 0 ? (
    <FormattedMessage
      defaultMessage="Refunded to {account}"
      id="K5RpBH"
      values={{ account: getAllocationAccountName(group.account) }}
    />
  ) : (
    <FormattedMessage
      defaultMessage="Deducted from {account}"
      id="HBPLC4"
      values={{ account: getAllocationAccountName(group.account) }}
    />
  );
};

const AllocationGroup: React.FC<{
  group: AllocationGroupData;
  currency: string;
}> = ({ group, currency }) => {
  const getPrefix = (amount: number) => (amount > 0 ? '+' : '');

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
        <span>
          <AllocationGroupHeading group={group} />
        </span>
        <span className="shrink-0 tabular-nums">
          {getPrefix(group.total)}
          <FormattedMoneyAmount amount={group.total} currency={currency} showCurrencyCode={false} />
        </span>
      </div>
      {group.lines.map(line => (
        <div key={line.key} className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="truncate">{line.qualifier}</span>
          <span className="shrink-0 tabular-nums">
            {getPrefix(line.amount)}
            <FormattedMoneyAmount amount={line.amount} currency={currency} showCurrencyCode={false} />
          </span>
        </div>
      ))}
    </div>
  );
};

type RefundOptions = {
  showCancelRecurring: boolean;
  showRemoveAsContributor: boolean;
  showHostMessage: boolean;
  canIgnoreBalanceCheck: boolean;
};

type HostRefundChargeFormProps = {
  transaction: TransactionData;
  options: RefundOptions;
  onClose: () => void;
};

const HostRefundChargeForm: React.FC<HostRefundChargeFormProps> = ({ transaction, options, onClose }) => {
  const intl = useIntl();
  const { values, setFieldValue, isSubmitting } = useFormikContext<HostRefundChargeFormValues>();

  const refundAllocation = React.useMemo(() => buildRefundAllocation(transaction, intl), [intl, transaction]);
  const { currency, refundAmount, outflow, inflow, principalAccount, principalOutflowAmount } = refundAllocation;
  const allocationGroups = React.useMemo(() => {
    const orderedGroups = [
      inflow.find(group => group.role === 'contributor'),
      outflow.find(group => group.role === 'collective'),
      outflow.find(group => group.role === 'host'),
      outflow.find(group => group.role === 'platform'),
      ...inflow.filter(group => group.role !== 'contributor'),
      ...outflow.filter(group => !['collective', 'host', 'platform'].includes(group.role)),
    ];

    return orderedGroups.filter((group): group is AllocationGroupData => Boolean(group && group.total));
  }, [inflow, outflow]);

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
      return <FormattedMessage defaultMessage="Refund, cancel & remove contributor" id="tcfKDv" />;
    }
    if (values.cancelRecurringContribution) {
      return <FormattedMessage defaultMessage="Refund & cancel contribution" id="A3w8tJ" />;
    }
    if (values.removeAsContributor) {
      return <FormattedMessage defaultMessage="Refund & remove contributor" id="gbYv/S" />;
    }
    return <FormattedMessage defaultMessage="Refund" id="Refund" />;
  })();

  return (
    <Form className="flex flex-col gap-4">
      <ContributionDetail transaction={transaction} amount={refundAmount} currency={currency} />

      {currency && allocationGroups.length > 0 && (
        <Section>
          <div className="flex flex-col gap-4">
            <SectionTitle>
              <FormattedMessage defaultMessage="Refund allocation" id="UfZM5J" />
            </SectionTitle>
            {allocationGroups.map(group => (
              <React.Fragment key={group.key}>
                <AllocationGroup group={group} currency={currency} />
                {group.role === 'collective' && isInsufficientBalance && principalBalanceCurrency && (
                  <MessageBox type="warning" withIcon px={3} py={2}>
                    <div className="flex flex-col gap-3">
                      <span>
                        <FormattedMessage
                          defaultMessage="{collective}'s balance ({balance}) won't cover the {amount} that would be deducted to process this refund."
                          id="RB/W6s"
                          values={{
                            collective: (
                              <span className="font-medium">{principalAccount?.name || principalAccount?.slug}</span>
                            ),
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
                      </span>
                      <div className="flex items-center gap-1.5 text-sm">
                        <label className="flex cursor-pointer items-center gap-2">
                          <Checkbox
                            checked={values.ignoreBalanceCheck}
                            onCheckedChange={checked => setFieldValue('ignoreBalanceCheck', checked === true)}
                            disabled={isSubmitting}
                          />
                          <span className="font-medium">
                            <FormattedMessage defaultMessage="Allow negative balance" id="CcDFSI" />
                          </span>
                        </label>
                        <Tooltip>
                          <TooltipTrigger
                            className="inline-flex text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                          >
                            <Info className="size-3.5" aria-hidden />
                            <span className="sr-only">
                              <FormattedMessage defaultMessage="More info" id="moreInfo" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <FormattedMessage
                              defaultMessage="Process the refund and ignore the balance. The Collective's balance will go negative until additional contributions are received."
                              id="+vpPIw"
                            />
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </MessageBox>
                )}
              </React.Fragment>
            ))}
          </div>
        </Section>
      )}

      {(options.showCancelRecurring || options.showRemoveAsContributor) && (
        <Section>
          <SectionTitle className="mb-3">
            <FormattedMessage defaultMessage="Additional actions" id="vCd8DW" />
          </SectionTitle>
          {(options.showCancelRecurring || options.showRemoveAsContributor) && (
            <div className="flex flex-col gap-2">
              {options.showCancelRecurring && (
                <div className="flex items-center gap-1.5 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={values.cancelRecurringContribution}
                      onCheckedChange={checked => setFieldValue('cancelRecurringContribution', checked === true)}
                      disabled={isSubmitting}
                    />
                    <span className="font-medium">
                      <FormattedMessage defaultMessage="Cancel recurring contribution" id="rvR3Fm" />
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
                        defaultMessage="No future charges will be made for this contribution."
                        id="pB1jn6"
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
                      <FormattedMessage defaultMessage="Remove contributor from Collective" id="BkIpny" />
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
                        defaultMessage="The contributor will be hidden from public profile and exports, but the contribution stays in the ledger."
                        id="qGlrSx"
                      />
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {options.showHostMessage && (
        <Section>
          <div className="flex items-center justify-between gap-4">
            <SectionTitle>
              <FormattedMessage defaultMessage="Send custom message to contributor" id="tLNi3x" />
            </SectionTitle>
            <Switch
              checked={values.sendMessage}
              onCheckedChange={checked => setFieldValue('sendMessage', checked === true)}
              disabled={isSubmitting}
            />
          </div>
          {values.sendMessage && (
            <FormField name="message" className="mt-4">
              {({ field }) => (
                <Textarea
                  {...field}
                  rows={3}
                  className="h-auto min-h-20"
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Type your message here...',
                    id: 'Olq7Wf',
                  })}
                  disabled={isSubmitting}
                  maxLength={2000}
                />
              )}
            </FormField>
          )}
        </Section>
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

export const HostRefundChargeModal = ({
  transaction: transactionRef,
  open,
  setOpen,
  onCloseFocusRef,
  onSuccess,
}: HostRefundChargeModalProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const { LoggedInUser } = useLoggedInUser();

  const { data, previousData, loading, error } = useQuery<
    HostRefundPaymentTransactionQuery,
    HostRefundPaymentTransactionQueryVariables
  >(hostRefundChargeTransactionQuery, {
    variables: { transaction: { id: transactionRef.id } },
    skip: !open,
    fetchPolicy: 'cache-and-network',
  });

  const queriedTransaction = data?.transaction ?? previousData?.transaction;
  const transaction = queriedTransaction?.id === transactionRef.id ? queriedTransaction : undefined;
  const order = transaction?.order;

  const isFiscalHostAdmin = Boolean(transaction?.host && LoggedInUser?.isAdminOfCollective(transaction.host));

  const options: RefundOptions = {
    showCancelRecurring: Boolean(order?.permissions?.canCancel),
    showRemoveAsContributor: Boolean(order?.permissions?.canRemoveAsContributor),
    showHostMessage: isFiscalHostAdmin,
    canIgnoreBalanceCheck: isFiscalHostAdmin,
  };

  const [runRefund] = useMutation<HostRefundPaymentMutation, HostRefundPaymentMutationVariables>(
    hostRefundChargeMutation,
  );

  const handleClose = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
    },
    [setOpen],
  );

  const initialValues = React.useMemo<HostRefundChargeFormValues>(
    () => ({
      cancelRecurringContribution: options.showCancelRecurring,
      removeAsContributor: false,
      sendMessage: false,
      message: '',
      ignoreBalanceCheck: false,
    }),
    [options.showCancelRecurring],
  );

  const handleSubmit = async (values: HostRefundChargeFormValues) => {
    if (!transaction) {
      return;
    }

    try {
      await runRefund({
        variables: {
          transaction: { id: transaction.id },
          cancelRecurringContribution: options.showCancelRecurring ? values.cancelRecurringContribution : null,
          removeAsContributor: options.showRemoveAsContributor ? values.removeAsContributor : null,
          messageForContributor: options.showHostMessage && values.sendMessage ? values.message?.trim() || null : null,
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        onCloseAutoFocus={e => {
          if (onCloseFocusRef?.current) {
            e.preventDefault();
            onCloseFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Refund contribution charge" id="gCyTuO" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage defaultMessage="Review and confirm the refund details." id="i4akIU" />
          </DialogDescription>
        </DialogHeader>

        {loading && !transaction ? (
          <Loading />
        ) : error || !transaction ? (
          <MessageBox type="error" withIcon>
            {error ? (
              i18nGraphqlException(intl, error)
            ) : (
              <FormattedMessage defaultMessage="Transaction not found" id="zAGlVG" />
            )}
          </MessageBox>
        ) : (
          <FormikZod<HostRefundChargeFormValues>
            key={transaction.id}
            schema={HostRefundChargeFormSchema}
            initialValues={initialValues}
            onSubmit={handleSubmit}
          >
            <HostRefundChargeForm transaction={transaction} options={options} onClose={() => handleClose(false)} />
          </FormikZod>
        )}
      </DialogContent>
    </Dialog>
  );
};
