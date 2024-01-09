import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { isNil } from 'lodash';
import { Check, Copy, InfoIcon, MoreHorizontal, Undo2, X } from 'lucide-react'; // eslint-disable-next-line no-restricted-imports -- components/Link does not currently accept a ref, whichis required when used 'asChild' of Button
// eslint-disable-next-line no-restricted-imports -- components/Link does not currently accept a ref, which is required when used 'asChild' of HoverCardTrigger
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';

import { TransactionKind } from '../../../../lib/constants/transactions';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { useAsyncCall } from '../../../../lib/hooks/useAsyncCall';
import useClipboard from '../../../../lib/hooks/useClipboard';
import { i18nTransactionKind, i18nTransactionType } from '../../../../lib/i18n/transaction';
import { saveInvoice } from '../../../../lib/transactions';

import { AccountHoverCard, accountHoverCardFields } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import ExpenseBudgetItem from '../../../budget/ExpenseBudgetItem';
import OrderBudgetItem from '../../../budget/OrderBudgetItem';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../../ui/HoverCard';
import { Sheet, SheetContent } from '../../../ui/Sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';

import TransactionRefundButton from './TransactionRefundButton';
import TransactionRejectButton from './TransactionRejectButton';

const isInternalTransfer = (fromAccount, toAccount) => {
  if (!fromAccount || !toAccount) {
    return false;
  }
  return fromAccount.parent?.id === toAccount.id || fromAccount.id === toAccount.host?.id;
};

const { CONTRIBUTION, ADDED_FUNDS, PLATFORM_TIP } = TransactionKind;

const transactionQuery = gql`
  query TransactionDetails($id: String!) {
    transaction(id: $id) {
      id
      legacyId
      uuid
      group
      amount {
        valueInCents
        currency
      }
      paymentProcessorFee(fetchPaymentProcessorFee: true) {
        valueInCents
        currency
      }
      hostFee {
        valueInCents
        currency
      }
      netAmount {
        valueInCents
        currency
      }
      taxAmount(fetchTax: true) {
        valueInCents
        currency
      }
      oppositeTransaction {
        id
        uuid
      }
      paymentMethod {
        id
        type
      }
      type
      kind
      description
      createdAt
      isRefunded
      isRefund
      isInReview
      isDisputed
      isOrderRejected
      account {
        id
        name
        slug
        isIncognito
        description
        type
        ... on AccountWithHost {
          host {
            id
            name
            slug
          }
          approvedAt
        }
        ... on AccountWithParent {
          parent {
            id
            name
            slug
          }
        }
        ...AccountHoverCardFields
      }
      fromAccount {
        id
        ... on AccountWithParent {
          parent {
            id
          }
        }
      }
      toAccount {
        id
        ... on AccountWithHost {
          host {
            id
          }
        }
      }
      oppositeAccount {
        id
        name
        slug
        imageUrl
        type
        ...AccountHoverCardFields
      }

      permissions {
        id
        canRefund # is this on transaction or related thing?
        canDownloadInvoice
        canReject
      }
      order {
        id
        legacyId
        status
        description
        processedAt
        createdAt
        amount {
          valueInCents
          currency
        }
        toAccount {
          id
          slug
        }
        fromAccount {
          id
          slug
        }
      }
      expense {
        id
        status
        tags
        type
        feesPayer
        amount
        currency
        description
        legacyId
        # limit: 1 as current best practice to avoid the API fetching entries it doesn't need
        comments(limit: 1) {
          totalCount
        }
        payoutMethod {
          id
          type
        }
        account {
          id
          slug
        }
        createdByAccount {
          id
          slug
        }
        permissions {
          id
        }
        createdAt
        payee {
          id
          slug
          imageUrl
        }
      }
      refundTransaction {
        id
        createdAt
      }
    }
  }
  ${accountHoverCardFields}
`;

const DataList = ({ title, value }) => {
  return (
    <div className="relative flex w-full">
      <div className="min-w-[180px] max-w-[240px] shrink-0 grow-0 basis-1/4 text-muted-foreground">{title}</div>
      <div className="overflow-hidden">{value}</div>
    </div>
  );
};

const CopyID = ({ children, tooltipLabel = <FormattedMessage defaultMessage="Copy ID" /> }) => {
  const { isCopied, copy } = useClipboard();

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <button
          tabIndex={-1}
          onClick={e => {
            e.preventDefault(); // Prevent tooltip from closing when copying
            copy(children);
          }}
          className="inline-flex cursor-pointer select-text items-center gap-1 truncate rounded-sm bg-slate-50 px-1 text-left font-mono text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
        >
          {children} <Copy className="select-none" size={12} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        onPointerDownOutside={e => {
          e.preventDefault(); // Prevent tooltip from closing when copying
        }}
      >
        {isCopied ? (
          <div className="flex items-center gap-1">
            <Check size={16} />
            <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
          </div>
        ) : (
          tooltipLabel
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export function TransactionDrawer({
  open,
  setOpen,
  transactionId,
  transaction: preloadedTransaction,
  setFilter,
  resetFilters,
  refetchList,
}) {
  const intl = useIntl();
  const { data, refetch } = useQuery(transactionQuery, {
    variables: { id: transactionId },
    skip: !open,
    context: API_V2_CONTEXT,
  });
  const { callWith: downloadInvoiceWith } = useAsyncCall(saveInvoice, { useErrorToast: true });

  // Use the preloaded transaction from the row if it exists (and matches the transactionId)
  const { transaction } = data || {
    transaction: transactionId
      ? preloadedTransaction?.id === transactionId
        ? preloadedTransaction
        : null
      : preloadedTransaction,
  };

  const onMutationSuccess = () => {
    refetch();
    refetchList?.();
  };

  const showActions =
    transaction?.kind === TransactionKind.EXPENSE ||
    (transaction?.order !== null &&
      [CONTRIBUTION, ADDED_FUNDS, PLATFORM_TIP].includes(transaction?.kind) &&
      transaction?.paymentMethod);

  const showRefundButton = showActions && transaction?.permissions.canRefund && !transaction?.isRefunded;
  const showRejectButton = showActions && transaction?.permissions.canReject && !transaction?.isRejected;
  const showDownloadInvoiceButton =
    showActions &&
    transaction?.permissions.canDownloadInvoice &&
    !isInternalTransfer(transaction?.fromAccount, transaction?.toAccount);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent data-cy="transactions-drawer" className="max-w-xl">
        <div className="text-sm">
          <div className="flex flex-col gap-1 border-b px-0 pb-2 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                <FormattedMessage defaultMessage="Transaction ID" />{' '}
                <CopyID tooltipLabel={<FormattedMessage defaultMessage="Copy transaction ID" />}>
                  {transaction?.id ?? transactionId}
                </CopyID>
              </span>
              <Button variant="ghost" size="icon-xs" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
                <span className="sr-only">
                  <FormattedMessage id="Close" defaultMessage="Close" />
                </span>
              </Button>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                {transaction?.netAmount && (
                  <div className="text-2xl">
                    <span className={'font-bold text-foreground'}>
                      <FormattedMoneyAmount
                        amount={transaction?.netAmount.valueInCents}
                        currency={transaction?.netAmount.currency}
                        precision="2"
                        amountStyles={{ letterSpacing: 0 }}
                        showCurrencyCode={false}
                      />
                    </span>

                    <span className="text-muted-foreground">{transaction?.netAmount.currency}</span>
                  </div>
                )}
                {transaction?.isRefunded && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => setFilter('openTransactionId', transaction?.refundTransaction.id)}>
                        <Badge size="sm" type="warning" className="gap-1">
                          <Undo2 size={16} />
                          <FormattedMessage defaultMessage="Refunded" />
                        </Badge>
                      </button>
                    </TooltipTrigger>

                    <TooltipContent>
                      <FormattedMessage
                        defaultMessage="Refunded on {date}"
                        values={{
                          date: (
                            <DateTime
                              dateStyle="medium"
                              timeStyle="short"
                              value={transaction?.refundTransaction?.createdAt}
                            />
                          ),
                        }}
                      />
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="flex items-center gap-1">
                {showRefundButton && (
                  <TransactionRefundButton id={transaction?.id} onMutationSuccess={onMutationSuccess} />
                )}

                {showRejectButton && (
                  <TransactionRejectButton
                    id={transaction?.id}
                    onMutationSuccess={onMutationSuccess}
                    canRefund={transaction?.permissions.canRefund && !transaction?.isRefunded}
                  />
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon-xs">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setOpen(false);
                        resetFilters({ group: transaction?.group });
                      }}
                    >
                      <FormattedMessage defaultMessage="View transactions in group" />
                    </DropdownMenuItem>
                    {showDownloadInvoiceButton && (
                      <DropdownMenuItem
                        onClick={downloadInvoiceWith({
                          transactionUuid: transaction?.uuid,
                          toCollectiveSlug: transaction?.toAccount?.slug,
                        })}
                      >
                        {transaction?.expense ? (
                          <FormattedMessage defaultMessage="Download Invoice" />
                        ) : (
                          <FormattedMessage defaultMessage="Download Receipt" />
                        )}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex h-8 items-center gap-1 text-muted-foreground">
              <FormattedMessage
                defaultMessage="{transactionType, select, CREDIT {Credited to} DEBIT {Debited from} other {}} {account} on {date}"
                values={{
                  transactionType: transaction?.type,
                  account: (
                    <AccountHoverCard
                      account={transaction?.account}
                      trigger={
                        <Link
                          className="flex items-center gap-1 font-medium text-foreground hover:text-primary hover:underline"
                          href={`/${transaction?.account.slug}`}
                        >
                          <Avatar radius={20} collective={transaction?.account} />
                          {transaction?.account.name}
                        </Link>
                      }
                    />
                  ),
                  date: transaction?.createdAt && (
                    <DateTime dateStyle="medium" timeStyle="short" value={transaction?.createdAt} />
                  ),
                }}
              />
            </div>
          </div>
          <div className="py-6">
            <div className="mb-4 flex items-center gap-3">
              <h4 className="whitespace-nowrap text-base font-semibold">
                <FormattedMessage defaultMessage="Transaction details" />
              </h4>
            </div>

            <div className="flex flex-col gap-2">
              <DataList
                title={<FormattedMessage defaultMessage="ID" />}
                value={
                  <CopyID tooltipLabel={<FormattedMessage defaultMessage="Copy transaction ID" />}>
                    {transaction?.id}
                  </CopyID>
                }
              />
              <DataList
                title={<FormattedMessage defaultMessage="Group ID" />}
                value={
                  <CopyID tooltipLabel={<FormattedMessage defaultMessage="Copy transaction group ID" />}>
                    {transaction?.group}
                  </CopyID>
                }
              />

              <DataList
                title={<FormattedMessage id="expense.incurredAt" defaultMessage="Date" />}
                value={
                  transaction?.createdAt && (
                    <DateTime dateStyle="medium" timeStyle="short" value={transaction?.createdAt} />
                  )
                }
              />
              <DataList
                title={<FormattedMessage defaultMessage="Type" />}
                value={i18nTransactionType(intl, transaction?.type)}
              />

              <DataList
                title={<FormattedMessage id="Transaction.Kind" defaultMessage="Kind" />}
                value={
                  <div className="flex items-center gap-1">
                    {i18nTransactionKind(intl, transaction?.kind)}{' '}
                    {transaction?.isRefund && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => setFilter('openTransactionId', transaction?.refundTransaction?.id)}>
                            <Badge size="xs" type="success" className="gap-1">
                              <FormattedMessage id="Refund" defaultMessage="Refund" />
                            </Badge>
                          </button>
                        </TooltipTrigger>

                        <TooltipContent>
                          <FormattedMessage defaultMessage="View transaction that was refunded" />
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                }
              />
              <DataList
                title={<FormattedMessage defaultMessage="Account" />}
                value={
                  <AccountHoverCard
                    account={transaction?.account}
                    trigger={
                      <Link
                        className="flex items-center gap-1 font-medium hover:text-primary hover:underline"
                        href={`/${transaction?.account.slug}`}
                      >
                        <Avatar radius={20} collective={transaction?.account} />
                        {transaction?.account.name}
                      </Link>
                    }
                  />
                }
              />
              <DataList
                title={<FormattedMessage id="Fields.amount" defaultMessage="Amount" />}
                value={
                  <FormattedMoneyAmount
                    amount={transaction?.amount.valueInCents}
                    currency={transaction?.amount.currency}
                    precision="2"
                    amountStyles={{ letterSpacing: 0 }}
                    showCurrencyCode={false}
                  />
                }
              />
              {!isNil(transaction?.paymentProcessorFee?.valueInCents) &&
                transaction?.paymentProcessorFee?.valueInCents !== 0 && (
                  <DataList
                    title={<FormattedMessage id="contribution.paymentFee" defaultMessage="Payment processor fee" />}
                    value={
                      <FormattedMoneyAmount
                        amount={transaction?.paymentProcessorFee.valueInCents}
                        currency={transaction?.paymentProcessorFee.currency}
                        precision="2"
                        amountStyles={{ letterSpacing: 0 }}
                        showCurrencyCode={false}
                      />
                    }
                  />
                )}
              {!isNil(transaction?.hostFee?.valueInCents) && transaction?.hostFee?.valueInCents !== 0 && (
                <DataList
                  title={<FormattedMessage id="HostFee" defaultMessage="Host fee" />}
                  value={
                    <FormattedMoneyAmount
                      amount={transaction?.hostFee.valueInCents}
                      currency={transaction?.hostFee.currency}
                      precision="2"
                      amountStyles={{ letterSpacing: 0 }}
                      showCurrencyCode={false}
                    />
                  }
                />
              )}
              {!isNil(transaction?.taxAmount?.valueInCents) && transaction?.taxAmount?.valueInCents !== 0 && (
                <DataList
                  title={<FormattedMessage defaultMessage="Taxes" />}
                  value={
                    <FormattedMoneyAmount
                      amount={transaction?.taxAmount.valueInCents}
                      currency={transaction?.taxAmount.currency}
                      precision="2"
                      amountStyles={{ letterSpacing: 0 }}
                      showCurrencyCode={false}
                    />
                  }
                />
              )}
              {transaction?.netAmount?.valueInCents !== transaction?.amount.valueInCents && (
                <DataList
                  title={<FormattedMessage defaultMessage="Net Amount" />}
                  value={
                    <FormattedMoneyAmount
                      amount={transaction?.netAmount.valueInCents}
                      currency={transaction?.netAmount.currency}
                      precision="2"
                      amountStyles={{ letterSpacing: 0 }}
                      showCurrencyCode={false}
                    />
                  }
                />
              )}
              <DataList
                title={<FormattedMessage defaultMessage="Opposite account" />}
                value={
                  <AccountHoverCard
                    account={transaction?.oppositeAccount}
                    trigger={
                      <Link
                        className="flex items-center gap-1 font-medium hover:text-primary hover:underline"
                        href={`/${transaction?.oppositeAccount?.slug}`}
                      >
                        <Avatar radius={20} collective={transaction?.oppositeAccount} />
                        {transaction?.oppositeAccount?.name}
                      </Link>
                    }
                  />
                }
              />

              <DataList
                title={
                  <div className="flex items-center gap-1">
                    <FormattedMessage defaultMessage="Opposite transaction ID" />

                    <Tooltip>
                      <TooltipTrigger className="cursor-help" onClick={e => e.preventDefault()}>
                        <InfoIcon size={16} />
                      </TooltipTrigger>
                      <TooltipContent onPointerDownOutside={e => e.preventDefault()}>
                        <FormattedMessage defaultMessage="All transactions have an opposite debit or credit transaction" />
                      </TooltipContent>
                    </Tooltip>
                  </div>
                }
                value={
                  <CopyID tooltipLabel={<FormattedMessage defaultMessage="Copy opposite transaction ID" />}>
                    {transaction?.oppositeTransaction?.id}
                  </CopyID>
                }
              />

              {transaction?.isRefund && transaction?.refundTransaction && (
                <DataList
                  title={<FormattedMessage defaultMessage="Refund of transaction" />}
                  value={
                    <CopyID tooltipLabel={<FormattedMessage defaultMessage="Copy refund transaction ID" />}>
                      {transaction?.refundTransaction?.id}
                    </CopyID>
                  }
                />
              )}

              {transaction?.expense?.account?.slug && (
                <DataList
                  title={<FormattedMessage defaultMessage="Related expense" />}
                  value={
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Link
                          href={`/${transaction?.expense.account.slug}/expenses/${transaction?.expense.legacyId}`}
                          className="underline hover:text-primary"
                        >
                          {transaction?.expense.description}
                        </Link>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-[420px] overflow-hidden p-0">
                        <ExpenseBudgetItem isInverted expense={transaction?.expense} showAmountSign />
                      </HoverCardContent>
                    </HoverCard>
                  }
                />
              )}
              {transaction?.order && (
                <DataList
                  title={<FormattedMessage defaultMessage="Related contribution" />}
                  value={
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Link
                          href={`/${transaction?.order.toAccount.slug}/contributions/${transaction?.order.legacyId}`}
                          className="underline hover:text-primary"
                        >
                          {transaction?.order.description}
                        </Link>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-[420px] p-0">
                        <OrderBudgetItem order={transaction?.order} showPlatformTip showAmountSign />
                      </HoverCardContent>
                    </HoverCard>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
