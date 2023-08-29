import React, { useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

import { initClient } from '../lib/apollo-client';
import { getCollectivePageMetadata } from '../lib/collective.lib';
import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { ExpensePageQuery } from '../lib/graphql/types/v2/graphql';
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

export const getVariableFromProps = props => {
  const firstOfCurrentYear = dayjs(new Date(new Date().getFullYear(), 0, 1))
    .utc(true)
    .toISOString();
  return {
    legacyExpenseId: parseInt(props.ExpenseId),
    draftKey: props.key || null,
    totalPaidExpensesDateFrom: firstOfCurrentYear,
  };
};

const messages = defineMessages({
  title: {
    id: 'ExpensePage.title',
    defaultMessage: '{title} · Expense #{id}',
  },
});

const SIDE_MARGIN_WIDTH = 'calc((100% - 1200px) / 2)';

type ExpensePageProps = {
  collectiveSlug: string;
  legacyExpenseId: number;
  edit?: string;
  draftKey?: string;
  data: Partial<ExpensePageQuery>;
  error?: any;
};

export const getServerSideProps: GetServerSideProps<ExpensePageProps> = async ctx => {
  const query = ctx.query as { collectiveSlug: string; ExpenseId: string; key?: string; edit?: string };
  const client = initClient();
  const variables = getVariableFromProps(query);
  const { data, error } = await client.query({
    query: expensePageQuery,
    variables,
    context: API_V2_CONTEXT,
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore',
  });

  return {
    props: {
      ...query,
      legacyExpenseId: parseInt(query.ExpenseId as string),
      draftKey: query.key || null,
      data,
      error: error || null,
    }, // will be passed to the page component as props
  };
};

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

export default function ExpensePage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const [fetchData, query] = useLazyQuery(expensePageQuery, {
    variables: getVariableFromProps(props),
    context: API_V2_CONTEXT,
  });
  const router = useRouter();
  const client = query.client;

  useEffect(() => {
    if (LoggedInUser) {
      fetchData();
    }
  }, [LoggedInUser]);

  useEffect(() => {
    addParentToURLIfMissing(router, props.data?.expense?.account, `/expenses/${props.legacyExpenseId}`);
  });

  const { collectiveSlug, edit, draftKey } = props;
  const data = query?.data || props.data;
  const error = query?.error || props.error;
  const { refetch, fetchMore, startPolling, stopPolling } = query;
  if (!query.loading) {
    if (!data || error) {
      return <ErrorPage data={data} />;
    } else if (!data.expense) {
      return <ErrorPage error={generateNotFoundError(null)} log={false} />;
    } else if (!data.expense.account || props.collectiveSlug !== data.expense.account.slug) {
      return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
    }
  }

  const expense = cloneDeep(data.expense);
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
            loading={query.loading}
            error={error}
            refetch={refetch}
            client={client}
            fetchMore={fetchMore}
            legacyExpenseId={props.legacyExpenseId}
            startPolling={startPolling}
            stopPolling={stopPolling}
            isRefetchingDataForUser={query.loading}
            edit={edit}
            draftKey={draftKey}
          />
        </Box>
        <Flex flex="1 1" justifyContent={['center', null, 'flex-start', 'flex-end']} pt={80}>
          <Box minWidth={270} width={['100%', null, null, 275]} px={2}>
            <ExpenseInfoSidebar isLoading={query.loading} collective={collective} host={host} />
          </Box>
        </Flex>
        <Box width={SIDE_MARGIN_WIDTH} />
      </Flex>
      <MobileCollectiveInfoStickyBar isLoading={query.loading} collective={collective} host={host} />
    </Page>
  );
}
