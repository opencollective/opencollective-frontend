import React from 'react';
import { has, isNil, omitBy } from 'lodash';
import type { InferGetServerSidePropsType } from 'next';
import { defineMessages, useIntl } from 'react-intl';
import type { z } from 'zod';

import { APOLLO_ERROR_PROP_NAME, APOLLO_QUERY_DATA_PROP_NAME, getSSRQueryHelpers } from '../lib/apollo-client';
import { getCollectivePageMetadata, isIndividualAccount } from '../lib/collective';
import expenseTypes from '../lib/constants/expenseTypes';
import { PayoutMethodType } from '../lib/constants/payout-method';
import { generateNotFoundError } from '../lib/errors';
import { ExpenseStatus } from '../lib/graphql/types/v2/graphql';
import { getCollectivePageCanonicalURL } from '../lib/url-helpers';
import type { ExpensesPageQuery } from '@/lib/graphql/types/v2/graphql';
import { getSSRVariablesFromQuery } from '@/lib/hooks/useQueryFilter';

import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import ErrorPage from '../components/ErrorPage';
import Expenses, { expensesPageQuery, schema, toVariables } from '../components/expenses/ExpensesPage';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import { EXPENSE_DIRECTION } from '@/components/expenses/filters/DirectionFilter';

const messages = defineMessages({
  title: {
    id: 'ExpensesPage.title',
    defaultMessage: '{collectiveName} · Expenses',
  },
});

const getPropsFromQuery = query => ({
  parentCollectiveSlug: query.parentCollectiveSlug || null,
  collectiveSlug: query.collectiveSlug,
  query: omitBy(
    {
      offset: parseInt(query.offset) || undefined,
      limit: parseInt(query.limit) || undefined,
      type: has(expenseTypes, query.type) ? query.type : undefined,
      status: has(ExpenseStatus, query.status) || query.status === 'READY_TO_PAY' ? query.status : undefined,
      payout: has(PayoutMethodType, query.payout) ? query.payout : undefined,
      direction: query.direction,
      period: query.period,
      amount: query.amount,
      tag: query.tag,
      searchTerm: query.searchTerm,
      orderBy: query.orderBy,
    },
    isNil,
  ),
});

type ExpensesPageProps = {
  collectiveSlug: string;
  parentCollectiveSlug: string;
  query: Partial<{
    offset: number;
    limit: number;
    type: string;
    status: string;
    payout: string;
    direction: string;
    period: string;
    amount: string;
    tag: string;
    searchTerm: string;
    orderBy: string;
  }>;
};

const expensePageQueryHelpers = getSSRQueryHelpers<z.infer<typeof schema>, ExpensesPageProps, ExpensesPageQuery>({
  query: expensesPageQuery,

  getPropsFromContext: ctx => getPropsFromQuery(ctx.query),
  getVariablesFromContext: ctx => ({
    account: { slug: ctx.query.collectiveSlug },
    ...getSSRVariablesFromQuery({
      query: ctx.query,
      schema,
      toVariables,
      defaultFilterValues: {
        direction: EXPENSE_DIRECTION.SUBMITTED,
      },
    }),
    accountSlug: ctx.query.collectiveSlug,
  }),
  skipClientIfSSRThrows404: true,
});

// next.js export
// ts-unused-exports:disable-next-line
export const getServerSideProps = expensePageQueryHelpers.getServerSideProps;

// next.js export
// ts-unused-exports:disable-next-line
export default function SubmittedExpensesPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();
  const data = props[APOLLO_QUERY_DATA_PROP_NAME];
  const error = props[APOLLO_ERROR_PROP_NAME];
  const account = data?.account;
  const expenses = data?.expenses;

  const metadata = {
    ...getCollectivePageMetadata(account),
    title: intl.formatMessage(messages.title, { collectiveName: account?.name || 'Open Collective' }),
  };

  if (error) {
    return <ErrorPage data={data} error={error} />;
  } else if (!account || !expenses?.nodes) {
    return <ErrorPage error={generateNotFoundError(props.collectiveSlug)} log={false} />;
  } else if (!isIndividualAccount(data.account)) {
    // Hack for funds that want to keep their budget "private"
    return <PageFeatureNotSupported showContactSupportLink={false} />;
  }

  return (
    <Page collective={account} canonicalURL={`${getCollectivePageCanonicalURL(account)}/expenses`} {...metadata}>
      <CollectiveNavbar collective={account} isLoading={!account} selectedCategory={NAVBAR_CATEGORIES.BUDGET} />
      <div className="mx-auto my-16 max-w-[1260px] px-2 md:px-3 lg:px-4">
        <Expenses expenses={expenses} account={account} direction={EXPENSE_DIRECTION.SUBMITTED} />
      </div>
    </Page>
  );
}
