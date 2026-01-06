import React from 'react';
import type { InferGetServerSidePropsType } from 'next';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';
import type { z } from 'zod';

import { APOLLO_ERROR_PROP_NAME, APOLLO_QUERY_DATA_PROP_NAME, getSSRQueryHelpers } from '../lib/apollo-client';
import { isIndividualAccount, loggedInUserCanAccessFinancialData } from '../lib/collective';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { getCollectivePageCanonicalURL } from '../lib/url-helpers';
import type { TransactionsPageQuery } from '@/lib/graphql/types/v2/graphql';
import { getSSRVariablesFromQuery } from '@/lib/hooks/useQueryFilter';

import Body from '../components/Body';
import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import ErrorPage from '../components/ErrorPage';
import Header from '../components/Header';
import Footer from '../components/navigation/Footer';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import Transactions, {
  defaultFilterValues,
  schema,
  toVariables,
  transactionsPageQuery,
} from '../components/transactions/TransactionsPageContent';

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
    collectiveSlug?: string;
  } & z.infer<typeof schema>;
};

const transactionsPageQueryHelper = getSSRQueryHelpers<
  z.infer<typeof schema>,
  TransactionsPageProps,
  TransactionsPageQuery
>({
  query: transactionsPageQuery,
  getPropsFromContext: ctx => ({ query: ctx.query as TransactionsPageProps['query'] }),
  getVariablesFromContext: ctx => ({
    ...getSSRVariablesFromQuery({ query: ctx.query, schema, toVariables, defaultFilterValues }),
    slug: ctx.query.collectiveSlug,
  }),

  skipClientIfSSRThrows404: true,
});

// next.js export
// ts-unused-exports:disable-next-line
export const getServerSideProps = transactionsPageQueryHelper.getServerSideProps;

// next.js export
// ts-unused-exports:disable-next-line
export default function TransactionsPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { LoggedInUser } = useLoggedInUser();
  const data = props[APOLLO_QUERY_DATA_PROP_NAME];
  const error = props[APOLLO_ERROR_PROP_NAME];
  const account = data?.account;
  const transactions = data?.transactions;

  if (!account) {
    return <ErrorPage data={data} error={error || transactionsPageQueryHelper.getSSRErrorFromPageProps(props)} />;
  } else if (!loggedInUserCanAccessFinancialData(LoggedInUser, account)) {
    // Hack for funds that want to keep their budget "private"
    return <PageFeatureNotSupported showContactSupportLink={false} />;
  }

  return (
    <TransactionPageWrapper>
      <Header
        collective={account}
        LoggedInUser={LoggedInUser}
        canonicalURL={`${getCollectivePageCanonicalURL(account)}/transactions`}
        noRobots={(isIndividualAccount(account) && !account['isHost']) || !account.isActive}
      />
      <Body>
        <CollectiveNavbar
          collective={account}
          isAdmin={LoggedInUser && LoggedInUser.isAdminOfCollective(account)}
          selectedCategory={NAVBAR_CATEGORIES.BUDGET}
        />
        <div className="mx-auto my-16 max-w-[1260px] px-2 md:px-3 lg:px-4" data-cy="transactions-page-content">
          <h1 className="mb-6 text-[32px] leading-10">
            <FormattedMessage id="menu.transactions" defaultMessage="Transactions" />
          </h1>
          <Transactions transactions={transactions} account={account} LoggedInUser={LoggedInUser} />
        </div>
      </Body>
      <Footer />
    </TransactionPageWrapper>
  );
}
