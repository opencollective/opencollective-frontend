import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { omit } from 'lodash';
import { withRouter } from 'next/router';
import styled from 'styled-components';

import { loggedInUserCanAccessFinancialData } from '../lib/collective.lib';
import { CollectiveType } from '../lib/constants/collectives';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../lib/url-helpers';

import Body from '../components/Body';
import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import { Sections } from '../components/collective-page/_constants';
import {
  collectiveNavbarFieldsFragment,
  processingOrderFragment,
} from '../components/collective-page/graphql/fragments';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import { Box } from '../components/Grid';
import Header from '../components/Header';
import Loading from '../components/Loading';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import { transactionsQueryCollectionFragment } from '../components/transactions/graphql/fragments';
import Transactions, { getVariablesFromQuery } from '../components/transactions/TransactionsPage';
import { withUser } from '../components/UserProvider';

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
class TransactionsPage extends React.Component {
  static async getInitialProps({ query: { collectiveSlug, ...query } }) {
    return { slug: collectiveSlug, query };
  }

  static propTypes = {
    slug: PropTypes.string, // from getInitialProps, for addCollectiveNavbarData
    data: PropTypes.shape({
      account: PropTypes.object,
      transactions: PropTypes.shape({
        nodes: PropTypes.array,
      }),
      variables: PropTypes.object,
      loading: PropTypes.bool,
      refetch: PropTypes.func,
      error: PropTypes.any,
    }).isRequired, // from withData
    LoggedInUser: PropTypes.object,
    query: PropTypes.shape({
      searchTerm: PropTypes.string,
      offset: PropTypes.string,
      ignoreIncognitoTransactions: PropTypes.string,
      ignoreGiftCardsTransactions: PropTypes.string,
      ignoreChildrenTransactions: PropTypes.string,
      displayPendingContributions: PropTypes.string,
    }),
    router: PropTypes.object,
  };

  async componentDidMount() {
    const { router, data } = this.props;
    const collective = data && data.account;
    const queryParameters = omit(this.props.query, ['offset', 'collectiveSlug', 'parentCollectiveSlug']);
    addParentToURLIfMissing(router, collective, `/transactions`, queryParameters);
  }

  render() {
    const { LoggedInUser, router, data } = this.props;
    const { account, transactions, refetch, variables, error, loading } = data || {};

    if (!account && data.loading) {
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
}

const addTransactionsData = graphql(transactionsPageQuery, {
  options: props => {
    return {
      variables: { slug: props.slug, ...getVariablesFromQuery(props.query) },
      context: API_V2_CONTEXT,
    };
  },
});

export default withUser(addTransactionsData(withRouter(TransactionsPage)));
