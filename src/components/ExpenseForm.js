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

class ExpenseForm extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.getOptions = this.getOptions.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 0, maximumFractionDigits: 2};

    this.messages = defineMessages({
      'paypal': { id: 'expense.payoutMethod.paypal', defaultMessage: 'PayPal ({paypalEmail})' },
      // 'manual': { id: 'expense.payoutMethod.donation', defaultMessage: 'Consider as donation' },
      'other': { id: 'expense.payoutMethod.manual', defaultMessage: 'Other (give instructions)' }
    });

    this.state = { expense: {} };

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
    this.setState({ expense })
    this.props.onChange && this.props.onChange(expense);
  }

  render() {
    const { LoggedInUser, data } = this.props;

    const defaultAttachmentImage = '/static/images/receipt.svg';
    const payoutMethod = this.state.expense.payoutMethod || expense.payoutMethod;
    const payoutMethods = this.getOptions(['paypal', 'other'], { paypalEmail: expense.user && expense.user.paypalEmail });
    const categoriesOptions = categories(expense.collective.slug).map(category => {
      return { [category]: category }
    });

    return (
        <div className={`ExpenseForm ${this.props.mode}`}>
        <style jsx>{`
          .ExpenseForm {
            font-size: 1.2rem;
            overflow: hidden;
            transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .ExpenseForm.summary {
            max-height: 0;
          }
          .ExpenseForm .frame {
            padding: 4px;
            margin-top: 1rem;
            margin-right: 1rem;
            float: left;
            background-color: #f3f4f5;
          }
          .ExpenseForm img {
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
            .ExpenseForm {
              max-height: 30rem;
            }
          }
        `}</style>
        <style global jsx>{`
          .ExpenseForm .inputField {
            margin: 0;
          }

          .ExpenseForm .descriptionField {
            width: 50rem;
            max-width: 100%;
          }

          .ExpenseForm .amountField {
            max-width: 15rem;
          }

          .ExpenseForm .inputField textarea {
            font-size: 1.2rem;
          }

          .ExpenseForm .attachmentField {
            width: 64px;
          }

          .ExpenseForm .attachmentField .form-group {
            margin: 0;
          }

          .ExpenseForm textarea[name="privateMessage"] {
            width: 47.5rem;
            max-width: 100%;
          }
        `}</style>

        <div className="leftColumn">
          <div className="frame">
            <InputField
              type="dropzone"
              name="attachment"
              className="attachmentField"
              onChange={attachment => this.handleChange('attachment', attachment)}
              defaultValue={defaultAttachmentImage}
              />
          </div>
        </div>

        <div className="rightColumn">
          <div className="row">
            <div className="col large">
              <label><FormattedMessage id='expense.description' defaultMessage='description' /></label>
              <div className="description">
                <span className="amount">
                  <InputField
                    type="text"
                    defaultValue={expense.description}
                    className="descriptionField"
                    onChange={description => this.handleChange('description', description)}
                    />
                </span>
              </div>
            </div>
          </div>

          <div className="col">
            <label><FormattedMessage id='expense.category' defaultMessage='category' /></label>
            <div className="category">
              <span className="amount">
                <InputField
                  type="select"
                  options={categoriesOptions}
                  defaultValue={expense.category}
                  className="categoryField"
                  onChange={category => this.handleChange('category', category)}
                  />
              </span>
            </div>
          </div>

          <div className="col">
            <label><FormattedMessage id='expense.amount' defaultMessage='amount' /></label>
            <div className="amountDetails">
              <span className="amount">
                <InputField
                  defaultValue={expense.amount}
                  pre={getCurrencySymbol(expense.currency)}
                  type='currency'
                  className="amountField"
                  onChange={amount => this.handleChange('amount', amount)}
                  />
              </span>
            </div>
          </div>

          <div className="col">
            <label><FormattedMessage id='expense.payoutMethod' defaultMessage='payout method' /></label>
            <InputField
              type="select"
              options={payoutMethods}
              defaultValue={expense.payoutMethod}
              onChange={payoutMethod => this.handleChange('payoutMethod', payoutMethod)}
              />
          </div>

          <div className="col">
            <label><FormattedMessage id='expense.privateMessage' defaultMessage='private note' /></label>
            <InputField
              type="textarea"
              name="privateMessage"
              onChange={privateMessage => this.handleChange('privateMessage', privateMessage)}
              defaultValue={expense.privateMessage}
              />
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


export default withIntl(ExpenseForm);
