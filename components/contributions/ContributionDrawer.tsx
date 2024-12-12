import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { isEmpty } from 'lodash';
import { Check, Link as LinkIcon, X } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../lib/actions/types';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type { ContributionDrawerQuery, ContributionDrawerQueryVariables } from '../../lib/graphql/types/v2/graphql';
import { ContributionFrequency, OrderStatus } from '../../lib/graphql/types/v2/schema';
import useClipboard from '../../lib/hooks/useClipboard';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { i18nPaymentMethodProviderType } from '../../lib/i18n/payment-method-provider-type';
import type LoggedInUser from '../../lib/LoggedInUser';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { OrderAdminAccountingCategoryPill } from '../orders/OrderAccountingCategoryPill';
import OrderStatusTag from '../orders/OrderStatusTag';
import PaymentMethodTypeWithIcon from '../PaymentMethodTypeWithIcon';
import { DropdownActionItem } from '../table/RowActionsMenu';
import Tags from '../Tags';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { Sheet, SheetContent, SheetFooter } from '../ui/Sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

import ContributionTimeline, { getTransactionsUrl } from './ContributionTimeline';

type ContributionDrawerProps = {
  open: boolean;
  onClose: () => void;
  orderId?: number;
  getActions: GetActions<ContributionDrawerQuery['order']>;
};

const I18nFrequencyMessages = defineMessages({
  [ContributionFrequency.ONETIME]: {
    id: 'Frequency.OneTime',
    defaultMessage: 'One time',
  },
  [ContributionFrequency.MONTHLY]: {
    id: 'Frequency.Monthly',
    defaultMessage: 'Monthly',
  },
  [ContributionFrequency.YEARLY]: {
    id: 'Frequency.Yearly',
    defaultMessage: 'Yearly',
  },
});

function getTransactionOrderLink(LoggedInUser: LoggedInUser, order: ContributionDrawerQuery['order']): string {
  const url = getTransactionsUrl(LoggedInUser, order);
  url.searchParams.set('orderId', order.legacyId.toString());
  return url.toString();
}

export function ContributionDrawer(props: ContributionDrawerProps) {
  const clipboard = useClipboard();
  const intl = useIntl();

  const { LoggedInUser } = useLoggedInUser();

  const query = useQuery<ContributionDrawerQuery, ContributionDrawerQueryVariables>(
    gql`
      query ContributionDrawer($orderId: Int!) {
        order(order: { legacyId: $orderId }) {
          id
          legacyId
          nextChargeDate
          amount {
            value
            valueInCents
            currency
          }
          totalAmount {
            value
            valueInCents
            currency
          }
          paymentMethod {
            id
            type
          }
          status
          description
          createdAt
          processedAt
          frequency
          tier {
            id
            name
            description
          }
          createdByAccount {
            ...ContributionDrawerAccountFields
          }
          individual: createdByAccount {
            ...ContributionDrawerAccountFields
          }
          fromAccount {
            ...ContributionDrawerAccountFields
            ... on AccountWithHost {
              host {
                id
                slug
              }
            }
          }
          toAccount {
            ...ContributionDrawerAccountFields
          }
          platformTipEligible
          platformTipAmount {
            value
            valueInCents
            currency
          }
          hostFeePercent
          tags
          tax {
            type
            idNumber
            rate
          }
          accountingCategory {
            id
            name
            friendlyName
            code
          }
          activities {
            nodes {
              id
              type
              createdAt
              fromAccount {
                ...ContributionDrawerAccountFields
              }
              account {
                ...ContributionDrawerAccountFields
              }
              host {
                ...ContributionDrawerAccountFields
              }
              individual {
                ...ContributionDrawerAccountFields
              }
              data
              transaction {
                ...ContributionDrawerTransactionFields
              }
            }
          }
          customData
          memo
          needsConfirmation
          pendingContributionData {
            expectedAt
            paymentMethod
            ponumber
            memo
            fromAccountInfo {
              name
              email
            }
          }
          transactions {
            ...ContributionDrawerTransactionFields
          }
          permissions {
            id
            canResume
            canMarkAsExpired
            canMarkAsPaid
            canEdit
            canComment
            canSeePrivateActivities
            canSetTags
            canUpdateAccountingCategory
          }
        }
      }

      fragment ContributionDrawerAccountFields on Account {
        id
        name
        slug
        isIncognito
        type
        imageUrl
        isHost
        isArchived
        ... on Individual {
          isGuest
        }
        ... on AccountWithHost {
          host {
            id
            slug
            type
            accountingCategories {
              nodes {
                id
                code
                name
                friendlyName
                kind
                appliesTo
              }
            }
          }
          approvedAt
        }

        ... on AccountWithParent {
          parent {
            id
            slug
          }
        }
      }

      fragment ContributionDrawerTransactionFields on Transaction {
        id
        legacyId
        uuid
        kind
        amount {
          currency
          valueInCents
        }
        netAmount {
          currency
          valueInCents
        }
        group
        type
        description
        createdAt
        isRefunded
        isRefund
        isOrderRejected
        account {
          ...ContributionDrawerAccountFields
        }
        oppositeAccount {
          ...ContributionDrawerAccountFields
        }
        expense {
          id
          type
        }
        permissions {
          id
          canRefund
          canDownloadInvoice
          canReject
        }
        paymentProcessorUrl
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        orderId: props.orderId,
      },
      skip: !props.open || !props.orderId,
    },
  );

  const isLoading = !query.called || query.loading || !query.data || query.data.order?.legacyId !== props.orderId;

  const actions = query.data?.order ? props.getActions(query.data.order) : null;

  return (
    <Sheet open={props.open} onOpenChange={isOpen => !isOpen && props.onClose()}>
      <SheetContent className="flex max-w-xl flex-col overflow-hidden">
        <div className="flex-grow overflow-auto px-8 py-4">
          {query.error ? (
            <MessageBoxGraphqlError error={query.error} />
          ) : (
            <React.Fragment>
              <div className="flex items-center">
                <div className="flex items-center gap-2 text-lg font-bold">
                  <FormattedMessage defaultMessage="Contribution" id="0LK5eg" />
                  <div>{isLoading ? <LoadingPlaceholder height={20} /> : `# ${query.data.order.legacyId}`}</div>
                  {isLoading ? null : (
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          onPointerDown={e => {
                            e.stopPropagation();
                          }}
                          onClick={e => {
                            const orderUrl = new URL(
                              `${query.data.order.toAccount.slug}/orders/${query.data.order.legacyId}`,
                              window.location.origin,
                            );

                            e.preventDefault();
                            e.stopPropagation();
                            clipboard.copy(orderUrl.toString());
                          }}
                        >
                          <div className="cursor-pointer">
                            <LinkIcon size={16} />
                          </div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {clipboard.isCopied ? (
                          <div className="flex items-center gap-1">
                            <Check size={16} />
                            <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
                          </div>
                        ) : (
                          <FormattedMessage id="Clipboard.CopyShort" defaultMessage="Copy" />
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {query.data?.order?.status && <OrderStatusTag status={query.data.order.status} />}
                  <Button variant="ghost" size="icon-sm" onClick={props.onClose}>
                    <X size={16} />
                  </Button>
                </div>
              </div>
              {query.data?.order?.permissions?.canUpdateAccountingCategory &&
                query.data.order.toAccount &&
                'host' in query.data.order.toAccount && (
                  <div className="mb-4">
                    <OrderAdminAccountingCategoryPill
                      order={query.data?.order}
                      account={query.data?.order.toAccount}
                      host={query.data.order.toAccount.host}
                    />
                  </div>
                )}
              <div className="mb-4">
                {isLoading ? (
                  <LoadingPlaceholder height={20} />
                ) : (
                  <Tags canEdit={query.data?.order?.permissions?.canSetTags} order={query.data?.order} />
                )}
              </div>
              <div className="mb-6">
                <div>{isLoading ? <LoadingPlaceholder height={20} /> : query.data.order.description}</div>
              </div>
              <div className="text-sm">
                <div className="mb-4 grid grid-cols-3 gap-4 gap-y-6 text-sm [&>*>*:first-child]:mb-2 [&>*>*:first-child]:font-bold [&>*>*:first-child]:text-[#344256]">
                  <div>
                    <div>
                      <FormattedMessage defaultMessage="Contributor" id="Contributor" />
                    </div>
                    <div>
                      {isLoading ? (
                        <LoadingPlaceholder height={20} />
                      ) : (
                        <AccountHoverCard
                          account={query.data.order.fromAccount}
                          trigger={
                            <Link
                              className="flex items-center gap-1 hover:text-primary hover:underline"
                              href={`/${query.data.order.fromAccount.slug}`}
                            >
                              <Avatar radius={20} collective={query.data.order.fromAccount} />
                              {query.data.order.fromAccount.name}
                            </Link>
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <div>
                      <FormattedMessage defaultMessage="Collective" id="Collective" />
                    </div>
                    <div>
                      {isLoading ? (
                        <LoadingPlaceholder height={20} />
                      ) : (
                        <AccountHoverCard
                          account={query.data.order.toAccount}
                          trigger={
                            <Link
                              className="flex items-center gap-1 hover:text-primary hover:underline"
                              href={`/${query.data.order.toAccount.slug}`}
                            >
                              <Avatar radius={20} collective={query.data.order.toAccount} />
                              {query.data.order.toAccount.name}
                            </Link>
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <div>
                      <FormattedMessage defaultMessage="Payment Method" id="paymentmethod.label" />
                    </div>
                    <div>
                      {isLoading ? (
                        <LoadingPlaceholder height={20} />
                      ) : query.data.order.status === OrderStatus.PENDING ? (
                        i18nPaymentMethodProviderType(intl, query.data.order.pendingContributionData.paymentMethod)
                      ) : (
                        <PaymentMethodTypeWithIcon type={query.data.order.paymentMethod?.type} iconSize={16} />
                      )}
                    </div>
                  </div>

                  {query.data?.order?.status === OrderStatus.PENDING && (
                    <React.Fragment>
                      {query.data.order.pendingContributionData?.ponumber && (
                        <div className="col-span-3">
                          <div>
                            <FormattedMessage defaultMessage="PO Number" id="Fields.PONumber" />
                          </div>
                          <div>{query.data.order.pendingContributionData.ponumber}</div>
                        </div>
                      )}
                      {query.data.order.pendingContributionData?.fromAccountInfo && (
                        <div className="col-span-3">
                          <div>
                            <FormattedMessage defaultMessage="Contact" id="Contact" />
                          </div>
                          <div>
                            {query.data.order.pendingContributionData?.fromAccountInfo?.email
                              ? `${query.data.order.pendingContributionData.fromAccountInfo.name} (${query.data.order.pendingContributionData.fromAccountInfo.email})`
                              : query.data.order.pendingContributionData.fromAccountInfo.name}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  )}

                  <div className="col-span-3">
                    <div>
                      <FormattedMessage defaultMessage="Frequency" id="Frequency" />
                    </div>
                    <div>
                      {isLoading ? (
                        <LoadingPlaceholder height={20} />
                      ) : !query.data.order.frequency ? (
                        <FormattedMessage {...I18nFrequencyMessages[ContributionFrequency.ONETIME]} />
                      ) : (
                        <FormattedMessage {...I18nFrequencyMessages[query.data.order.frequency]} />
                      )}
                    </div>
                  </div>

                  <div className="col-span-3">
                    <div>
                      <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
                    </div>
                    <div>
                      {isLoading ? (
                        <LoadingPlaceholder height={20} />
                      ) : (
                        <React.Fragment>
                          <div>
                            <FormattedMessage
                              defaultMessage="Contribution amount: {amount}"
                              id="y8CXGa"
                              values={{
                                amount: (
                                  <FormattedMoneyAmount
                                    showCurrencyCode={false}
                                    currency={query.data.order.totalAmount.currency}
                                    amount={query.data.order.totalAmount.valueInCents}
                                  />
                                ),
                              }}
                            />
                          </div>
                          {query.data.order.platformTipAmount?.valueInCents > 0 && (
                            <div>
                              <FormattedMessage
                                defaultMessage="Includes Platform Tip: {amount}"
                                id="g1BbRX"
                                values={{
                                  amount: (
                                    <FormattedMoneyAmount
                                      showCurrencyCode={false}
                                      currency={query.data.order.platformTipAmount.currency}
                                      amount={query.data.order.platformTipAmount.valueInCents}
                                    />
                                  ),
                                }}
                              />
                            </div>
                          )}
                        </React.Fragment>
                      )}
                    </div>
                  </div>

                  {query.data?.order?.memo ||
                    (query.data?.order?.pendingContributionData?.memo && (
                      <div>
                        <div>
                          <FormattedMessage defaultMessage="Memo" id="D5NqQO" />
                        </div>
                        <div>{query.data.order.memo || query.data.order.pendingContributionData.memo}</div>
                      </div>
                    ))}
                  {!isEmpty(query.data?.order?.customData) && (
                    <div>
                      <div>
                        <FormattedMessage defaultMessage="Custom Data" id="DRPEis" />
                      </div>
                      <div>{JSON.stringify(query.data.order.customData)}</div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 py-4">
                    <div className="text-slate-80 w-fit text-base font-bold leading-6">
                      <FormattedMessage defaultMessage="Related Activity" id="LP8cIK" />
                    </div>
                    <hr className="flex-grow border-neutral-300" />
                    <Button asChild variant="outline" size="xs" disabled={isLoading} loading={isLoading}>
                      <Link href={query.data?.order ? getTransactionOrderLink(LoggedInUser, query.data.order) : '#'}>
                        <FormattedMessage defaultMessage="View transactions" id="DfQJQ6" />
                      </Link>
                    </Button>
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col gap-1">
                      <LoadingPlaceholder height={20} />
                      <LoadingPlaceholder height={20} />
                      <LoadingPlaceholder height={20} />
                      <LoadingPlaceholder height={20} />
                    </div>
                  ) : (
                    <ContributionTimeline order={query.data.order} />
                  )}
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
        <SheetFooter className="flex px-8 py-2">
          {(actions?.primary.length > 0 || actions?.secondary.length > 0) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="xs">
                  <FormattedMessage defaultMessage="More actions" id="S8/4ZI" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions?.primary?.map(action => <DropdownActionItem key={action.key} action={action} />)}

                {actions?.primary.length > 0 && actions?.secondary.length > 0 && <DropdownMenuSeparator />}

                {actions?.secondary?.map(action => <DropdownActionItem key={action.key} action={action} />)}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
