import React, { useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash';
import type { InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

import { getSSRQueryHelpers } from '../lib/apollo-client';
import { getCollectivePageMetadata } from '../lib/collective';
import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../lib/url-helpers';

import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import ErrorPage from '../components/ErrorPage';
import Expense from '../components/expenses/Expense';
import ExpenseInfoSidebar from '../components/expenses/ExpenseInfoSidebar';
import { expensePageQuery } from '../components/expenses/graphql/queries';
import MobileCollectiveInfoStickyBar from '../components/expenses/MobileCollectiveInfoStickyBar';
import { Box, Flex } from '../components/Grid';
import Page from '../components/Page';

export const getVariablesFromQuery = query => {
  const firstOfCurrentYear = dayjs(new Date(new Date().getFullYear(), 0, 1))
    .utc(true)
    .toISOString();
  return {
    legacyExpenseId: parseInt(query.ExpenseId),
    draftKey: query.key || null,
    totalPaidExpensesDateFrom: firstOfCurrentYear,
  };
};

const getPropsFromQuery = query => {
  return {
    legacyExpenseId: parseInt(query.ExpenseId),
    draftKey: query.key,
    collectiveSlug: query.collectiveSlug,
    edit: query.edit,
  };
};

const messages = defineMessages({
  title: {
    id: 'ExpensePage.title',
    defaultMessage: '{title} · Expense #{id}',
  },
});

const SIDE_MARGIN_WIDTH = 'calc((100% - 1200px) / 2)';

const expensePageQueryHelper = getSSRQueryHelpers<
  ReturnType<typeof getVariablesFromQuery>,
  ReturnType<typeof getPropsFromQuery>
>({
  query: expensePageQuery,
  context: API_V2_CONTEXT,
  getVariablesFromContext: context => getVariablesFromQuery(context.query),
  getPropsFromContext: context => getPropsFromQuery(context.query),
});

// ignore unused exports getServerSideProps
// next.js export
export const getServerSideProps = expensePageQueryHelper.getServerSideProps;

const getPageMetadata = (intl, legacyExpenseId, expense) => {
  const baseMetadata = getCollectivePageMetadata(expense?.account);
  if (expense?.description) {
    return {
      ...baseMetadata,
      title: intl.formatMessage(messages.title, { id: legacyExpenseId, title: expense.description }),
    };
  } else {
    return baseMetadata;
  }
};

// ignore unused exports default
// next.js export
export default function ExpensePage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const queryResult = expensePageQueryHelper.useQuery(props);
  const router = useRouter();
  const client = useApolloClient();

  // Refetch data when logging in
  useEffect(() => {
    if (LoggedInUser) {
      queryResult.refetch();
    }
  }, [LoggedInUser]);

  useEffect(() => {
    addParentToURLIfMissing(router, queryResult.data?.expense?.account, `/expenses/${props.legacyExpenseId}`);
  });

  const { collectiveSlug, edit, draftKey } = props;
  const data = queryResult.data;
  const error = queryResult.error;
  const { refetch, fetchMore, startPolling, stopPolling } = queryResult;
  if (!queryResult.loading) {
    if (!data || error) {
      return <ErrorPage data={data} />;
    } else if (!data.expense) {
      return <ErrorPage error={generateNotFoundError(null)} log={false} />;
    } else if (!data.expense.account || props.collectiveSlug !== data.expense.account.slug) {
      return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
    }
  }

  const expense = cloneDeep(data?.expense);
  if (expense && data.expensePayeeStats?.payee?.stats) {
    expense.payee.stats = data.expensePayeeStats?.payee?.stats;
  }
  const collective = expense?.account;
  const host = collective?.host;
  const metadata = getPageMetadata(intl, props.legacyExpenseId, expense);

  return (
    <Page collective={collective} canonicalURL={`${getCollectivePageCanonicalURL(collective)}/expense`} {...metadata}>
      <CollectiveNavbar collective={collective} isLoading={!collective} selectedCategory={NAVBAR_CATEGORIES.BUDGET} />
      <Flex flexDirection={['column', 'row']} px={[2, 3, 4]} py={[0, 5]} mt={3} data-cy="expense-page-content">
        <Box width={SIDE_MARGIN_WIDTH}></Box>
        <Box flex="1 1 650px" minWidth={300} maxWidth={[null, null, null, 792]} mr={[null, 2, 3, 4]} px={2}>
          <Expense
            data={data}
            loading={queryResult.loading}
            error={error}
            refetch={refetch}
            client={client}
            fetchMore={fetchMore}
            legacyExpenseId={props.legacyExpenseId}
            startPolling={startPolling}
            stopPolling={stopPolling}
            isRefetchingDataForUser={queryResult.loading}
            edit={edit}
            draftKey={draftKey}
          />
        </Box>
        <Flex flex="1 1" justifyContent={['center', null, 'flex-start', 'flex-end']} pt={80}>
          <Box minWidth={270} width={['100%', null, null, 275]} px={2}>
            <ExpenseInfoSidebar isLoading={queryResult.loading} collective={collective} host={host} />
          </Box>
        </Flex>
        <Box width={SIDE_MARGIN_WIDTH} />
      </Flex>
      <MobileCollectiveInfoStickyBar isLoading={queryResult.loading} collective={collective} host={host} />
    </Page>
  );
}
