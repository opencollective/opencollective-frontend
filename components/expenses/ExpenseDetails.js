import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { defineMessages, FormattedNumber, FormattedMessage, injectIntl } from 'react-intl';
import { graphql } from 'react-apollo';
import { get } from 'lodash';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../../lib/local-storage';
import { capitalize, getCurrencySymbol, imagePreview } from '../../lib/utils';
import InputField from '../../components/InputField';
import categories from '../../lib/constants/categories';
import DefinedTerm, { Terms } from '../DefinedTerm';
import { titleCase } from 'title-case';

import TransactionDetails from './TransactionDetails';

class ExpenseDetails extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    expense: PropTypes.object,
    LoggedInUser: PropTypes.object,
    onChange: PropTypes.func,
    mode: PropTypes.string, // summary, edit or details
    intl: PropTypes.object.isRequired,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.getOptions = this.getOptions.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.currencyStyle = {
      style: 'currency',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    this.messages = defineMessages({
      paypal: {
        id: 'expense.payoutMethod.paypal.hidden',
        defaultMessage: 'PayPal ({paypalEmail, select, missing {missing} hidden {hidden} other {{paypalEmail}}})',
      },
      other: {
        id: 'expense.payoutMethod.manual',
        defaultMessage: 'Other (see instructions)',
      },
      donation: {
        id: 'expense.payoutMethod.donation',
        defaultMessage: 'Donation',
      },
    });

    this.state = { modified: false, expense: {} };
  }

  getOptions(arr, intlVars) {
    return arr.map(key => {
      const obj = {};
      obj[key] = this.props.intl.formatMessage(this.messages[key], intlVars);
      return obj;
    });
  }

  handleChange(attr, value) {
    const expense = {
      ...this.state.expense,
      [attr]: value,
    };
    this.setState({ modified: true, expense });
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
    const paypalEmail = get(expense, 'user.paypalEmail') || get(expense, 'user.email');
    // Don't display "donation" unless it's the current payoutMethod (phasing out)
    const payoutMethods = expense.payoutMethod === 'donation' ? ['paypal', 'other', 'donation'] : ['paypal', 'other'];
    const payoutMethodOptions = this.getOptions(payoutMethods, {
      paypalEmail: paypalEmail || (canEditExpense ? 'missing' : 'hidden'),
    });
    const categoriesOptions = categories(expense.collective.slug).map(category => {
      return { [category]: category };
    });
    const expenseTypes = { DEFAULT: '', INVOICE: 'INVOICE', RECEIPT: 'RECEIPT' };
    this.state.expense = { type: expense.type, ...this.state.expense };
    // Delete default type if expense is receipt or invoice.
    if (this.state.expense['type'] === 'RECEIPT' || this.state.expense['type'] === 'INVOICE') {
      delete expenseTypes['DEFAULT'];
    }
    const expenseTypesOptions = Object.entries(expenseTypes).map(([key, value]) => {
      return { [key]: titleCase(value) };
    });

    return (
      <div className={`ExpenseDetails ${this.props.mode}`}>
        <style jsx>
          {`
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
            .leftColumn,
            .rightColumn {
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
              white-space: nowrap;
            }
            .netAmountInCollectiveCurrency {
              font-weight: bold;
            }
            @media (max-width: 600px) {
              .ExpenseDetails {
                max-height: 30rem;
              }
            }
          `}
        </style>
        <style global jsx>
          {`
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

            .col.large {
              width: 100%;
            }

            .privateMessage {
              white-space: pre-line;
            }
          `}
        </style>

        <div className="leftColumn">
          <div className="frame">
            {editMode && (
              <InputField
                type="dropzone"
                options={{ accept: 'image/jpeg, image/png, application/pdf' }}
                name="attachment"
                className="attachmentField"
                onChange={attachment => this.handleChange('attachment', attachment)}
                defaultValue={expense.attachment || '/static/images/receipt.svg'}
              />
            )}
            {!editMode && expense.attachment && (
              <a
                href={expense.attachment}
                target="_blank"
                rel="noopener noreferrer"
                title="Open receipt in a new window"
              >
                <img src={previewAttachmentImage} />
              </a>
            )}
            {!editMode && !expense.attachment && <img src={previewAttachmentImage} />}
          </div>
        </div>

        <div className="rightColumn">
          {editMode && (
            <div className="row">
              <div className="col large">
                <label>
                  <FormattedMessage id="expense.description" defaultMessage="description" />
                </label>
                <div className="description">
                  <span className="description">
                    <InputField
                      type="text"
                      name="description"
                      defaultValue={expense.description}
                      className="descriptionField"
                      onChange={description => this.handleChange('description', description)}
                    />
                  </span>
                </div>
              </div>
            </div>
          )}

          {editMode && (
            <div className="col">
              <label>
                <FormattedMessage id="expense.category" defaultMessage="category" />
              </label>
              <div className="category">
                <span className="category">
                  <InputField
                    type="select"
                    name="category"
                    options={categoriesOptions}
                    defaultValue={expense.category}
                    className="categoryField"
                    onChange={category => this.handleChange('category', category)}
                  />
                </span>
              </div>
            </div>
          )}

          {editMode && (
            <div className="col">
              <label>
                <DefinedTerm term={Terms.EXPENSE_TYPE} />
              </label>
              <div className="expenseType">
                <span className="expenseType">
                  <InputField
                    type="select"
                    options={expenseTypesOptions}
                    defaultValue={expense.type}
                    name="type"
                    className="expenseField"
                    onChange={expenseType => this.handleChange('type', expenseTypes[expenseType])}
                  />
                </span>
              </div>
            </div>
          )}

          <div className="col">
            <label>
              <FormattedMessage id="expense.amount" defaultMessage="amount" />
            </label>
            <div className="amountDetails">
              <span className="amount">
                {editMode && canEditAmount && (
                  <InputField
                    name="amount"
                    defaultValue={expense.amount}
                    pre={getCurrencySymbol(expense.currency)}
                    type="currency"
                    className="amountField"
                    onChange={amount => this.handleChange('amount', amount)}
                  />
                )}
                {!(editMode && canEditAmount) && (
                  <FormattedNumber value={expense.amount / 100} currency={expense.currency} {...this.currencyStyle} />
                )}
              </span>
            </div>
          </div>

          <div className="col">
            <label>
              <FormattedMessage id="expense.payoutMethod" defaultMessage="payout method" />
            </label>
            {!editMode &&
              capitalize(
                intl.formatMessage(this.messages[expense.payoutMethod], {
                  paypalEmail: paypalEmail || (canEditExpense ? 'missing' : 'hidden'),
                }),
              )}
            {editMode && (
              <InputField
                name="payoutMethod"
                type="select"
                options={payoutMethodOptions}
                defaultValue={expense.payoutMethod}
                onChange={payoutMethod => this.handleChange('payoutMethod', payoutMethod)}
              />
            )}
          </div>

          {(expense.privateMessage || ((isAuthor || canEditExpense) && payoutMethod === 'other')) && (
            <div className="col large privateMessage">
              <label>
                <FormattedMessage id="expense.privateNote" defaultMessage="private note" />
              </label>
              {(!editMode || !isAuthor) && capitalize(expense.privateMessage)}
              {editMode && (isAuthor || canEditExpense) && (
                <InputField
                  type="textarea"
                  name="privateMessage"
                  onChange={privateMessage => this.handleChange('privateMessage', privateMessage)}
                  defaultValue={expense.privateMessage}
                />
              )}
            </div>
          )}

          {expense.transaction && (
            <TransactionDetails
              className="col large"
              {...expense.transaction}
              collective={expense.collective}
              host={expense.collective.host}
            />
          )}
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
      status
      currency
      attachment
      payoutMethod
      type
      privateMessage
      collective {
        id
        slug
        name
        type
        host {
          id
          slug
        }
      }
      fromCollective {
        id
      }
      transaction {
        id
        type
        amount
        currency
        hostCurrency
        hostCurrencyFxRate
        netAmountInCollectiveCurrency
        platformFeeInHostCurrency
        paymentProcessorFeeInHostCurrency
        hostFeeInHostCurrency
      }
      user {
        id
        name
        username
        paypalEmail
        email
        image
      }
    }
  }
`;

export const addGetExpense = component => {
  const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

  // if we don't have an accessToken, there is no need to get the details of a expense
  // as we won't have access to any more information than the allExpenses query
  if (!accessToken) return component;

  return graphql(getExpenseQuery, {
    options(props) {
      return {
        variables: {
          id: props.expense.id,
        },
      };
    },
  })(component);
};

export default addGetExpense(injectIntl(ExpenseDetails));
