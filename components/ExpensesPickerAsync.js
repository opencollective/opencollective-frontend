import React from 'react';
import PropTypes from 'prop-types';
import { useLazyQuery } from '@apollo/client';
import { debounce } from 'lodash';
import { FormattedDate } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';

import Avatar from './Avatar';
import { Flex } from './Grid';
import StyledSelect from './StyledSelect';
import StyledTag from './StyledTag';
import { Span } from './Text';

const expensesSearchQuery = gql`
  query ExpensesPickerSearch($account: AccountReferenceInput, $searchTerm: String, $status: ExpenseStatusFilter) {
    expenses(account: $account, limit: 100, searchTerm: $searchTerm, status: $status) {
      nodes {
        id
        legacyId
        description
        createdAt
        account {
          id
          name
          slug
          isIncognito
          imageUrl(height: 48)
        }
      }
    }
  }
`;

const getOptionsFromExpenses = expenses => {
  if (!expenses?.length) {
    return [];
  } else {
    return expenses.map(expense => ({
      value: expense,
      label: `#${expense.legacyId} - ${expense.description}`,
    }));
  }
};

/** Throttle search function to limit invocations while typing */
const throttledSearch = debounce((searchFunc, variables) => {
  return searchFunc({ variables });
}, 750);

const getAccountInput = account => {
  if (!account) {
    return null;
  } else if (typeof account.id === 'string') {
    return { id: account.id };
  } else if (typeof account.id === 'number') {
    return { legacyId: account.id };
  } else if (typeof account.legacyId === 'number') {
    return { legacyId: account.legacyId };
  } else {
    return { slug: account.slug };
  }
};

const formatOptionLabel = option => {
  return (
    <Flex alignItems="center">
      <Avatar collective={option.value.fromAccount} size={24} />
      <StyledTag ml={2} fontSize="11px">
        #{option.value.legacyId}
      </StyledTag>
      <Span fontSize="12px" ml={2}>
        <FormattedDate value={option.value.createdAt} /> - {option.value.description}
      </Span>
    </Flex>
  );
};

/**
 * Fetches expenses based on user search input.
 */
const ExpensesPickerAsync = ({ inputId, noCache, account, status, ...props }) => {
  const fetchPolicy = noCache ? 'network-only' : undefined;
  const variables = { account: getAccountInput(account), status };
  const queryParameters = { fetchPolicy, variables, context: API_V2_CONTEXT };
  const [searchExpenses, { loading, data }] = useLazyQuery(expensesSearchQuery, queryParameters);
  const [searchTerm, setSearchTerm] = React.useState('');
  const options = React.useMemo(() => getOptionsFromExpenses(data?.expenses?.nodes), [data?.expenses?.nodes]);

  // If preload is true, trigger a first query on mount or when one of the query param changes
  React.useEffect(() => {
    if (account) {
      throttledSearch(searchExpenses, { searchTerm });
    }
  }, [account, searchTerm]);

  return (
    <StyledSelect
      inputId={inputId}
      isLoading={loading}
      useSearchIcon={true}
      options={options}
      filterOption={() => true /** Filtering is done by the API */}
      onInputChange={newTerm => setSearchTerm(newTerm.trim())}
      formatOptionLabel={formatOptionLabel}
      {...props}
    />
  );
};

ExpensesPickerAsync.propTypes = {
  /** The id of the search input */
  inputId: PropTypes.string.isRequired,
  /** Max number of collectives displayed at the same time */
  limit: PropTypes.number,
  /** If true, results won't be cached (Apollo "network-only" mode) */
  noCache: PropTypes.bool,
  account: PropTypes.object,
  status: PropTypes.string,
};

ExpensesPickerAsync.defaultProps = {};

export default ExpensesPickerAsync;
