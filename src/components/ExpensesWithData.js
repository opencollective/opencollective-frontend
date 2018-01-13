import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import Expenses from '../components/Expenses';
import Currency from '../components/Currency';
import CreateExpenseForm from '../components/CreateExpenseForm';
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import { FormattedMessage } from 'react-intl'
import { pick, get } from 'lodash';

class ExpensesWithData extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    compact: PropTypes.bool, // compact view for homepage (can't edit expense, don't show header)
    defaultAction: PropTypes.string, // "new" to open the new expense form by default
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.createExpense = this.createExpense.bind(this);
    this.state = {
      showNewExpenseForm: props.defaultAction === 'new' ? true : false
    }
  }

  async createExpense(expense) {
    const { LoggedInUser, collective } = this.props;
    try {
      expense.collective = { id: collective.id };
      expense.currency = collective.currency;
      expense.user = pick(expense, ['email', 'paypalEmail']);
      delete expense.email;
      delete expense.paypalEmail;

      if (LoggedInUser) {
        expense.user.id = LoggedInUser.id;
      }
      console.log(">>> createExpense", expense);
      const res = await this.props.createExpense(expense);
      console.log(">>> createExpense res", res);
      this.setState({ showNewExpenseForm: false, expenseCreated: res.data.createExpense })
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    const {
      data,
      LoggedInUser,
      collective,
      compact,
      includeHostedCollectives
    } = this.props;

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    const expenses = data.allExpenses;
    const availableBalance = get(collective, 'stats.balance');

    return (
      <div className="ExpensesContainer">
        <style jsx>{`
          h1 {
            margin-bottom: 1rem;
          }
          .adminActions {
            text-align: center;
            text-transform: uppercase;
            font-size: 1.3rem;
            font-weight: 600;
            letter-spacing: 0.05rem;
            margin-bottom: 3rem;
          }
          .adminActions ul {
            overflow: hidden;
            text-align: center;
            margin: 0 auto;
            padding: 0;
            display: flex;
            justify-content: center;
            flex-direction: row;
            list-style: none;
          }
          .adminActions ul li {
            margin: 0 2rem;
          }
          .availableBalance {
            text-align: center;
            margin: 1rem;
          }
          .availableBalance span {
            margin-right: 0.5rem;
          }
        `}</style>

        { !includeHostedCollectives && this.state.showNewExpenseForm &&
          <CreateExpenseForm
            collective={collective}
            LoggedInUser={LoggedInUser}
            onSubmit={this.createExpense}
            />
        }

        { this.state.expenseCreated &&
          <div className="expenseCreated">
            <FormattedMessage id="expense.created" defaultMessage="Your expense has been submitted with success. It is now pending approval from one of the core contributors of the collective. You will be notified by email once it has been approved. Then, the host ({host}) will proceed to reimburse your expense." values={{ host: collective.host.name }} />
          </div>
        }

        { !compact &&
          <div>
            <h1>
              <FormattedMessage id="collective.latestExpenses.title" defaultMessage="{n, plural, one {Latest Expense} other {Latest Expenses}}" values={{n: 2}} />
            </h1>
            { !includeHostedCollectives && Boolean(availableBalance) &&
              <div className="availableBalance">
                <FormattedMessage id="collective.stats.balance.title" defaultMessage="Available balance:" />
                <Currency value={availableBalance} currency={collective.currency} precision={2} />
              </div>
            }
            <div className="adminActions">
              <ul>
              { !includeHostedCollectives && !this.state.showNewExpenseForm &&
                <li><a className="submitNewExpense" onClick={() => this.setState({ showNewExpenseForm: true })}>
                  <FormattedMessage id="expense.new.button" defaultMessage="Submit a new expense" />
                </a></li>
              }
              </ul>
            </div>
          </div>
        }

        <Expenses
          collective={collective}
          expenses={expenses}
          refetch={data.refetch}
          editable={!Boolean(compact)}
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
      email
    }
  }
}
`;

const getExpensesVariables = (props) => {
  return {
    CollectiveId: props.collective.id,
    offset: 0,
    limit: props.limit || EXPENSES_PER_PAGE * 2,
    includeHostedCollectives: props.includeHostedCollectives || false
  }
}

const EXPENSES_PER_PAGE = 10;
export const addExpensesData = graphql(getExpensesQuery, {
  options(props) {
    return {
      variables: getExpensesVariables(props)
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
      email
      paypalEmail
    }
  }
}
`;

const addMutation = graphql(createExpenseQuery, {
  props: ( { ownProps, mutate }) => ({
    createExpense: async (expense) => {
      return await mutate({
        variables: { expense },
        update: (proxy, { data: { createExpense} }) => {
          const data = proxy.readQuery({
            query: getExpensesQuery,
            variables: getExpensesVariables(ownProps)
          });
          createExpense.isNew = true;
          data.allExpenses.unshift(createExpense);
          proxy.writeQuery({
            query: getExpensesQuery,
            variables: getExpensesVariables(ownProps),
            data
          });
        },
      })
    }
  })
});

const addData = compose(addExpensesData, addMutation);

export default addData(withIntl(ExpensesWithData));