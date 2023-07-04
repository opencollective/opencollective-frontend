import React from 'react';
import { useQuery } from '@apollo/client';
import { has } from 'lodash';
import { useRouter } from 'next/router';

import { isIndividualAccount } from '../../../lib/collective.lib';
import expenseStatus from '../../../lib/constants/expense-status';
import expenseTypes from '../../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../../lib/constants/payout-method';
import { parseDateInterval } from '../../../lib/date-utils';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';
import useQueryFilter, { BooleanFilter } from '../../../lib/hooks/useQueryFilter';

import { expensesPageQuery } from '../../../pages/expenses';
import { parseAmountRange } from '../../budget/filters/AmountFilter';
import ExpensesPage from '../../expenses/ExpensesPage';
import { parseChronologicalOrderInput } from '../../expenses/filters/ExpensesOrder';
import { AdminSectionProps } from '../types';

const parseQuery = (routerQuery, account) => {
  const { offset, limit, type, status, tag, amount, payout, period, searchTerm, orderBy, direction } = routerQuery;
  const newDirection = direction ? direction : isIndividualAccount(account) ? 'SUBMITTED' : 'RECEIVED';

  return {
    offset: parseInt(offset) || undefined,
    limit: parseInt(limit) || undefined,
    type: has(expenseTypes, type) ? type : undefined,
    status: has(expenseStatus, status) || status === 'READY_TO_PAY' ? status : undefined,
    payout: has(PayoutMethodType, payout) ? payout : undefined,
    direction: newDirection,
    period,
    amount,
    tag,
    searchTerm,
    orderBy,
  };
};
const EXPENSES_PER_PAGE = 10;

const getVariables = (query, slug) => {
  const amountRange = parseAmountRange(query.amount);
  const { from: dateFrom, to: dateTo } = parseDateInterval(query.period);
  const orderBy = query.orderBy && parseChronologicalOrderInput(query.orderBy);

  const showSubmitted = query.direction === 'SUBMITTED';
  const fromAccount = showSubmitted ? { slug } : null;
  const account = !showSubmitted ? { slug } : null;
  return {
    collectiveSlug: slug,
    fromAccount,
    account,
    offset: query.offset || 0,
    limit: query.limit || EXPENSES_PER_PAGE,
    type: query.type,
    status: query.status,
    tags: query.tag ? (query.tag === 'untagged' ? null : [query.tag]) : undefined,
    minAmount: amountRange[0] && amountRange[0] * 100,
    maxAmount: amountRange[1] && amountRange[1] * 100,
    payoutMethodType: query.payout,
    dateFrom,
    dateTo,
    orderBy,
    searchTerm: query.searchTerm,
  };
};

const Expenses = (props: AdminSectionProps) => {
  const router = useRouter();
  const query = parseQuery(router.query, props.account);
  const variables = getVariables(query, props.account.slug);
  const { LoggedInUser } = useLoggedInUser();

  const queryFilter = useQueryFilter({
    filters: {
      virtualCard: {
        isMulti: true,
      },
      chargeHasReceipts: BooleanFilter,
    },
  });

  const { data, error, loading, refetch } = useQuery(expensesPageQuery, {
    variables: {
      ...variables,
      virtualCards: queryFilter.values.virtualCard?.map(id => ({ id })),
      chargeHasReceipts: queryFilter.values.chargeHasReceipts,
    },
    context: API_V2_CONTEXT,
  });

  return (
    <ExpensesPage
      data={data}
      refetch={refetch}
      query={query}
      error={error}
      loading={loading}
      variables={variables}
      LoggedInUser={LoggedInUser}
      onlySubmittedExpenses={LoggedInUser?.collective.slug === variables.collectiveSlug}
      isDashboard
    />
  );
};

export default Expenses;
