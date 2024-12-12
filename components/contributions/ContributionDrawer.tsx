import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { isEmpty } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../lib/actions/types';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type { ContributionDrawerQuery, ContributionDrawerQueryVariables } from '../../lib/graphql/types/v2/graphql';
import { ContributionFrequency, OrderStatus } from '../../lib/graphql/types/v2/graphql';
import { i18nFrequency } from '../../lib/i18n/order';
import { i18nPaymentMethodProviderType } from '../../lib/i18n/payment-method-provider-type';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import { CopyID } from '../CopyId';
import DateTime from '../DateTime';
import DrawerHeader from '../DrawerHeader';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { OrderAdminAccountingCategoryPill } from '../orders/OrderAccountingCategoryPill';
import OrderStatusTag from '../orders/OrderStatusTag';
import PaymentMethodTypeWithIcon from '../PaymentMethodTypeWithIcon';
import Tags from '../Tags';
import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '../ui/DataList';
import { InfoList, InfoListItem } from '../ui/InfoList';
import { Sheet, SheetContent } from '../ui/Sheet';
import { Skeleton } from '../ui/Skeleton';

import ContributionTimeline from './ContributionTimeline';

type ContributionDrawerProps = {
  open: boolean;
  onClose: () => void;
  orderId?: number;
  getActions: GetActions<ContributionDrawerQuery['order']>;
};

export function ContributionDrawer(props: ContributionDrawerProps) {
  const intl = useIntl();

  const query = useQuery<ContributionDrawerQuery, ContributionDrawerQueryVariables>(
    gql`
      query ContributionDrawer($orderId: Int!) {
        order(order: { legacyId: $orderId }) {
          id
          legacyId
          nextChargeDate
          lastChargedAt
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

  const dropdownTriggerRef = React.useRef();
  const actions = query.data?.order ? props.getActions(query.data.order, dropdownTriggerRef) : null;

  return (
    <Sheet open={props.open} onOpenChange={isOpen => !isOpen && props.onClose()}>
      <SheetContent className="flex max-w-xl flex-col overflow-hidden">
        <DrawerHeader
          actions={actions}
          dropdownTriggerRef={dropdownTriggerRef}
          entityName={
            <div className="flex items-center gap-1">
              <OrderStatusTag status={query.data?.order?.status} overflow="visible" />
              <FormattedMessage defaultMessage="Contribution" id="0LK5eg" />
            </div>
          }
          forceMoreActions
          entityIdentifier={
            <CopyID
              value={props.orderId}
              tooltipLabel={<FormattedMessage defaultMessage="Copy transaction ID" id="zzd7ZI" />}
            >
              #{props.orderId}
            </CopyID>
          }
          entityLabel={
            <React.Fragment>
              {isLoading ? (
                <Skeleton className="h-6 w-56" />
              ) : (
                <div className="text-base font-semibold text-foreground">{query.data.order.description}</div>
              )}
            </React.Fragment>
          }
        />
        <div className="flex-grow overflow-auto px-8 py-4">
          {query.error ? (
            <MessageBoxGraphqlError error={query.error} />
          ) : (
            <React.Fragment>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Skeleton className="h-6 w-32" />
                ) : (
                  query.data?.order?.permissions?.canUpdateAccountingCategory &&
                  query.data.order.toAccount &&
                  'host' in query.data.order.toAccount && (
                    <OrderAdminAccountingCategoryPill
                      order={query.data?.order}
                      account={query.data?.order.toAccount}
                      host={query.data.order.toAccount.host}
                    />
                  )
                )}
                <div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <Tags canEdit={query.data?.order?.permissions?.canSetTags} order={query.data?.order} />
                  )}
                </div>
              </div>
              <div className="text-sm">
                <InfoList className="mb-6 sm:grid-cols-2">
                  <InfoListItem
                    className="border-b border-t-0"
                    title={<FormattedMessage defaultMessage="Contributor" id="Contributor" />}
                    value={
                      isLoading ? (
                        <Skeleton className="h-6 w-48" />
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
                      )
                    }
                  />

                  <InfoListItem
                    className="border-b border-t-0"
                    title={<FormattedMessage defaultMessage="Collective" id="Collective" />}
                    value={
                      isLoading ? (
                        <Skeleton className="h-6 w-48" />
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
                      )
                    }
                  />
                </InfoList>

                <DataList className="mb-4">
                  <DataListItem>
                    <DataListItemLabel>
                      <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
                    </DataListItemLabel>
                    <DataListItemValue>
                      {isLoading ? (
                        <Skeleton className="h-5 w-32" />
                      ) : (
                        <React.Fragment>
                          <FormattedMoneyAmount
                            showCurrencyCode={true}
                            currency={query.data.order.totalAmount.currency}
                            amount={query.data.order.totalAmount.valueInCents}
                          />
                        </React.Fragment>
                      )}
                    </DataListItemValue>
                  </DataListItem>
                  {query.data?.order?.platformTipAmount?.valueInCents > 0 && (
                    <DataListItem>
                      <DataListItemLabel>
                        <FormattedMessage defaultMessage="Platform Tip" id="Fields.platformTip" />
                      </DataListItemLabel>
                      <DataListItemValue>
                        <FormattedMoneyAmount
                          showCurrencyCode={true}
                          currency={query.data.order.platformTipAmount.currency}
                          amount={query.data.order.platformTipAmount.valueInCents}
                        />
                      </DataListItemValue>
                    </DataListItem>
                  )}
                  <DataListItem>
                    <DataListItemLabel>
                      <FormattedMessage id="Contribution.CreationDate" defaultMessage="Creation Date" />
                    </DataListItemLabel>
                    <DataListItemValue>
                      {isLoading ? (
                        <Skeleton className="h-5 w-32" />
                      ) : (
                        <DateTime value={query.data?.order?.createdAt} dateStyle="long" />
                      )}
                    </DataListItemValue>
                  </DataListItem>
                  {query.data?.order?.lastChargedAt &&
                    query.data?.order.frequency !== ContributionFrequency.ONETIME && (
                      <DataListItem>
                        <DataListItemLabel>
                          <FormattedMessage id="Contribution.LastChargeDate" defaultMessage="Last Charge Date" />
                        </DataListItemLabel>
                        <DataListItemValue>
                          <DateTime value={query.data?.order?.lastChargedAt} dateStyle="long" />
                        </DataListItemValue>
                      </DataListItem>
                    )}
                  {query.data?.order?.nextChargeDate &&
                    query.data?.order.frequency !== ContributionFrequency.ONETIME && (
                      <DataListItem>
                        <DataListItemLabel>
                          <FormattedMessage defaultMessage="Next Charge Date" id="oJNxUE" />
                        </DataListItemLabel>
                        <DataListItemValue>
                          {isLoading ? (
                            <Skeleton className="h-5 w-32" />
                          ) : (
                            <DateTime value={query.data?.order?.nextChargeDate} dateStyle="long" />
                          )}
                        </DataListItemValue>
                      </DataListItem>
                    )}
                  <DataListItem>
                    <DataListItemLabel>
                      <FormattedMessage defaultMessage="Payment Method" id="paymentmethod.label" />
                    </DataListItemLabel>
                    <DataListItemValue>
                      {isLoading ? (
                        <Skeleton className="h-5 w-44" />
                      ) : query.data.order.status === OrderStatus.PENDING ? (
                        i18nPaymentMethodProviderType(intl, query.data.order.pendingContributionData.paymentMethod)
                      ) : (
                        <PaymentMethodTypeWithIcon type={query.data.order.paymentMethod?.type} iconSize={16} />
                      )}
                    </DataListItemValue>
                  </DataListItem>
                  {query.data?.order?.status === OrderStatus.PENDING && (
                    <React.Fragment>
                      {query.data.order.pendingContributionData?.ponumber && (
                        <DataListItem>
                          <DataListItemLabel>
                            <FormattedMessage defaultMessage="PO Number" id="Fields.PONumber" />
                          </DataListItemLabel>
                          <DataListItemValue>{query.data.order.pendingContributionData.ponumber}</DataListItemValue>
                        </DataListItem>
                      )}

                      {query.data.order.pendingContributionData?.fromAccountInfo && (
                        <DataListItem>
                          <DataListItemLabel>
                            <FormattedMessage defaultMessage="Contact" id="Contact" />
                          </DataListItemLabel>
                          <DataListItemValue>
                            {' '}
                            {query.data.order.pendingContributionData?.fromAccountInfo?.email
                              ? `${query.data.order.pendingContributionData.fromAccountInfo.name} (${query.data.order.pendingContributionData.fromAccountInfo.email})`
                              : query.data.order.pendingContributionData.fromAccountInfo.name}
                          </DataListItemValue>
                        </DataListItem>
                      )}
                    </React.Fragment>
                  )}
                  <DataListItem>
                    <DataListItemLabel>
                      <FormattedMessage defaultMessage="Frequency" id="Frequency" />
                    </DataListItemLabel>
                    <DataListItemValue>
                      {isLoading ? (
                        <Skeleton className="h-5 w-44" />
                      ) : (
                        i18nFrequency(intl, query.data?.order?.frequency)
                      )}
                    </DataListItemValue>
                  </DataListItem>

                  {query.data?.order?.tier && (
                    <DataListItem>
                      <DataListItemLabel>
                        <FormattedMessage defaultMessage="Tier" id="b07w+D" />
                      </DataListItemLabel>
                      <DataListItemValue>{query.data.order.tier.name}</DataListItemValue>
                    </DataListItem>
                  )}

                  {query.data?.order?.memo ||
                    (query.data?.order?.pendingContributionData?.memo && (
                      <DataListItem>
                        <DataListItemLabel>
                          <FormattedMessage defaultMessage="Memo" id="D5NqQO" />
                        </DataListItemLabel>
                        <DataListItemValue>
                          {query.data.order.memo || query.data.order.pendingContributionData.memo}
                        </DataListItemValue>
                      </DataListItem>
                    ))}
                  {!isEmpty(query.data?.order?.customData) && (
                    <DataListItem>
                      <DataListItemLabel>
                        <FormattedMessage defaultMessage="Custom Data" id="DRPEis" />
                      </DataListItemLabel>
                      <DataListItemValue>{JSON.stringify(query.data.order.customData)}</DataListItemValue>
                    </DataListItem>
                  )}
                </DataList>

                <div>
                  <div className="flex items-center justify-between gap-2 py-4">
                    <div className="text-slate-80 w-fit text-base font-bold leading-6">
                      <FormattedMessage defaultMessage="Related Activity" id="LP8cIK" />
                    </div>
                    <hr className="flex-grow border-neutral-300" />
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col gap-6">
                      {Array.from({ length: 3 }).map((_, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <div className="flex gap-5" key={index}>
                          <Skeleton className="h-10 w-12 rounded-full" />
                          <Skeleton className="mt-2 h-10 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ContributionTimeline order={query.data.order} />
                  )}
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
