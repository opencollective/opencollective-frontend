import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import Error from '../Error';
import CommentsWithData from '../CommentsWithData';
import MessageBox from '../MessageBox';
import Expense from './Expense';

class ExpenseWithData extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    view: PropTypes.string, // "compact" for homepage (can't edit expense, don't show header), "summary" for list view, "details" for details view
    filter: PropTypes.object, // { category, recipient }
    defaultAction: PropTypes.string, // "new" to open the new expense form by default
    LoggedInUser: PropTypes.object,
    allowPayAction: PropTypes.bool,
    lockPayAction: PropTypes.func,
    unlockPayAction: PropTypes.func,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { data, LoggedInUser, collective, view, allowPayAction, lockPayAction, unlockPayAction } = this.props;

    if (data.error) {
      return <Error message={data.error.message} />;
    } else if (data.loading) {
      return (
        <div>
          <FormattedMessage id="loading" defaultMessage="loading" />
        </div>
      );
    } else if (!data.Expense) {
      return (
        <MessageBox type="warning" withIcon>
          <FormattedMessage id="Expense.NotFound" defaultMessage="This expense doesn't exist" />
        </MessageBox>
      );
    }

    const expense = data.Expense;

    return (
      <div className="ExpenseWithData">
        <style jsx>
          {`
            .comments {
              margin-top: 3rem;
            }
          `}
        </style>
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
          refetch={data.refetch}
        />

        {view === 'details' && (
          <div className="comments">
            <CommentsWithData expense={expense} collective={collective} LoggedInUser={LoggedInUser} />
          </div>
        )}
      </div>
    );
  }
}

const getExpenseQuery = gql`
  query Expense($id: Int!) {
    Expense(id: $id) {
      id
      idV2
      description
      status
      createdAt
      updatedAt
      incurredAt
      category
      amount
      currency
      type
      payoutMethod
      PayoutMethod {
        id
        type
      }
      privateMessage
      userTaxFormRequiredBeforePayment
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

export const addExpenseData = graphql(getExpenseQuery);
export default addExpenseData(ExpenseWithData);
