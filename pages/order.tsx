import React from 'react';
import { isEmpty, orderBy, partition, round, toNumber } from 'lodash';
import type { GetServerSideProps } from 'next';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { getSSRQueryHelpers } from '../lib/apollo-client';
import { getCollectivePageMetadata } from '../lib/collective';
import dayjs from '../lib/dayjs';
import { gql } from '../lib/graphql/helpers';
import type { Account, AccountWithHost } from '../lib/graphql/types/v2/schema';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { usePrevious } from '../lib/hooks/usePrevious';
import { i18nPaymentMethodProviderType } from '../lib/i18n/payment-method-provider-type';
import { i18nTaxType } from '../lib/i18n/taxes';
import { getCollectivePageCanonicalURL } from '../lib/url-helpers';

import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import { accountNavbarFieldsFragment } from '../components/collective-navbar/fragments';
import { confirmContributionFieldsFragment } from '../components/contributions/ConfirmContributionForm';
import CreatePendingOrderModal from '../components/dashboard/sections/contributions/CreatePendingOrderModal';
import DateTime from '../components/DateTime';
import ErrorPage from '../components/ErrorPage';
import FormattedMoneyAmount from '../components/FormattedMoneyAmount';
import HTMLContent from '../components/HTMLContent';
import PrivateInfoIcon from '../components/icons/PrivateInfoIcon';
import LinkCollective from '../components/LinkCollective';
import Loading from '../components/Loading';
import MessageBoxGraphqlError from '../components/MessageBoxGraphqlError';
import OrderStatusTag from '../components/orders/OrderStatusTag';
import ProcessOrderButtons, { hasProcessButtons } from '../components/orders/ProcessOrderButtons';
import Page from '../components/Page';
import PaymentMethodTypeWithIcon from '../components/PaymentMethodTypeWithIcon';
import StyledButton from '../components/StyledButton';
import StyledLink from '../components/StyledLink';
import Tags from '../components/Tags';
import { getDisplayedAmount } from '../components/transactions/TransactionItem';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { Separator } from '@/components/ui/Separator';

import Custom404 from './404';

const orderPageQuery = gql`
  query OrderPage($legacyId: Int!, $collectiveSlug: String!) {
    order(order: { legacyId: $legacyId }) {
      id
      legacyId
      status
      description
      tags
      ...ConfirmContributionFields
      paymentMethod {
        id
        type
      }
      createdAt
      processedAt
      permissions {
        id
        canMarkAsExpired
        canMarkAsPaid
        canSetTags
        canEdit
      }
      transactions {
        id
        legacyId
        group
        description
        type
        kind
        createdAt
        order {
          id
        }
        amount {
          valueInCents
          currency
        }
        netAmount {
          valueInCents
          currency
        }
        taxAmount {
          valueInCents
          currency
        }
        taxInfo {
          id
          type
          rate
        }
        paymentProcessorFee {
          valueInCents
          currency
        }
        fromAccount {
          id
          slug
          type
          name
          imageUrl
          isIncognito
          ... on Individual {
            isGuest
          }
        }
        account {
          id
          slug
          type
          name
          imageUrl
        }
      }
    }
    account(slug: $collectiveSlug) {
      id
      legacyId
      slug
      name
      type
      isHost
      imageUrl
      backgroundImageUrl
      isActive
      description
      settings
      twitterHandle
      currency
      expensePolicy
      supportedExpenseTypes
      features {
        id
        ...NavbarFields
        MULTI_CURRENCY_EXPENSES
      }
      location {
        id
        address
        country
      }

      stats {
        id
        balanceWithBlockedFunds {
          valueInCents
          currency
        }
      }

      ... on AccountWithParent {
        parent {
          id
          slug
          name
          imageUrl
          backgroundImageUrl
          twitterHandle
        }
      }
      ... on AccountWithHost {
        host {
          id
          name
          slug
          imageUrl
          backgroundImageUrl
        }
      }
      ... on Organization {
        host {
          id
          name
          slug
          imageUrl
          backgroundImageUrl
        }
      }
    }
  }

  ${accountNavbarFieldsFragment}
  ${confirmContributionFieldsFragment}
`;

const contributionPageQueryHelper = getSSRQueryHelpers<{ legacyId: number; collectiveSlug: string }>({
  query: orderPageQuery,

  fetchPolicy: 'network-only',
  getVariablesFromContext: ({ query }) => ({
    legacyId: toNumber(query.OrderId),
    collectiveSlug: query.collectiveSlug as string,
  }),
});

// next.js export
// ts-unused-exports:disable-next-line
export const getServerSideProps: GetServerSideProps = contributionPageQueryHelper.getServerSideProps;

const messages = defineMessages({
  title: {
    id: 'OrderPage.title',
    defaultMessage: '{title} · Contribution #{id}',
  },
});

const ButtonsContainer = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
  <div
    className="flex flex-wrap justify-end transition-opacity duration-75 max-sm:justify-center [&>*:last-child]:mr-0"
    data-cy="order-actions"
    {...props}
  >
    {children}
  </div>
);

const OrderDetails = ({ children: [field, value] }: { children: [React.ReactNode, React.ReactNode] }) => (
  <div>
    <p className="text-xs leading-3 font-medium tracking-[0.06em] text-gray-600 uppercase">{field}</p>
    <div className="mt-1 text-xs leading-[18px] text-gray-600">{value}</div>
  </div>
);

const TransactionDetails = ({
  children: [title, value, fees, description],
  ...props
}: {
  children: [React.ReactNode, React.ReactNode, React.ReactNode?, React.ReactNode?];
  [key: string]: any;
}) => (
  <div
    data-cy="transaction-details-wrapper"
    {...props}
    className="mb-4 flex items-center justify-between border-gray-100 pb-4 not-last:border-b"
  >
    <div>
      <div className="text-sm leading-5 font-normal text-gray-900">{title}</div>
      <div className="text-xs leading-[18px] font-normal text-gray-600">{description}</div>
    </div>
    <div className="text-right">
      <div className="text-sm leading-6 font-bold text-gray-900">{value}</div>
      {fees && <div className="text-xs leading-[18px] font-normal text-gray-600">{fees}</div>}
    </div>
  </div>
);

const OverdueTag = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
  <span className="rounded bg-yellow-300 px-1.5 py-0.5 text-yellow-900" {...props}>
    {children}
  </span>
);

const getTransactionsToDisplay = (account, transactions) => {
  if (!transactions?.length) {
    return [];
  }

  const isTipTransaction = t => ['PLATFORM_TIP', 'PLATFORM_TIP_DEBT'].includes(t.kind);
  const isOwnAccount = t => t.account.id === account.id;

  const [tipTransactions, otherTransactions] = partition(transactions, isTipTransaction);
  const accountTransactions = otherTransactions.filter(t => t.account.id === account.id);
  let tipTransactionsToDisplay = tipTransactions.filter(isOwnAccount);
  if (tipTransactionsToDisplay.length === 0 && tipTransactions.length > 0) {
    tipTransactionsToDisplay = tipTransactions.filter(t => t.kind === 'PLATFORM_TIP' && t.type === 'DEBIT');
  }

  return [...accountTransactions, ...tipTransactionsToDisplay];
};

// next.js export
// ts-unused-exports:disable-next-line
export default function OrderPage(props) {
  const { LoggedInUser } = useLoggedInUser();
  const prevLoggedInUser = usePrevious(LoggedInUser);
  const [showCreatePendingOrderModal, setShowCreatePendingOrderModal] = React.useState(false);
  const queryResult = contributionPageQueryHelper.useQuery(props);
  const variables = contributionPageQueryHelper.getVariablesFromPageProps(props);
  const baseMetadata = getCollectivePageMetadata(queryResult.data?.account);

  const data = queryResult.data;
  const account = data?.account as Account & AccountWithHost;
  const order = data?.order;
  const error = queryResult.error;

  const isPending = order?.status === 'PENDING';
  const isOverdue =
    isPending &&
    order?.pendingContributionData?.expectedAt &&
    dayjs().isAfter(dayjs(order?.pendingContributionData.expectedAt));
  const intl = useIntl();

  // Refetch when users logs in
  React.useEffect(() => {
    if (!prevLoggedInUser && LoggedInUser) {
      queryResult.refetch();
    }
  }, [LoggedInUser, prevLoggedInUser]);

  if (!order && error) {
    return <ErrorPage loading={queryResult.loading} data={queryResult.data} error={error} />;
  } else if (!queryResult.loading && (!order || order.toAccount?.slug !== variables.collectiveSlug)) {
    return <Custom404 />;
  }

  const displayedTransactions = getTransactionsToDisplay(account, order?.transactions);
  return (
    <Page
      collective={account}
      canonicalURL={`${getCollectivePageCanonicalURL(account)}/contributions/${queryResult.variables.legacyId}`}
      {...baseMetadata}
      title={intl.formatMessage(messages.title, {
        title: order?.description || 'Contribution',
        id: queryResult.variables.legacyId,
      })}
    >
      <CollectiveNavbar collective={account} isLoading={!account} selectedCategory={NAVBAR_CATEGORIES.BUDGET} />
      <div className="flex justify-center py-12" data-cy="contribution-page-content">
        {!order ? (
          <div className="p-20">
            <Loading />
          </div>
        ) : (
          <div className="mt-2 mb-5 flex max-w-[1200px] flex-col justify-between px-2 py-0 sm:px-3 sm:py-5 lg:px-4 xl:flex-row">
            <div className="mr-0 w-full flex-1 flex-shrink-0 basis-auto sm:mr-2 lg:mr-3 xl:mr-4 xl:max-w-[70%] xl:min-w-[832px]">
              {error && <MessageBoxGraphqlError error={error} my={4} />}
              <h1 className="text-2xl font-bold">
                <FormattedMessage
                  id="PendingContributionSummary"
                  defaultMessage="{status, select, PENDING {Pending Contribution} other {Contribution}} to {account}"
                  values={{
                    status: order.status,
                    account: (
                      <LinkCollective collective={order.toAccount} className="underline">
                        {order.toAccount.name}
                      </LinkCollective>
                    ),
                  }}
                />
              </h1>
              <Card className="mt-10 px-6 py-12">
                <CardHeader>
                  <CardTitle>
                    <div
                      className="flex flex-col-reverse items-stretch justify-between sm:flex-row sm:items-center"
                      data-cy="contribution-title"
                    >
                      <div className="mr-0 sm:mr-2">
                        <h4 className="text-xl font-medium" data-cy="contribution-description">
                          {order.description}
                        </h4>
                      </div>
                      <div className="mb-3 flex items-center justify-between sm:mb-0 sm:justify-end">
                        <OrderStatusTag status={order.status} />
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex">
                    <Badge className="mr-2" type="neutral" size="sm">
                      <FormattedMessage defaultMessage="Contribution" id="0LK5eg" /> #{order.legacyId}
                    </Badge>
                    <Tags order={order} canEdit={order.permissions.canSetTags} />
                  </div>
                  <div className="mt-1 flex items-center">
                    <p className="mt-1 text-xs text-gray-600">
                      <FormattedMessage
                        defaultMessage="From {contributor} to {account}"
                        id="nqRBcp"
                        values={{
                          contributor: <LinkCollective collective={order.fromAccount} />,
                          account: <LinkCollective collective={order.toAccount} />,
                        }}
                      />
                      {' • '}
                      <DateTime
                        value={order.processedAt || order.createdAt}
                        dateStyle={undefined}
                        timeStyle={undefined}
                      />
                    </p>
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                    {order.pendingContributionData?.ponumber && (
                      <OrderDetails>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default">
                                <FormattedMessage id="Fields.PONumber" defaultMessage="PO Number" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <FormattedMessage
                                defaultMessage="External reference code for this contribution. This is usually a reference number from the contributor accounting system."
                                id="LqD2Po"
                              />
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {`#${order.pendingContributionData.ponumber}`}
                      </OrderDetails>
                    )}
                    {order.pendingContributionData?.expectedAt && (
                      <OrderDetails>
                        <FormattedMessage defaultMessage="Expected" id="6srLb2" />
                        {isOverdue ? (
                          <OverdueTag>
                            <DateTime
                              value={order.pendingContributionData.expectedAt}
                              dateStyle={'medium'}
                              timeStyle={undefined}
                            />
                            <span className="font-bold tracking-[0.06em] uppercase">
                              &nbsp;
                              <FormattedMessage defaultMessage="Overdue" id="M0vCGv" />
                            </span>
                          </OverdueTag>
                        ) : (
                          <DateTime
                            value={order.pendingContributionData.expectedAt}
                            dateStyle={'medium'}
                            timeStyle={undefined}
                          />
                        )}
                      </OrderDetails>
                    )}
                    {order.paymentMethod ? (
                      <OrderDetails>
                        <FormattedMessage id="PaidWith" defaultMessage="Paid With" />
                        <PaymentMethodTypeWithIcon type={order.paymentMethod?.type} iconSize={16} />
                      </OrderDetails>
                    ) : (
                      <OrderDetails>
                        <FormattedMessage id="paymentmethod.label" defaultMessage="Payment Method" />
                        {i18nPaymentMethodProviderType(
                          intl,
                          order.pendingContributionData?.paymentMethod || 'BANK_TRANSFER',
                        )}
                      </OrderDetails>
                    )}

                    {!isEmpty(order.pendingContributionData?.fromAccountInfo) && (
                      <OrderDetails>
                        <FormattedMessage id="Contact" defaultMessage="Contact" />
                        <span>
                          {order.pendingContributionData.fromAccountInfo.name}

                          {order.pendingContributionData.fromAccountInfo.email && (
                            <React.Fragment>
                              &nbsp;(
                              <StyledLink
                                href={`mailto:${order.pendingContributionData.fromAccountInfo.email}`}
                                openInNewTab
                              >
                                {order.pendingContributionData.fromAccountInfo.email}
                              </StyledLink>
                              )
                            </React.Fragment>
                          )}
                        </span>
                      </OrderDetails>
                    )}
                  </div>

                  <div className="mt-12">
                    <p className="text-base leading-6 font-bold text-gray-900">
                      {isPending ? (
                        <FormattedMessage defaultMessage="Contribution Details" id="tijsiA" />
                      ) : (
                        <FormattedMessage defaultMessage="Related Transactions" id="Sz+Qhv" />
                      )}
                    </p>
                  </div>

                  <div className="mt-4">
                    {isPending ? (
                      <React.Fragment>
                        <TransactionDetails>
                          <FormattedMessage defaultMessage="Expected Total Amount" id="PEp9t9" />
                          <FormattedMoneyAmount
                            currency={order.totalAmount.currency}
                            precision={2}
                            amount={order.totalAmount.valueInCents}
                          />

                          <FormattedMessage defaultMessage="Payment Fees not Considered" id="ysc4k/" />
                          <FormattedMessage
                            id="contribution.createdAt"
                            defaultMessage="Created on {date}"
                            values={{
                              date: <DateTime value={order.createdAt} dateStyle={'medium'} timeStyle="short" />,
                            }}
                          />
                        </TransactionDetails>
                        {Boolean(order.taxAmount?.valueInCents) && (
                          <TransactionDetails>
                            <FormattedMessage
                              defaultMessage="Expected {taxType} ({rate}%)"
                              id="U5Xeen"
                              values={{
                                taxType: i18nTaxType(intl, order.tax?.type || 'Tax', 'long'),
                                rate: order.tax?.rate * 100,
                              }}
                            />
                            <FormattedMoneyAmount
                              currency={order.amount.currency}
                              precision={2}
                              amount={-order.taxAmount.valueInCents}
                            />
                          </TransactionDetails>
                        )}
                        {Boolean(order.hostFeePercent) && (
                          <TransactionDetails>
                            <FormattedMessage defaultMessage="Expected Host Fees" id="+UwJxq" />
                            <FormattedMoneyAmount
                              currency={order.amount.currency}
                              precision={2}
                              amount={
                                (order.amount.valueInCents - (order.taxAmount?.valueInCents || 0)) *
                                (order.hostFeePercent / -100)
                              }
                            />
                            <FormattedMessage
                              defaultMessage="Based on default host fees, can be changed at settling time"
                              id="b8rZxx"
                            />
                          </TransactionDetails>
                        )}
                        {Boolean(order.platformTipAmount?.valueInCents) && (
                          <TransactionDetails>
                            <FormattedMessage defaultMessage="Expected Platform Tip" id="20RyRD" />
                            <FormattedMoneyAmount
                              currency={order.platformTipAmount.currency}
                              amount={-order.platformTipAmount.valueInCents}
                            />
                          </TransactionDetails>
                        )}
                      </React.Fragment>
                    ) : (
                      orderBy(displayedTransactions, ['legacyId'], ['desc']).map(transaction => {
                        const displayedAmount = getDisplayedAmount(transaction, account);
                        const displayPaymentFees =
                          transaction.type === 'CREDIT' &&
                          transaction.netAmount?.valueInCents !== displayedAmount.valueInCents &&
                          transaction.paymentProcessorFee?.valueInCents !== 0;

                        return (
                          <TransactionDetails key={transaction.id}>
                            <span>{transaction.description}</span>
                            <FormattedMoneyAmount
                              currency={displayedAmount.currency}
                              precision={2}
                              amount={displayedAmount.valueInCents}
                            />
                            <div>
                              {Boolean(transaction.taxAmount?.valueInCents) && (
                                <span className="block">
                                  <FormattedMoneyAmount
                                    currency={transaction.taxAmount.currency}
                                    precision={2}
                                    amount={transaction.taxAmount.valueInCents}
                                  />{' '}
                                  ({round(transaction.taxInfo.rate * 100, 2)}%{' '}
                                  {i18nTaxType(intl, transaction.taxInfo.type, 'long')})
                                </span>
                              )}
                              {displayPaymentFees && (
                                <span className="block">
                                  <FormattedMessage
                                    defaultMessage="{value} (Payment Processor Fee)"
                                    id="ijvoto"
                                    values={{
                                      value: (
                                        <FormattedMoneyAmount
                                          currency={transaction.paymentProcessorFee.currency}
                                          amount={transaction.paymentProcessorFee.valueInCents}
                                        />
                                      ),
                                    }}
                                  />
                                </span>
                              )}
                            </div>
                            <span>
                              <FormattedMessage
                                defaultMessage="{type, select, CREDIT {Received by} DEBIT {Paid by} other {}} {account} on {date}"
                                id="XhoJIl"
                                values={{
                                  type: transaction.type,
                                  date: (
                                    <DateTime value={transaction.createdAt} dateStyle={'short'} timeStyle="short" />
                                  ),
                                  account: <LinkCollective collective={transaction.account} />,
                                }}
                              />
                            </span>
                          </TransactionDetails>
                        );
                      })
                    )}
                  </div>
                  {hasProcessButtons(order?.permissions) && (
                    <div className="mt-10">
                      <Separator />
                      <div className="mt-2 flex flex-col-reverse justify-stretch sm:flex-row sm:justify-between">
                        <ButtonsContainer flexDirection={['column', 'row']}>
                          {order.permissions.canEdit && (
                            <React.Fragment>
                              <StyledButton
                                data-cy="edit-order-button"
                                buttonSize="tiny"
                                minWidth="130px"
                                mx={2}
                                mt={2}
                                py="9px"
                                height="34px"
                                onClick={() => setShowCreatePendingOrderModal(true)}
                              >
                                <FormattedMessage id="contribution.edit" defaultMessage="Edit Contribution" />
                              </StyledButton>
                              <CreatePendingOrderModal
                                hostSlug={account.host.slug}
                                open={showCreatePendingOrderModal}
                                setOpen={setShowCreatePendingOrderModal}
                                onSuccess={() => queryResult.refetch()}
                                edit={order}
                              />{' '}
                            </React.Fragment>
                          )}
                        </ButtonsContainer>
                        <ButtonsContainer flexDirection={['column', 'row']}>
                          <ProcessOrderButtons
                            order={order}
                            permissions={order.permissions}
                            onSuccess={() => queryResult.refetch()}
                          />
                        </ButtonsContainer>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {order?.memo && (
                <div className="mt-4">
                  <p className="text-base leading-6 font-bold text-gray-900">
                    <FormattedMessage defaultMessage="Additional Details" id="DgTPfL" />
                  </p>

                  <span className="text-xs font-bold text-gray-600">
                    <FormattedMessage id="Expense.PrivateNote" defaultMessage="Private note" />
                    &nbsp;&nbsp;
                    <PrivateInfoIcon className="text-muted-foreground" size={12} />
                  </span>
                  <HTMLContent color="black.700" mt={1} fontSize="13px" content={order.memo} />
                </div>
              )}
            </div>
            <div className="hidden min-w-[270px] justify-center pt-4 sm:flex lg:justify-start lg:pt-20 xl:justify-end">
              {account.isActive && (
                <div className="px-2">
                  <h5 className="mb-3 capitalize">
                    <FormattedMessage
                      id="CollectiveBalance"
                      defaultMessage="{type, select, COLLECTIVE {Collective balance} EVENT {Event balance} ORGANIZATION {Organization balance} FUND {Fund balance} PROJECT {Project balance} other {Account balance}}"
                      values={{ type: account.type || '' }}
                    />
                  </h5>
                  <div className="border-l border-gray-300 pl-3 text-xl text-gray-500" data-cy="collective-balance">
                    <div>
                      <FormattedMoneyAmount
                        currency={account.stats.balanceWithBlockedFunds.currency}
                        amount={account.stats.balanceWithBlockedFunds.valueInCents}
                        amountClassName="text-foreground"
                      />
                      {account.host && (
                        <p className="mt-2 text-xs text-gray-600">
                          <span className="text-[9px] font-semibold tracking-[0.06em] text-gray-500 uppercase">
                            <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" />
                          </span>
                          <br />
                          <LinkCollective collective={account.host} />
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
