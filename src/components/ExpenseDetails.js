import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedNumber, FormattedMessage } from 'react-intl';
import { imagePreview, capitalize } from '../lib/utils';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import InputField from './InputField';
import SmallButton from './SmallButton';
import { getCurrencySymbol } from '../lib/utils';
import categories from '../constants/categories';
import { get } from 'lodash';

class ExpenseDetails extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    expense: PropTypes.object,
    LoggedInUser: PropTypes.object,
    onChange: PropTypes.func,
    mode: PropTypes.string // summary, edit or details
  }

  constructor(props) {
    super(props);
    this.getOptions = this.getOptions.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 2, maximumFractionDigits: 2};

    this.messages = defineMessages({
      'paypal': { id: 'expense.payoutMethod.paypal', defaultMessage: 'PayPal ({paypalEmail, select, missing {missing} other {{paypalEmail}}})' },
      // 'manual': { id: 'expense.payoutMethod.donation', defaultMessage: 'Consider as donation' },
      'other': { id: 'expense.payoutMethod.manual', defaultMessage: 'Other (see instructions)' }
    });

    this.state = { modified: false, expense: {} };
 
  }

  getOptions(arr, intlVars) {
    return arr.map(key => { 
      const obj = {};
      obj[key] = this.props.intl.formatMessage(this.messages[key], intlVars);
      return obj;
    })
  }

  handleChange(attr, value) {
    const expense = {
      ...this.state.expense,
      [attr]: value
    };
    this.setState({ modified: true, expense })
    this.props.onChange && this.props.onChange(expense);
  }

  render() {
    const { LoggedInUser, data, intl } = this.props;

    const expense = (data && data.Expense) || this.props.expense;
    const canEditExpense = LoggedInUser && LoggedInUser.canEditExpense(expense);
    const isAuthor = LoggedInUser && LoggedInUser.collective.id === expense.fromCollective.id;
    const canEditAmount = expense.status !== 'PAID' || expense.payoutMethod !== 'paypal';
    const editMode = canEditExpense && this.props.mode === 'edit';
    const previewAttachmentImage = expense.attachment ? imagePreview(expense.attachment) : '/static/images/receipt.svg';
    const payoutMethod = this.state.expense.payoutMethod || expense.payoutMethod;
    const payoutMethods = this.getOptions(['paypal', 'other'], { paypalEmail: get(expense, 'user.paypalEmail') || "missing" });
    const categoriesOptions = categories(expense.collective.slug).map(category => {
      return { [category]: category }
    });

    return (
        <div className={`ExpenseDetails ${this.props.mode}`}>
        <style jsx>{`
          .ExpenseDetails {
            font-size: 1.2rem;
            overflow: hidden;
            transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .ExpenseDetails.summary {
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
          .leftColumn, .rightColumn {
            overflow: hidden;
          }
          .leftColumn {
            float: left;
          }
          .col {
            float: left;
            display: flex;
            flex-direction: column;
            margin-right: 1rem;
            margin-top: 1rem;
          }
          .row {
            margin-left: 0;
            margin-right: 0;
          }
          .row .col.large {
            width: 100%;
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
        <style global jsx>{`
          .ExpenseDetails .inputField {
            margin: 0;
          }

          .ExpenseDetails .descriptionField {
            width: 50rem;
            max-width: 100%;
          }

          .ExpenseDetails .amountField {
            max-width: 15rem;
          }

          .ExpenseDetails .inputField textarea {
            font-size: 1.2rem;
          }

          .ExpenseDetails .attachmentField {
            width: 64px;
          }

          .ExpenseDetails .attachmentField .form-group {
            margin: 0;
          }

          .ExpenseDetails textarea[name="privateMessage"] {
            width: 47.5rem;
            max-width: 100%;
          }
        `}</style>

        <div className="leftColumn">
          <div className="frame">
            { editMode &&
              <InputField
                type="dropzone"
                options={{ accept: "image/jpeg, image/png, application/pdf" }}
                name="attachment"
                className="attachmentField"
                onChange={attachment => this.handleChange('attachment', attachment)}
                defaultValue={expense.attachment || '/static/images/receipt.svg'}
                />
            }
            { !editMode && expense.attachment &&
              <a href={expense.attachment} target="_blank" title="Open receipt in a new window">
                <img src={previewAttachmentImage} />
              </a>
            }
            { !editMode && !expense.attachment &&
              <img src={previewAttachmentImage} />
            }
          </div>
        </div>

        <div className="rightColumn">
          { editMode &&
            <div className="row">
              <div className="col large">
                <label><FormattedMessage id='expense.description' defaultMessage='description' /></label>
                <div className="description">
                  <span className="description">
                    <InputField
                      type="text"
                      value={expense.description}
                      className="descriptionField"
                      onChange={description => this.handleChange('description', description)}
                      />
                  </span>
                </div>
              </div>
            </div>
          }

          { editMode &&
            <div className="col">
              <label><FormattedMessage id='expense.category' defaultMessage='category' /></label>
              <div className="category">
                <span className="category">
                  <InputField
                    type="select"
                    options={categoriesOptions}
                    value={expense.category}
                    className="categoryField"
                    onChange={category => this.handleChange('category', category)}
                    />
                </span>
              </div>
            </div>
          }

          <div className="col">
            <label><FormattedMessage id='expense.amount' defaultMessage='amount' /></label>
            <div className="amountDetails">
              <span className="amount">
                { editMode && canEditAmount &&
                  <InputField
                    value={expense.amount}
                    pre={getCurrencySymbol(expense.currency)}
                    type='currency'
                    className="amountField"
                    onChange={amount => this.handleChange('amount', amount)}
                    />
                }
                { !(editMode && canEditAmount) &&
                  <FormattedNumber
                    value={expense.amount / 100}
                    currency={expense.currency}
                    {...this.currencyStyle}
                    />
                }
              </span>
            </div>
          </div>

          <div className="col">
            <label><FormattedMessage id='expense.payoutMethod' defaultMessage='payout method' /></label>
            { !editMode && capitalize(intl.formatMessage(this.messages[expense.payoutMethod], { paypalEmail: get(expense, 'user.paypalEmail') || "missing"}))}
            { editMode &&
              <InputField
                type="select"
                options={payoutMethods}
                value={expense.payoutMethod}
                onChange={payoutMethod => this.handleChange('payoutMethod', payoutMethod)}
                />
            }
          </div>

          { (expense.privateMessage || ((isAuthor || canEditExpense) && payoutMethod === 'other')) &&
            <div className="col">
              <label><FormattedMessage id='expense.privateMessage' defaultMessage='private note' /></label>
              { (!editMode || !isAuthor) && capitalize(expense.privateMessage)}
              { editMode && (isAuthor || canEditExpense) &&
                <InputField
                  type="textarea"
                  name="privateMessage"
                  onChange={privateMessage => this.handleChange('privateMessage', privateMessage)}
                  defaultValue={expense.privateMessage}
                  />
              }
            </div>
          }
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
    createdAt
    category
    amount
    currency
    attachment
    payoutMethod
    privateMessage
    collective {
      id
      slug
      host {
        id
        slug
      }
    }
    fromCollective {
      id
    }
    user {
      id
      name
      username
      image
      paypalEmail
    }
  }
}
`;

export const addGetExpense = (component) => {
const accessToken = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('accessToken');

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


export default addGetExpense(withIntl(ExpenseDetails));