import React from 'react';
import { useQuery } from '@apollo/client';
import { has } from 'lodash';
import { useRouter } from 'next/router';

import expenseStatus from '../../../lib/constants/expense-status';
import expenseTypes from '../../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../../lib/constants/payout-method';
import { parseDateInterval } from '../../../lib/date-utils';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { expensesPageQuery } from '../../../pages/expenses';
import { parseAmountRange } from '../../budget/filters/AmountFilter';
import ExpensesComponent from '../../expenses/Expenses';
import { parseChronologicalOrderInput } from '../../expenses/filters/ExpensesOrder';
import { AdminSectionProps } from '../types';

const parseQuery = routerQuery => {
  const {
    // parentCollectiveSlug,
    // collectiveSlug,
    offset,
    limit,
    type,
    status,
    tag,
    amount,
    payout,
    period,
    searchTerm,
    orderBy,
    direction,
  } = routerQuery;
  return {
    offset: parseInt(offset) || undefined,
    limit: parseInt(limit) || undefined,
    type: has(expenseTypes, type) ? type : undefined,
    status: has(expenseStatus, status) || status === 'READY_TO_PAY' ? status : undefined,
    payout: has(PayoutMethodType, payout) ? payout : undefined,
    direction,
    period,
    amount,
    tag,
    searchTerm,
    orderBy,
  };
};
const EXPENSES_PER_PAGE = 10;

const getVariablesFromQuery = (query, slug) => {
  const amountRange = parseAmountRange(query.amount);
  const { from: dateFrom, to: dateTo } = parseDateInterval(query.period);
  const orderBy = query.orderBy && parseChronologicalOrderInput(query.orderBy);

  // TODO: This is hard-coded to only work for Submitted Expenses for Users currently
  // const showSubmitted = query.direction === 'SUBMITTED' || props.account.type === 'USER';
  // const fromAccount = showSubmitted ? { slug } : null;
  // const account = !showSubmitted ? { slug } : null;

  const fromAccount = { slug };
  const account = null;
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
  const query = parseQuery(router.query);
  const variables = getVariablesFromQuery(query, props.account.slug);
  const { LoggedInUser } = useLoggedInUser();

  const { data, error, loading, refetch } = useQuery(expensesPageQuery, {
    variables,
    context: API_V2_CONTEXT,
  });

  return (
    <React.Fragment>
      <ExpensesComponent
        data={data}
        refetch={refetch}
        query={query}
        error={error}
        loading={loading}
        variables={variables}
        LoggedInUser={LoggedInUser}
        collectiveSlug={variables.collectiveSlug}
      />
    </React.Fragment>
  );
};

export default Expenses;
