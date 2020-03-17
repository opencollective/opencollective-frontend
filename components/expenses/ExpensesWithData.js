import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { get } from 'lodash';

import Error from '../Error';
import Expenses from './Expenses';

class ExpensesWithData extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    host: PropTypes.object,
    limit: PropTypes.number,
    view: PropTypes.string, // "compact" for homepage (can't edit expense, don't show header), "summary" for list view, "details" for details view
    hasFilters: PropTypes.bool,
    filters: PropTypes.object, // { category, recipient, status }
    defaultAction: PropTypes.string, // "new" to open the new expense form by default
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    fetchMore: PropTypes.func, // from addExpensesData
    data: PropTypes.object, // from addExpensesData
    onFiltersChange: PropTypes.func, // from addExpensesData
  };

  /**
   * `addExpensesData` may hack the status variable by turning `READY` into `APPROVED`
   * to speak the language of the API. Here we prefer to rely on the `this.props.filters.status`
   * variable as is stays untouched but we fallback on `data.variables` to ensure
   * we don't miss defaults if not provided.
   */
  getStatus() {
    return get(this.props.filters, 'status') || get(this.props.data, 'variables.status');
  }

  render() {
    const { data, LoggedInUser, collective, host, view, includeHostedCollectives } = this.props;

    if (data.error) {
      return <Error message={data.error.message} />;
    }

    const expenses = data.allExpenses;
    return (
      <div className="ExpensesWithData">
        <Expenses
          collective={collective}
          host={host}
          expenses={expenses}
          editable={view !== 'compact'}
          view={view}
          fetchMore={this.props.fetchMore}
          updateVariables={this.props.onFiltersChange}
          loading={data.loading}
          status={this.getStatus()}
          filters={this.props.hasFilters}
          refetch={data.refetch}
          LoggedInUser={LoggedInUser}
          includeHostedCollectives={includeHostedCollectives}
        />
      </div>
    );
  }
}

const getExpensesQuery = gql`
  query Expenses(
    $CollectiveId: Int!
    $status: String
    $category: String
    $fromCollectiveSlug: String
    $limit: Int
    $offset: Int
    $includeHostedCollectives: Boolean
  ) {
    allExpenses(
      CollectiveId: $CollectiveId
      status: $status
      category: $category
      fromCollectiveSlug: $fromCollectiveSlug
      limit: $limit
      offset: $offset
      includeHostedCollectives: $includeHostedCollectives
    ) {
      id
      idV2
      description
      status
      createdAt
      updatedAt
      incurredAt
      category
      amount
      type
      currency
      payoutMethod
      PayoutMethod {
        id
        type
      }
      privateMessage
      userTaxFormRequiredBeforePayment
      attachment
      attachments {
        id
        url
        description
        amount
      }
      collective {
        id
        slug
        currency
        name
        host {
          id
          slug
        }
        stats {
          id
          balance
        }
      }
      fromCollective {
        id
        type
        name
        slug
        imageUrl
      }
      user {
        id
        paypalEmail
        email
      }
    }
  }
`;

const EXPENSES_PER_PAGE = 10;

const getExpensesVariables = props => {
  const filters = { ...props.filters };
  if (filters.status === 'READY') {
    filters.status = 'APPROVED';
  }

  const vars = {
    CollectiveId: props.collective.id,
    offset: 0,
    limit: props.limit || EXPENSES_PER_PAGE * 2,
    includeHostedCollectives: props.includeHostedCollectives || false,
    ...filters,
  };
  if (vars.category) {
    vars.fromCollectiveSlug = null;
  } else {
    vars.category = null;
  }
  return vars;
};

export const addExpensesData = graphql(getExpensesQuery, {
  options(props) {
    return {
      variables: getExpensesVariables(props),
      fetchPolicy: 'network-only',
    };
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allExpenses.length,
          limit: EXPENSES_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allExpenses: [...previousResult.allExpenses, ...fetchMoreResult.allExpenses],
          });
        },
      });
    },
  }),
});

export default addExpensesData(ExpensesWithData);
