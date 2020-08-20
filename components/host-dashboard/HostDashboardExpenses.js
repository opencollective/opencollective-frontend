import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { mapValues } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import ExpensesFilters from '../expenses/ExpensesFilters';
import ExpensesList from '../expenses/ExpensesList';
import { parseAmountRange } from '../expenses/filters/ExpensesAmountFilter';
import { getDateRangeFromPeriod } from '../expenses/filters/ExpensesDateFilter';
import {
  expenseHostFields,
  expensesListAdminFieldsFragment,
  expensesListFieldsFragment,
} from '../expenses/graphql/fragments';
import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import StyledHr from '../StyledHr';
import { H1 } from '../Text';

const hostDashboardExpensesQuery = gqlV2/* GraphQL */ `
  query HostDashboardExpenses(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $type: ExpenseType
    $tags: [String]
    $status: ExpenseStatusFilter
    $minAmount: Int
    $maxAmount: Int
    $payoutMethodType: PayoutMethodType
    $dateFrom: ISODateTime
    $searchTerm: String
  ) {
    host(slug: $hostSlug) {
      ...ExpenseHostFields
    }
    expenses(
      host: { slug: $hostSlug }
      limit: $limit
      offset: $offset
      type: $type
      tags: $tags
      status: $status
      minAmount: $minAmount
      maxAmount: $maxAmount
      payoutMethodType: $payoutMethodType
      dateFrom: $dateFrom
      searchTerm: $searchTerm
    ) {
      totalCount
      offset
      limit
      nodes {
        ...ExpensesListFieldsFragment
        ...ExpensesListAdminFieldsFragment
        account {
          id
          name
          slug
          currency
          type
          ... on Collective {
            balance
          }
          ... on Event {
            balance
          }
        }
      }
    }
  }

  ${expensesListFieldsFragment}
  ${expensesListAdminFieldsFragment}
  ${expenseHostFields}
`;

const EXPENSES_PER_PAGE = 15;

const getVariablesFromQuery = query => {
  const amountRange = parseAmountRange(query.amount);
  const [dateFrom] = getDateRangeFromPeriod(query.period);
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || EXPENSES_PER_PAGE,
    type: query.type,
    status: query.status,
    tags: query.tag ? [query.tag] : undefined,
    minAmount: amountRange[0] && amountRange[0] * 100,
    maxAmount: amountRange[1] && amountRange[1] * 100,
    payoutMethodType: query.payout,
    dateFrom,
    searchTerm: query.searchTerm,
  };
};

const HostDashboardExpenses = ({ hostSlug }) => {
  const { query } = useRouter() || {};
  const { data, error, loading, variables, refetch } = useQuery(hostDashboardExpensesQuery, {
    variables: { hostSlug, ...getVariablesFromQuery(query) },
    context: API_V2_CONTEXT,
  });
  const hasFilters = React.useMemo(
    () =>
      Object.entries(query).some(([key, value]) => {
        return !['view', 'offset', 'limit', 'hostCollectiveSlug'].includes(key) && value;
      }),
    [query],
  );

  return (
    <Box maxWidth={1000} m="0 auto" py={5} px={2}>
      <Flex>
        <H1 fontSize="32px" lineHeight="40px" mb={24} py={2} fontWeight="normal">
          <FormattedMessage id="section.expenses.title" defaultMessage="Expenses" />
        </H1>
        <Box mx="auto" />
        <Box p={2}>
          <SearchBar
            defaultValue={query.searchTerm}
            onSubmit={searchTerm => Router.pushRoute('host.dashboard', { ...query, searchTerm, offset: null })}
          />
        </Box>
      </Flex>
      <StyledHr mb={26} borderWidth="0.5px" />
      <Box mb={34}>
        {data?.host ? (
          <ExpensesFilters
            collective={data.host}
            filters={query}
            onChange={queryParams =>
              Router.pushRoute('host.dashboard', {
                ...query,
                ...queryParams,
                offset: null,
              })
            }
          />
        ) : loading ? (
          <LoadingPlaceholder height={70} />
        ) : null}
      </Box>
      <MessageBox type="info" fontSize="14px" mb={4}>
        📢&nbsp;&nbsp;
        <FormattedMessage
          id="HostDashboardExpenses.Beta"
          defaultMessage="We are working on a new version of the expenses page for the host dashboard. It's still in progress, but we'd love to hear your thoughts on this! You can provide feedback on the <IssueLink>dedicated Github issue</IssueLink>."
          values={{
            IssueLink: getI18nLink({
              href: 'https://github.com/opencollective/opencollective/issues/3288',
              openInNewTab: true,
            }),
          }}
        />
      </MessageBox>
      {error ? (
        <MessageBox type="error" withIcon>
          {getErrorFromGraphqlException(error).message}
        </MessageBox>
      ) : !loading && !data.expenses?.nodes.length ? (
        <MessageBox type="info" withIcon data-cy="zero-expense-message">
          {hasFilters ? (
            <FormattedMessage
              id="ExpensesList.Empty"
              defaultMessage="No expense matches the given filters, <ResetLink>reset them</ResetLink> to see all expenses."
              values={{
                ResetLink(text) {
                  return (
                    <Link
                      data-cy="reset-expenses-filters"
                      route="host.dashboard"
                      params={{
                        ...mapValues(query, () => null),
                        hostCollectiveSlug: data.host.slug,
                        view: 'expenses-beta',
                      }}
                    >
                      {text}
                    </Link>
                  );
                },
              }}
            />
          ) : (
            <FormattedMessage id="expenses.empty" defaultMessage="No expenses" />
          )}
        </MessageBox>
      ) : (
        <React.Fragment>
          <ExpensesList
            isLoading={loading}
            nbPlaceholders={variables.limit}
            host={data?.host}
            expenses={data?.expenses?.nodes}
            view="admin"
            usePreviewModal
            onDelete={() => refetch()}
          />
          <Flex mt={5} justifyContent="center">
            <Pagination
              route="host.dashboard"
              total={data?.expenses?.totalCount}
              limit={variables.limit}
              offset={variables.offset}
              scrollToTopOnChange
            />
          </Flex>
        </React.Fragment>
      )}
    </Box>
  );
};

HostDashboardExpenses.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default HostDashboardExpenses;
