import React from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { themeGet } from '@styled-system/theme-get';
import { isEmpty, orderBy, toNumber } from 'lodash';
import { GetServerSideProps } from 'next';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { initClient } from '../lib/apollo-client';
import { getCollectivePageMetadata } from '../lib/collective.lib';
import dayjs from '../lib/dayjs';
import { formatErrorMessage } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { Account, AccountWithHost, OrderPageQuery, OrderPageQueryVariables } from '../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { i18nPaymentMethodProviderType } from '../lib/i18n/payment-method-provider-type';
import { getCollectivePageCanonicalURL } from '../lib/url-helpers';

import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import Container from '../components/Container';
import DateTime from '../components/DateTime';
import FormattedMoneyAmount from '../components/FormattedMoneyAmount';
import { Box, Flex, Grid } from '../components/Grid';
import CreatePendingOrderModal from '../components/host-dashboard/CreatePendingOrderModal';
import HTMLContent from '../components/HTMLContent';
import PrivateInfoIcon from '../components/icons/PrivateInfoIcon';
import LinkCollective from '../components/LinkCollective';
import MessageBox from '../components/MessageBox';
import OrderStatusTag from '../components/orders/OrderStatusTag';
import ProcessOrderButtons, { hasProcessButtons } from '../components/orders/ProcessOrderButtons';
import Page from '../components/Page';
import PaymentMethodTypeWithIcon from '../components/PaymentMethodTypeWithIcon';
import StyledButton from '../components/StyledButton';
import StyledCard from '../components/StyledCard';
import StyledHr from '../components/StyledHr';
import StyledLink from '../components/StyledLink';
import StyledTag from '../components/StyledTag';
import StyledTooltip from '../components/StyledTooltip';
import Tags from '../components/Tags';
import { H1, H4, H5, P, Span } from '../components/Text';
import { getDisplayedAmount } from '../components/transactions/TransactionItem';

const orderPageQuery = gql`
  query OrderPage($legacyId: Int!, $collectiveSlug: String!) {
    order(order: { legacyId: $legacyId }) {
      id
      legacyId
      status
      description
      tags
      totalAmount {
        valueInCents
        currency
      }
      amount {
        valueInCents
        currency
      }
      paymentMethod {
        id
        type
      }
      createdAt
      processedAt
      hostFeePercent
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
      memo
      fromAccount {
        id
        slug
        name
        imageUrl
      }
      toAccount {
        id
        slug
        name
        imageUrl
        ... on AccountWithHost {
          bankTransfersHostFeePercent: hostFeePercent(paymentMethodType: MANUAL)
        }
      }
      createdByAccount {
        id
        slug
        name
        imageUrl
      }
      permissions {
        id
        canMarkAsExpired
        canMarkAsPaid
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
        paymentProcessorFee {
          valueInCents
          currency
        }
        fromAccount {
          id
          slug
          name
          imageUrl
        }
        account {
          id
          slug
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
          twitterHandle
        }
      }
    }
  }

  ${collectiveNavbarFieldsFragment}
`;

export const getServerSideProps: GetServerSideProps = async context => {
  const { collectiveSlug, OrderId } = context.query as { collectiveSlug: string; OrderId: string };
  const client = initClient();
  const { data, error } = await client.query<OrderPageQuery, OrderPageQueryVariables>({
    query: orderPageQuery,
    variables: { legacyId: toNumber(OrderId), collectiveSlug },
    context: API_V2_CONTEXT,
    fetchPolicy: 'network-only',
  });
  return {
    props: { query: context.query, ...data, error: error || null }, // will be passed to the page component as props
  };
};

const messages = defineMessages({
  title: {
    id: 'OrderPage.title',
    defaultMessage: '{title} · Contribution #{id}',
  },
});

const ButtonsContainer = styled(Flex).attrs({ 'data-cy': 'order-actions' })`
  flex-wrap: wrap;
  transition: opacity 0.05s;
  justify-content: flex-end;

  @media (max-width: 40em) {
    justify-content: center;
  }

  & > *:last-child {
    margin-right: 0;
  }
`;

const OrderDetails = ({ children: [field, value] }: { children: [React.ReactNode, React.ReactNode] }) => (
  <Box>
    <P
      fontWeight="500"
      fontSize="11px"
      lineHeight="12px"
      textTransform="uppercase"
      color="black.700"
      letterSpacing="0.06em"
    >
      {field}
    </P>
    <P fontSize="12px" color="black.700" lineHeight="18px" mt={1}>
      {value}
    </P>
  </Box>
);

const TransactionDetailsWrapper = styled(Flex)`
  padding-bottom: 16px;
  :not(:last-child) {
    border-bottom: 1px dotted #e6e8eb;
    margin-bottom: 24px;
  }
`;

const TransactionDetails = ({
  children: [title, value, fees, description],
  ...props
}: {
  children: [React.ReactNode, React.ReactNode, React.ReactNode?, React.ReactNode?];
  [key: string]: any;
}) => (
  <TransactionDetailsWrapper {...props} alignItems="center" justifyContent="space-between">
    <Box>
      <Box fontWeight="400" fontSize="14px" lineHeight="20px" color="black.900">
        {title}
      </Box>
      <Box fontWeight="400" fontSize="12px" lineHeight="18px" color="black.700">
        {description}
      </Box>
    </Box>
    <Box textAlign="end">
      <P fontWeight="700" fontSize="16px" lineHeight="24px" color="black.900">
        {value}
      </P>
      {fees && (
        <P fontWeight="400" fontSize="12px" lineHeight="18px" color="black.700">
          {fees}
        </P>
      )}
    </Box>
  </TransactionDetailsWrapper>
);

const SummaryHeader = styled(H1)`
  > a {
    color: inherit;
    text-decoration: underline;

    :hover {
      color: ${themeGet('colors.black.600')};
    }
  }
`;

const OverdueTag = styled.span`
  padding: 2px 6px;
  background: ${themeGet('colors.yellow.300')};
  color: ${themeGet('colors.yellow.900')};
  border-radius: 4px;
`;

export default function OrderPage(props: OrderPageQuery & { error: any }) {
  const { LoggedInUser } = useLoggedInUser();
  const [fetchData, query] = useLazyQuery<OrderPageQuery, OrderPageQueryVariables>(orderPageQuery, {
    variables: { legacyId: toNumber(props.order.legacyId), collectiveSlug: props.account.slug },
    context: API_V2_CONTEXT,
  });
  const [showCreatePendingOrderModal, setShowCreatePendingOrderModal] = React.useState(false);

  const baseMetadata = getCollectivePageMetadata(props?.account);

  const data = query?.data || props;
  const account = data.account as Account & AccountWithHost;
  const order = data.order;
  const error = query?.error || props.error;

  const isPending = order?.status === 'PENDING';
  const isOverdue =
    isPending &&
    order.pendingContributionData?.expectedAt &&
    dayjs().isAfter(dayjs(order.pendingContributionData.expectedAt));
  const intl = useIntl();

  React.useEffect(() => {
    if (LoggedInUser) {
      fetchData();
    }
  }, [LoggedInUser]);

  const accountTransactions = order?.transactions?.filter(t => t.account.id === account.id);

  return (
    <Page
      collective={account}
      canonicalURL={`${getCollectivePageCanonicalURL(account)}/orders`}
      {...baseMetadata}
      title={intl.formatMessage(messages.title, { title: order.description, id: order.legacyId })}
    >
      <CollectiveNavbar collective={account} isLoading={!account} selectedCategory={NAVBAR_CATEGORIES.BUDGET} />
      <Flex justifyContent="center">
        <Flex
          maxWidth="1200px"
          py={[0, 5]}
          px={[2, 3, 4]}
          mt={2}
          mb={5}
          flexDirection={['column', null, null, 'row']}
          justifyContent={'space-between'}
        >
          <Box flex="1 0" flexBasis={['initial', null, null, '832px']} width="100%" mr={[null, 2, 3, 4]}>
            {error && (
              <MessageBox type="error" withIcon m={4}>
                {formatErrorMessage(intl, error)}
              </MessageBox>
            )}
            <SummaryHeader fontWeight="700" fontSize="24px" lineHeight="32px">
              <FormattedMessage
                id="PendingContributionSummary"
                defaultMessage="{status, select, PENDING {Pending Contribution} other {Contribution}} to {account}"
                values={{
                  status: order.status,
                  account: (
                    <LinkCollective collective={order.toAccount} textDecoration="underline">
                      {order.toAccount.name}
                    </LinkCollective>
                  ),
                }}
              />
            </SummaryHeader>
            <StyledCard mt="24px" p={[16, 24, 32]}>
              <Flex
                flexDirection={['column-reverse', 'row']}
                alignItems={['stretch', 'center']}
                justifyContent="space-between"
                data-cy="expense-title"
                mb={1}
              >
                <Box mr={[0, 2]}>
                  <H4 fontWeight="500" data-cy="expense-description">
                    {order.description}
                  </H4>
                </Box>
                <Box mb={[3, 0]} justifyContent={['space-between', 'flex-end']} alignItems="center">
                  <OrderStatusTag status={order.status} />
                </Box>
              </Flex>
              <Flex>
                <StyledTag
                  variant="rounded-left"
                  fontSize="10px"
                  fontWeight="500"
                  mr={1}
                  textTransform="uppercase"
                  closeButtonProps={undefined}
                >
                  <FormattedMessage id="Order" defaultMessage="Order" /> #{order.legacyId}
                </StyledTag>
                <Tags order={order} canEdit />
              </Flex>
              <Flex alignItems="center" mt={1}>
                <P mt="5px" fontSize="12px" color="black.600">
                  <FormattedMessage
                    defaultMessage="From {contributor} to {account}"
                    values={{
                      contributor: <LinkCollective collective={order.fromAccount} />,
                      account: <LinkCollective collective={order.toAccount} />,
                    }}
                  />
                  {' • '}
                  <DateTime value={order.processedAt || order.createdAt} dateStyle={undefined} timeStyle={undefined} />
                </P>
              </Flex>
              <Grid mt="24px" gridGap="20px 50px" gridTemplateColumns={['1fr', '1fr 1fr', `repeat(4, 1fr)`]}>
                {order.pendingContributionData?.ponumber && (
                  <OrderDetails>
                    <StyledTooltip
                      content={
                        <FormattedMessage defaultMessage="External reference code for this order. This is usually a reference number from the contributor accounting system." />
                      }
                      containerCursor="default"
                    >
                      <FormattedMessage id="Fields.PONumber" defaultMessage="PO Number" />
                    </StyledTooltip>
                    {`#${order.pendingContributionData.ponumber}`}
                  </OrderDetails>
                )}
                {order.pendingContributionData?.expectedAt && (
                  <OrderDetails>
                    <FormattedMessage defaultMessage="Expected" />
                    {isOverdue ? (
                      <OverdueTag>
                        <DateTime
                          value={order.pendingContributionData.expectedAt}
                          dateStyle={'medium'}
                          timeStyle={undefined}
                        />
                        <Span textTransform="uppercase" fontWeight="bold" letterSpacing="0.06em">
                          &nbsp;
                          <FormattedMessage defaultMessage="Overdue" />
                        </Span>
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
              </Grid>

              <Box mt={4}>
                <P fontWeight="700" fontSize="16px" lineHeight="24px" color="black.900">
                  {isPending ? (
                    <FormattedMessage defaultMessage="Contribution Details" />
                  ) : (
                    <FormattedMessage defaultMessage="Related Transactions" />
                  )}
                </P>
              </Box>

              <Box mt={4}>
                {isPending ? (
                  <React.Fragment>
                    <TransactionDetails>
                      <FormattedMessage defaultMessage="Expected Amount" />
                      <FormattedMoneyAmount
                        currency={order.amount.currency}
                        precision={2}
                        amount={order.amount.valueInCents}
                      />

                      <FormattedMessage defaultMessage="Payment Fees not Considered" />
                      <FormattedMessage
                        defaultMessage="Created on {date}"
                        values={{
                          date: <DateTime value={order.createdAt} dateStyle={'medium'} timeStyle="short" />,
                        }}
                      />
                    </TransactionDetails>
                    <TransactionDetails>
                      <FormattedMessage defaultMessage="Expected Host Fees" />
                      <FormattedMoneyAmount
                        currency={order.amount.currency}
                        precision={2}
                        amount={order.amount.valueInCents * (order.hostFeePercent / -100)}
                      />
                      <React.Fragment></React.Fragment>
                      <FormattedMessage defaultMessage="Based on default host fees, can be changed at settling time" />
                    </TransactionDetails>
                  </React.Fragment>
                ) : (
                  orderBy(accountTransactions, ['legacyId'], ['desc']).map(transaction => {
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
                        {displayPaymentFees && (
                          <Span>
                            <FormattedMessage
                              defaultMessage="{value} (Payment Processor Fee)"
                              values={{
                                value: (
                                  <FormattedMoneyAmount
                                    currency={transaction.paymentProcessorFee.currency}
                                    amount={transaction.paymentProcessorFee.valueInCents}
                                    amountStyles={{}}
                                  />
                                ),
                              }}
                            />
                          </Span>
                        )}
                        <span>
                          <FormattedMessage
                            defaultMessage="{type, select, CREDIT {Received by} DEBIT {Paid by} other {}} {account} on {date}"
                            values={{
                              type: transaction.type,
                              date: <DateTime value={transaction.createdAt} dateStyle={'short'} timeStyle="short" />,
                              account: <LinkCollective collective={transaction.account} />,
                            }}
                          />
                        </span>
                      </TransactionDetails>
                    );
                  })
                )}
              </Box>
              {hasProcessButtons(order?.permissions) && (
                <Box mt="40px">
                  <StyledHr />
                  <Flex
                    justifyContent={['stretch', 'space-between']}
                    flexDirection={['column-reverse', 'row']}
                    mt="8px"
                  >
                    <ButtonsContainer flexDirection={['column', 'row']}>
                      {order?.permissions?.canEdit && (
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
                          {showCreatePendingOrderModal && (
                            <CreatePendingOrderModal
                              host={account.host}
                              onClose={() => setShowCreatePendingOrderModal(false)}
                              onSuccess={() => query.refetch()}
                              edit={order}
                            />
                          )}{' '}
                        </React.Fragment>
                      )}
                    </ButtonsContainer>
                    <ButtonsContainer flexDirection={['column', 'row']}>
                      <ProcessOrderButtons
                        order={order}
                        permissions={order.permissions}
                        onSuccess={() => query.refetch()}
                      />
                    </ButtonsContainer>
                  </Flex>
                </Box>
              )}
            </StyledCard>

            {order?.memo && (
              <Box mt={4}>
                <P fontWeight="700" fontSize="16px" lineHeight="24px" color="black.900">
                  <FormattedMessage defaultMessage="Additional Details" />
                </P>

                <Span fontSize="12px" color="black.700" fontWeight="bold">
                  <FormattedMessage id="Expense.PrivateNote" defaultMessage="Private note" />
                  &nbsp;&nbsp;
                  <PrivateInfoIcon
                    color="#969BA3"
                    size={undefined}
                    tooltipProps={undefined}
                    withoutTooltip={undefined}
                    // eslint-disable-next-line react/no-children-prop
                    children={undefined}
                  />
                </Span>
                <HTMLContent color="black.700" mt={1} fontSize="13px" content={order.memo} />
              </Box>
            )}
          </Box>
          <Flex
            minWidth="270px"
            display={['none', 'block']}
            justifyContent={['center', null, 'flex-start', 'flex-end']}
            pt={[4, null, 80]}
          >
            {account.isActive && (
              <Box px={2}>
                <H5 mb={3} textTransform="capitalize">
                  <FormattedMessage
                    id="CollectiveBalance"
                    defaultMessage="{type, select, COLLECTIVE {Collective balance} EVENT {Event balance} ORGANIZATION {Organization balance} FUND {Fund balance} PROJECT {Project balance} other {Account balance}}"
                    values={{
                      type: account?.type || '', // collective can be null when it's loading
                    }}
                  />
                </H5>
                <Container
                  borderLeft="1px solid"
                  borderColor="black.300"
                  pl={3}
                  fontSize="20px"
                  color="black.500"
                  data-cy="collective-balance"
                >
                  <Box>
                    <FormattedMoneyAmount
                      currency={account.stats.balanceWithBlockedFunds.currency}
                      amount={account.stats.balanceWithBlockedFunds.valueInCents}
                      amountStyles={{ color: 'black.800' }}
                    />
                    {account.host && (
                      <P fontSize="11px" color="black.600" mt={2}>
                        <Span
                          fontSize="9px"
                          fontWeight="600"
                          textTransform="uppercase"
                          color="black.500"
                          letterSpacing="0.06em"
                        >
                          <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" />
                        </Span>
                        <br />
                        <LinkCollective collective={account.host}>
                          {account?.isActive ? (
                            account.host.name
                          ) : (
                            <FormattedMessage
                              id="Fiscalhost.pending"
                              defaultMessage="{host} (pending)"
                              values={{
                                host: account.host.name,
                              }}
                            />
                          )}
                        </LinkCollective>
                      </P>
                    )}
                  </Box>
                </Container>
              </Box>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Page>
  );
}
