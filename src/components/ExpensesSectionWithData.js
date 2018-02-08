import React from 'react';
import PropTypes from 'prop-types';
import { addCollectiveCoverData } from '../graphql/queries';
import NotFound from './NotFound';
import Error from './Error';
import withIntl from '../lib/withIntl';
import ExpensesWithData from './ExpensesWithData';
import ExpensesStatsWithData from './ExpensesStatsWithData';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import CreateExpenseForm from './CreateExpenseForm';
import Link from './Link';

class ExpensesSectionWithData extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired, // collective.id
    LoggedInUser: PropTypes.object,
    limit: PropTypes.number
  }

  constructor(props) {
    super(props);
    this.createExpense = this.createExpense.bind(this);
  }

  async createExpense(expense) {
    const { LoggedInUser, collective } = this.props;
    try {
      expense.collective = { id: collective.id };
      expense.currency = collective.currency;
      expense.user = pick(expense, ['paypalEmail']);
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
    const { collective, LoggedInUser, limit } = this.props;

    if (!collective) return (<NotFound />);

    return (
      <div className="ExpensesSectionWithData">
        <style jsx>{`
          .columns {
            display: flex;
          }
          .rightColumn {
            width: 300px;
            margin-left: 5rem;
          }
          .largeColumn {
            width: 900px;
          }
        `}</style>

        <div className="columns" >

          <div className="largeColumn">
            <ExpensesWithData
              collective={collective}
              LoggedInUser={LoggedInUser}
              limit={limit || 10}
              />
          </div>

          <div className="rightColumn">
            <ExpensesStatsWithData slug={collective.slug} />
          </div>

        </div>
      </div>
    );
  }

}

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
  props: ( { mutate }) => ({
    createExpense: async (expense) => {
      return await mutate({ variables: { expense } })
    }
  })
});

export default addCollectiveCoverData(addMutation(withIntl(ExpensesSectionWithData)));