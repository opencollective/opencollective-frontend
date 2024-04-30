import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { isNil } from 'lodash';
import { AlertTriangle, InfoIcon, Undo } from 'lucide-react';
// eslint-disable-next-line no-restricted-imports -- components/Link does not currently accept a ref, which is required when used 'asChild' of HoverCardTrigger
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { usePrevious } from '../../../../lib/hooks/usePrevious';
import { i18nTransactionKind, i18nTransactionType } from '../../../../lib/i18n/transaction';

import { AccountHoverCard, accountHoverCardFields } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import ExpenseBudgetItem from '../../../budget/ExpenseBudgetItem';
import OrderBudgetItem from '../../../budget/OrderBudgetItem';
import { CopyID } from '../../../CopyId';
import DateTime from '../../../DateTime';
import DrawerHeader from '../../../DrawerHeader';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Badge } from '../../../ui/Badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../../ui/HoverCard';
import { Sheet, SheetBody, SheetContent } from '../../../ui/Sheet';
import { Skeleton } from '../../../ui/Skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';

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
      clearedAt
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
        canRefund
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
        paymentMethod {
          service
          type
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
        group
        createdAt
      }
    }
  }
  ${accountHoverCardFields}
`;

const DataList = ({ title, value }) => {
  return (
    <div className="relative flex w-full flex-col gap-1 sm:flex-row">
      <div className="min-w-[180px] max-w-[240px] shrink-0 grow-0 basis-1/4 text-muted-foreground">{title}</div>
      <div className="max-w-fit overflow-hidden">{value}</div>
    </div>
  );
};

export function TransactionDrawer({ open, onOpenChange, onCloseAutoFocus, transactionId, getActions }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent data-cy="transactions-drawer" className="max-w-xl" onCloseAutoFocus={onCloseAutoFocus}>
        <TransactionDetails transactionId={transactionId} getActions={getActions} />
      </SheetContent>
    </Sheet>
  );
}

function TransactionDetails({ transactionId, getActions }) {
  const intl = useIntl();
  const prevTransactionId = usePrevious(transactionId);
  const { data, refetch, loading } = useQuery(transactionQuery, {
    variables: { id: transactionId || prevTransactionId },
    context: API_V2_CONTEXT,
  });
  const { transaction } = data || { transaction: null };
  const dropdownTriggerRef = React.useRef();
  const actions = getActions(transaction, dropdownTriggerRef, refetch);

  return (
    <React.Fragment>
      <DrawerHeader
        actions={actions}
        dropdownTriggerRef={dropdownTriggerRef}
        entityName={<FormattedMessage defaultMessage="Transaction" id="1+ROfp" />}
        entityIdentifier={
          <CopyID tooltipLabel={<FormattedMessage defaultMessage="Copy transaction ID" id="zzd7ZI" />}>
            {transaction?.id ?? transactionId}
          </CopyID>
        }
        entityLabel={
          <React.Fragment>
            {loading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              transaction?.netAmount && (
                <div className="text-2xl">
                  <span className={'font-bold text-foreground'}>
                    <FormattedMoneyAmount
                      amount={transaction?.netAmount.valueInCents}
                      currency={transaction?.netAmount.currency}
                      precision={2}
                      amountStyles={{ letterSpacing: 0 }}
                      showCurrencyCode={false}
                    />
                  </span>

                  <span className="text-muted-foreground">{transaction?.netAmount.currency}</span>
                </div>
              )
            )}
            {transaction?.isRefunded && !transaction?.isOrderRejected && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge size="sm" type="warning" className="gap-1">
                    <Undo size={16} />
                    <FormattedMessage defaultMessage="Refunded" id="Gs86nL" />
                  </Badge>
                </TooltipTrigger>

                <TooltipContent>
                  <FormattedMessage
                    defaultMessage="Refunded on {date}"
                    id="CE7lQu"
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
            {transaction?.isRefunded && transaction?.isOrderRejected && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge size="sm" type="error" className="gap-1">
                    <AlertTriangle size={16} />
                    <FormattedMessage defaultMessage="Rejected" id="5qaD7s" />
                  </Badge>
                </TooltipTrigger>

                <TooltipContent>
                  <FormattedMessage
                    defaultMessage="Rejected and refunded on {date}"
                    id="4n+cMX"
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
          </React.Fragment>
        }
      />
      <SheetBody>
        <div className="text-sm">
          <div className="mb-4 flex items-center gap-3">
            <h4 className="whitespace-nowrap text-base font-semibold">
              <FormattedMessage defaultMessage="Transaction details" id="vZO4p4" />
            </h4>
          </div>

          <div className="flex flex-col gap-3 sm:gap-2">
            <DataList
              title={<FormattedMessage defaultMessage="Group ID" id="nBKj/i" />}
              value={
                <CopyID tooltipLabel={<FormattedMessage defaultMessage="Copy transaction group ID" id="IFjSNc" />}>
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
            {transaction?.clearedAt && (
              <DataList
                title={
                  <div className="flex items-center gap-1">
                    <FormattedMessage defaultMessage="Effective Date" id="Gh3Obs" />
                    <Tooltip>
                      <TooltipTrigger className="cursor-help" onClick={e => e.preventDefault()}>
                        <InfoIcon size={16} />
                      </TooltipTrigger>
                      <TooltipContent onPointerDownOutside={e => e.preventDefault()}>
                        <FormattedMessage
                          defaultMessage="The date funds were cleared on your bank, Wise, PayPal, Stripe or any other external account holding these funds."
                          id="s3O6iq"
                        />
                      </TooltipContent>
                    </Tooltip>
                  </div>
                }
                value={
                  transaction.clearedAt && (
                    <DateTime dateStyle="medium" timeStyle="short" value={transaction.clearedAt} />
                  )
                }
              />
            )}
            <DataList
              title={<FormattedMessage defaultMessage="Type" id="+U6ozc" />}
              value={i18nTransactionType(intl, transaction?.type)}
            />
            <DataList
              title={<FormattedMessage id="Transaction.Kind" defaultMessage="Kind" />}
              value={
                <div className="flex items-center gap-1">
                  {i18nTransactionKind(intl, transaction?.kind)}{' '}
                  {transaction?.isRefund && (
                    <Badge size="xs" type="success" className="gap-1">
                      <FormattedMessage id="Refund" defaultMessage="Refund" />
                    </Badge>
                  )}
                </div>
              }
            />
            <DataList
              title={<FormattedMessage defaultMessage="Account" id="TwyMau" />}
              value={
                loading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
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
                )
              }
            />
            <DataList
              title={<FormattedMessage id="Fields.amount" defaultMessage="Amount" />}
              value={
                loading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <FormattedMoneyAmount
                    amount={transaction?.amount.valueInCents}
                    currency={transaction?.amount.currency}
                    precision={2}
                    amountStyles={{ letterSpacing: 0 }}
                    showCurrencyCode={false}
                  />
                )
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
                      precision={2}
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
                    precision={2}
                    amountStyles={{ letterSpacing: 0 }}
                    showCurrencyCode={false}
                  />
                }
              />
            )}
            {!isNil(transaction?.taxAmount?.valueInCents) && transaction?.taxAmount?.valueInCents !== 0 && (
              <DataList
                title={<FormattedMessage defaultMessage="Taxes" id="r+dgiv" />}
                value={
                  <FormattedMoneyAmount
                    amount={transaction?.taxAmount.valueInCents}
                    currency={transaction?.taxAmount.currency}
                    precision={2}
                    amountStyles={{ letterSpacing: 0 }}
                    showCurrencyCode={false}
                  />
                }
              />
            )}
            {transaction?.netAmount?.valueInCents !== transaction?.amount.valueInCents && (
              <DataList
                title={<FormattedMessage defaultMessage="Net Amount" id="FxUka3" />}
                value={
                  <FormattedMoneyAmount
                    amount={transaction?.netAmount.valueInCents}
                    currency={transaction?.netAmount.currency}
                    precision={2}
                    amountStyles={{ letterSpacing: 0 }}
                    showCurrencyCode={false}
                  />
                }
              />
            )}
            <DataList
              title={<FormattedMessage defaultMessage="Opposite account" id="rcVYFz" />}
              value={
                loading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
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
                )
              }
            />

            <DataList
              title={
                <div className="flex items-center gap-1">
                  <FormattedMessage defaultMessage="Opposite transaction ID" id="Cqy0IH" />

                  <Tooltip>
                    <TooltipTrigger className="cursor-help" onClick={e => e.preventDefault()}>
                      <InfoIcon size={16} />
                    </TooltipTrigger>
                    <TooltipContent onPointerDownOutside={e => e.preventDefault()}>
                      <FormattedMessage
                        defaultMessage="All transactions have an opposite debit or credit transaction"
                        id="Evzo/s"
                      />
                    </TooltipContent>
                  </Tooltip>
                </div>
              }
              value={
                loading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <CopyID tooltipLabel={<FormattedMessage defaultMessage="Copy opposite transaction ID" id="WgAGHq" />}>
                    {transaction?.oppositeTransaction?.id}
                  </CopyID>
                )
              }
            />

            {transaction?.isRefund && transaction?.refundTransaction && (
              <DataList
                title={<FormattedMessage defaultMessage="Refund of transaction" id="OwAzRN" />}
                value={
                  <CopyID tooltipLabel={<FormattedMessage defaultMessage="Copy refund transaction ID" id="WRKLHX" />}>
                    {transaction?.refundTransaction?.id}
                  </CopyID>
                }
              />
            )}

            {transaction?.expense?.account?.slug && (
              <DataList
                title={<FormattedMessage defaultMessage="Related expense" id="iuxiAF" />}
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
                title={<FormattedMessage defaultMessage="Related contribution" id="ySzqZN" />}
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
      </SheetBody>
    </React.Fragment>
  );
}
