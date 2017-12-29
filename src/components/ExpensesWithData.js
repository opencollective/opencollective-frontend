import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import Expenses from '../components/Expenses';
import CreateExpenseForm from '../components/CreateExpenseForm';
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import { FormattedMessage } from 'react-intl'

class ExpensesWithData extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    editable: PropTypes.bool,
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.createExpense = this.createExpense.bind(this);
  }

  async createExpense(expense) {
    try {
      expense.collective = { id: this.props.collective.id };
      expense.user = {
        paypalEmail: expense.paypalEmail
      }
      delete expense.paypalEmail;
      console.log(">>> createExpense", expense);
      const res = await this.props.createExpense(expense);
      console.log(">>> createExpense res", res);
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    const {
      data,
      LoggedInUser,
      collective,
      editable,
      includeHostedCollectives
    } = this.props;

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    const expenses = data.allExpenses;

    return (
      <div className="ExpensesContainer">

        <CreateExpenseForm
          collective={collective}
          LoggedInUser={LoggedInUser}
          onSubmit={this.createExpense}
          />

        <h1>
          <FormattedMessage id="collective.Expenses.title" defaultMessage="{n, plural, one {Latest Expense} other {Latest Expenses}}" values={{n: 2 }} />
        </h1>

        <Expenses
          collective={collective}
          expenses={expenses}
          refetch={data.refetch}
          editable={editable}
          fetchMore={this.props.fetchMore}
          LoggedInUser={LoggedInUser}
          includeHostedCollectives={includeHostedCollectives}
          />

      </div>
    );
  }

}


const getExpensesQuery = gql`
query Expenses($CollectiveId: Int!, $status: String, $limit: Int, $offset: Int, $includeHostedCollectives: Boolean) {
  allExpenses(CollectiveId: $CollectiveId, status: $status, limit: $limit, offset: $offset, includeHostedCollectives: $includeHostedCollectives) {
    id
    description
    status
    createdAt
    updatedAt
    incurredAt
    category
    amount
    currency
    payoutMethod
    privateMessage
    attachment
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
      image
    }
    user {
      id
      paypalEmail
    }
  }
}
`;


const EXPENSES_PER_PAGE = 10;
export const addExpensesData = graphql(getExpensesQuery, {
  options(props) {
    return {
      variables: {
        CollectiveId: props.collective.id,
        offset: 0,
        limit: props.limit || EXPENSES_PER_PAGE * 2,
        includeHostedCollectives: props.includeHostedCollectives || false
      }
    }
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allExpenses.length,
          limit: EXPENSES_PER_PAGE
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allExpenses: [...previousResult.allExpenses, ...fetchMoreResult.allExpenses]
          })
        }
      })
    }
  })  
});

const createExpenseQuery = gql`
mutation createExpense($expense: ExpenseInputType!) {
  createExpense(expense: $expense) {
    id
    description
    amount
    attachment
    category
    privateMessage
    payoutMethod
    status
  }
}
`;

const addMutation = graphql(createExpenseQuery, {
  props: ( { mutate }) => ({
    createExpense: async (expense) => {
      return await mutate({ variables: { expense } })
    }
  })
  });

const addData = compose(addExpensesData, addMutation);

export default addData(withIntl(ExpensesWithData));