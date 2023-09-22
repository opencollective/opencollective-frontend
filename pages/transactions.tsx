import React, { useEffect } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { omit } from 'lodash';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import styled from 'styled-components';

import { initClient } from '../lib/apollo-client';
import { loggedInUserCanAccessFinancialData } from '../lib/collective.lib';
import { CollectiveType } from '../lib/constants/collectives';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../lib/url-helpers';

import Body from '../components/Body';
import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import { Sections } from '../components/collective-page/_constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import ErrorPage from '../components/ErrorPage';
import { Box } from '../components/Grid';
import Header from '../components/Header';
import Loading from '../components/Loading';
import Footer from '../components/navigation/Footer';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import { transactionsQueryCollectionFragment } from '../components/transactions/graphql/fragments';
import Transactions, { getVariablesFromQuery } from '../components/transactions/TransactionsPage';

const processingOrderFragment = gql`
  fragment ProcessingOrderFields on Order {
    id
    legacyId
    nextChargeDate
    paymentMethod {
      id
      service
      name
      type
      expiryDate
      data
      balance {
        value
        valueInCents
        currency
      }
    }
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
    status
    description
    createdAt
    frequency
    tier {
      id
      name
    }
    totalDonations {
      value
      valueInCents
      currency
    }
    fromAccount {
      id
      name
      slug
      isIncognito
      type
    }
    toAccount {
      id
      slug
      name
      type
      description
      tags
      imageUrl
      settings
      ... on AccountWithHost {
        host {
          id
          slug
          paypalClientId
          supportedPaymentMethods
        }
      }
      ... on Organization {
        host {
          id
          slug
          paypalClientId
          supportedPaymentMethods
        }
      }
    }
    platformTipAmount {
      value
      valueInCents
    }
  }
`;

export const transactionsPageQuery = gql`
  query TransactionsPage(
    $slug: String!
    $limit: Int!
    $offset: Int!
    $type: TransactionType
    $paymentMethodType: [PaymentMethodType]
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $kind: [TransactionKind]
    $includeIncognitoTransactions: Boolean
    $includeGiftCardTransactions: Boolean
    $includeChildrenTransactions: Boolean
    $virtualCard: [VirtualCardReferenceInput]
  ) {
    account(slug: $slug) {
      id
      legacyId
      slug
      name
      type
      createdAt
      imageUrl(height: 256)
      currency
      settings
      features {
        id
        ...NavbarFields
      }
      ... on AccountWithParent {
        parent {
          id
          slug
        }
      }
      ... on AccountWithHost {
        host {
          id
          slug
        }
      }
      processingOrders: orders(filter: OUTGOING, includeIncognito: true, status: [PENDING, PROCESSING]) {
        totalCount
        nodes {
          id
          ...ProcessingOrderFields
        }
      }
    }
    transactions(
      account: { slug: $slug }
      limit: $limit
      offset: $offset
      type: $type
      paymentMethodType: $paymentMethodType
      minAmount: $minAmount
      maxAmount: $maxAmount
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      kind: $kind
      includeIncognitoTransactions: $includeIncognitoTransactions
      includeGiftCardTransactions: $includeGiftCardTransactions
      includeChildrenTransactions: $includeChildrenTransactions
      includeDebts: true
      virtualCard: $virtualCard
    ) {
      ...TransactionsQueryCollectionFragment
    }
  }
  ${transactionsQueryCollectionFragment}
  ${collectiveNavbarFieldsFragment}
  ${processingOrderFragment}
`;

const TransactionPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  #footer {
    margin-top: auto;
  }
`;

type TransactionsPageProps = {
  query: {
    collectiveSlug: string;
    searchTerm?: string;
    offset?: string;
    ignoreIncognitoTransactions?: string;
    ignoreGiftCardsTransactions?: string;
    ignoreChildrenTransactions?: string;
    displayPendingContributions?: string;
  };
  data: {
    account: any;
    transactions: any;
  };
  error: any;
};

export const getServerSideProps: GetServerSideProps<TransactionsPageProps> = async ctx => {
  const query = ctx.query as TransactionsPageProps['query'];
  const slug = query.collectiveSlug;
  const client = initClient();
  const { data, error } = await client.query({
    query: transactionsPageQuery,
    variables: { slug, ...getVariablesFromQuery(query) },
    context: API_V2_CONTEXT,
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore',
  });

  return {
    props: { query, data, error: error || null }, // will be passed to the page component as props
  };
};

export default function TransactionsPage(props: TransactionsPageProps) {
  const { LoggedInUser } = useLoggedInUser();
  const [fetchData, query] = useLazyQuery(transactionsPageQuery, {
    variables: { slug: props.query.collectiveSlug, ...getVariablesFromQuery(props.query) },
    context: API_V2_CONTEXT,
  });
  const router = useRouter();
  useEffect(() => {
    if (LoggedInUser) {
      fetchData();
    }
  }, [LoggedInUser]);
  useEffect(() => {
    const queryParameters = omit(props.query, ['offset', 'collectiveSlug', 'parentCollectiveSlug']);
    addParentToURLIfMissing(router, account, `/transactions`, queryParameters);
  });

  const error = query?.error || props.error;
  const data = query?.data || props.data;
  const account = query?.data?.account || props.data?.account;
  const transactions = query.called ? query?.data?.transactions : props.data?.transactions;
  const { variables, refetch, loading } = query || {};

  if (!account && loading) {
    return (
      <Page title="Transactions">
        <Loading />
      </Page>
    );
  } else if (!account) {
    return <ErrorPage data={data} />;
  } else if (!loggedInUserCanAccessFinancialData(LoggedInUser, data.account)) {
    // Hack for funds that want to keep their budget "private"
    return <PageFeatureNotSupported showContactSupportLink={false} />;
  }

  return (
    <TransactionPageWrapper>
      <Header
        collective={account}
        LoggedInUser={LoggedInUser}
        canonicalURL={`${getCollectivePageCanonicalURL(account)}/transactions`}
        noRobots={['USER', 'INDIVIDUAL'].includes(account.type) && !account.isHost}
      />
      <Body>
        <CollectiveNavbar
          collective={account}
          isAdmin={LoggedInUser && LoggedInUser.isAdminOfCollective(account)}
          selectedCategory={NAVBAR_CATEGORIES.BUDGET}
          selectedSection={account.type === CollectiveType.COLLECTIVE ? Sections.BUDGET : Sections.TRANSACTIONS}
        />
        <Box maxWidth={1260} m="0 auto" px={[2, 3, 4]} my={[4, 5]} data-cy="transactions-page-content">
          <Transactions
            transactions={transactions}
            account={account}
            LoggedInUser={LoggedInUser}
            variables={variables}
            error={error}
            loading={loading}
            refetch={refetch}
            router={router}
          />
        </Box>
      </Body>
      <Footer />
    </TransactionPageWrapper>
  );
}
