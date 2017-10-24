import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, FormattedNumber, FormattedMessage } from 'react-intl';
import { imagePreview, capitalize } from '../lib/utils';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

class ExpenseDetails extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    expense: PropTypes.object,
    LoggedInUser: PropTypes.object,
    mode: PropTypes.string // open or closed
  }

  constructor(props) {
    super(props);
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 0, maximumFractionDigits: 2};
  }

  render() {
    const { expense } = this.props;
    console.log(">>> expense", expense)

    return (
        <div className={`ExpenseDetails ${this.props.mode}`}>
        <style jsx>{`
          .ExpenseDetails {
            font-size: 1.2rem;
            overflow: hidden;
            transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            max-height: 15rem;
          }
          .ExpenseDetails.closed {
            max-height: 0;
          }
          .ExpenseDetails .frame {
            padding: 4px;
            margin-top: 1rem;
            margin-right: 1rem;
            float: left;
            background-color: #f3f4f5;
          }
          .ExpenseDetails img {
            width: 64px;
          }
          .col {
            float: left;
            display: flex;
            flex-direction: column;
            margin-right: 1rem;
            margin-top: 1rem;
          }
          label {
            text-transform: uppercase;
            color: #aaaeb3;
            font-weight: 300;
            font-family: lato, montserratlight, arial;
            white-space: nowrap;
          }
          .netAmountInCollectiveCurrency {
            font-weight: bold;
          }

          @media(max-width: 600px) {
            .ExpenseDetails {
              max-height: 30rem;
            }
          }
        `}</style>

        <div className="frame">
          {expense.attachment &&
            <a href={expense.attachment} target="_blank" title="Open receipt in a new window">
              <img src={imagePreview(expense.attachment)} />
            </a>
          }
          {!expense.attachment &&
            <img src={'/static/images/receipt.svg'} />
          }
        </div>

        <div className="col">
          <label><FormattedMessage id='expense.payoutMethod' defaultMessage='payout method' /></label>
          {capitalize(expense.payoutMethod)}
        </div>

        { expense.privateMessage &&
          <div className="col">
            <label><FormattedMessage id='expense.privateMessage' defaultMessage='private note' /></label>
            {capitalize(expense.privateMessage)}
          </div>
        }

        <div className="col">
          <label><FormattedMessage id='expense.amount' defaultMessage='amount' /></label>
          <div className="amountDetails">
            <span className="amount">
              <FormattedNumber
                value={expense.amount / 100}
                currency={expense.currency}
                {...this.currencyStyle}
                />
            </span>
          </div>
        </div>
      </div>
    );
  }
}


const getExpenseQuery = gql`
query Expense($id: Int!) {
  Expense(id: $id) {
    id
    description
    privateMessage
    createdAt
    category
    amount
    currency
    payoutMethod
    user {
      id
      name
      username
      image
    }
  }
}
`;

export const addGetExpense = (component) => {
const accessToken = typeof window !== 'undefined' && window.localStorage.getItem('accessToken');

// if we don't have an accessToken, there is no need to get the details of a expense
// as we won't have access to any more information than the allExpenses query
if (!accessToken) return component;

return graphql(getExpenseQuery, {
  options(props) {
    return {
      variables: {
        id: props.expense.id
      }
    }
  }
})(component);
}


export default addGetExpense(injectIntl(ExpenseDetails));