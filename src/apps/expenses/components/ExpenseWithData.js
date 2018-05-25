import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'
import { FormattedMessage } from 'react-intl'

import Error from '../../../components/Error';
import withIntl from '../../../lib/withIntl';
import Expense from './Expense';

import CommentsWithData from '../../../components/CommentsWithData';


class ExpenseWithData extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    view: PropTypes.string, // "compact" for homepage (can't edit expense, don't show header), "list" for list view, "details" for details view
    filter: PropTypes.object, // { category, recipient }
    defaultAction: PropTypes.string, // "new" to open the new expense form by default
    LoggedInUser: PropTypes.object,
    allowPayAction: PropTypes.bool,
    lockPayAction: PropTypes.func,
    unlockPayAction: PropTypes.func,
  }

  constructor(props) {
    super(props);
  }

  render() {
    const {
      data,
      LoggedInUser,
      collective,
      view,
      allowPayAction,
      lockPayAction,
      unlockPayAction,
    } = this.props;

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    if (data.loading) {
      return <div><FormattedMessage id="loading" defaultMessage="loading" /></div>;
    }

    const expense = data.Expense;

    return (
      <div className="ExpenseWithData">

        <Expense
          key={expense.id}
          collective={collective}
          expense={expense}
          view={view}
          editable={true}
          LoggedInUser={LoggedInUser}
          allowPayAction={allowPayAction}
          lockPayAction={lockPayAction}
          unlockPayAction={unlockPayAction}
        />

        { view === 'details' &&
          <CommentsWithData
            expense={expense}
            collective={collective}
            LoggedInUser={LoggedInUser}
            />
        }

      </div>
    );
  }

}


const getExpenseQuery = gql`
query Expense($id: Int!) {
  Expense(id: $id) {
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

export const addExpenseData = graphql(getExpenseQuery);
export default addExpenseData(withIntl(ExpenseWithData));
