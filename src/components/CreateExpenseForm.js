import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedNumber, FormattedMessage } from 'react-intl';
import { imagePreview, capitalize } from '../lib/utils';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import InputField from './InputField';
import { Button } from 'react-bootstrap';
import { getCurrencySymbol } from '../lib/utils';
import categories from '../constants/categories';
import { get } from 'lodash';

class CreateExpense extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    onSubmit: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.getOptions = this.getOptions.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.messages = defineMessages({
      'paypal': { id: 'expense.payoutMethod.paypal', defaultMessage: 'PayPal ({paypalEmail, select, missing {missing} other {{paypalEmail}}})' },
      'newExpense.paypal.label': { id: 'newExpense.paypal.label', defaultMessage: 'Please provide address' },
      'other': { id: 'expense.payoutMethod.manual', defaultMessage: 'Other (see instructions)' },
      'error.descriptionMissing': { id: 'expense.error.descriptionMissing', defaultMessage: 'Missing description' },
      'error.amountMissing': { id: 'expense.error.amountMissing', defaultMessage: 'Amount must be greater than 0' },
      'error.privateMessageMissing': { id: 'expense.error.privateMessageMissing', defaultMessage: `Please provide instructions on how you'd like to be reimbursed as a private note` },
      'error.emailMissing': { id: 'expense.error.emailMissing', defaultMessage: 'Please provide your email address' },
      'error.paypalEmailMissing': { id: 'expense.error.paypalEmailMissing', defaultMessage: 'Please provide your PayPal email address (or change the payout method)' },
      'error.attachmentMissing': { id: 'expense.error.attachmentMissing', defaultMessage: 'Missing attachment' }
    });

    this.categoriesOptions = categories(props.collective.slug).map(category => {
      return { [category]: category }
    });

    this.state = {
      modified: false,
      expense: {
        category: Object.keys(this.categoriesOptions[0])[0],
        payoutMethod: 'paypal'
      },
      isExpenseValid: false,
      loading: false
    };
 
  }

  getOptions(arr, intlVars) {
    return arr.map(key => { 
      const obj = {};
      obj[key] = this.props.intl.formatMessage(this.messages[key], intlVars);
      return obj;
    })
  }

  validate(expense) {
    const { intl, LoggedInUser } = this.props;
    if (!expense.description) {
      this.setState({ error: intl.formatMessage(this.messages['error.descriptionMissing'])});
      return false;
    }
    if (!expense.amount > 0) {
      this.setState({ error: intl.formatMessage(this.messages['error.amountMissing'])});
      return false;
    }
    if (!expense.attachment) {
      this.setState({ error: intl.formatMessage(this.messages['error.attachmentMissing'])});
      return false;
    }
    if (expense.payoutMethod === 'other' && !expense.privateMessage) {
      this.setState({ error: intl.formatMessage(this.messages['error.privateMessageMissing'])});
      return false;
    }
    if (expense.payoutMethod === 'paypal' && !expense.paypalEmail) {
      this.setState({ error: intl.formatMessage(this.messages['error.paypalEmailMissing'])});
      return false;
    }
    if (!LoggedInUser && !expense.email) {
      this.setState({ error: intl.formatMessage(this.messages['error.emailMissing'])});
      return false;
    }
    this.setState({ error: null });
    return true;
  }

  handleChange(attr, value) {
    const expense = {
      ...this.state.expense,
      [attr]: value
    };
    if (attr === 'paypalEmail' && !expense.email) {
      expense.email = value;
    }
    const newState = { modified: true, expense, isExpenseValid: this.validate(expense) };
    this.setState(newState)
    this.props.onChange && this.props.onChange(expense);
  }

  componentWillReceiveProps(newProps) {
    if (!this.props.LoggedInUser && newProps.LoggedInUser && !this.state.expense.paypalEmail) {
      this.handleChange('paypalEmail', newProps.LoggedInUser.paypalEmail);
    }
  }

  async onSubmit(e) {
    if (e) {
      e.preventDefault();
    }
    try {
      await this.props.onSubmit(this.state.expense);
      this.setState({ modified: false, isExpenseValid: false, expense: {}, loading: false });
    } catch (e) {
      this.setState({ loading: false });
      console.error("CreateExpenseForm onSubmit error", e);
    }
    return false;
  }

  render() {
    const { LoggedInUser, intl, collective } = this.props;
    const { expense } = this.state;

    const previewAttachmentImage = expense.attachment ? imagePreview(expense.attachment) : '/static/images/receipt.svg';
    const payoutMethod = this.state.expense.payoutMethod || expense.payoutMethod;
    const payoutMethods = this.getOptions(['paypal', 'other'], { paypalEmail: get(expense, 'user.paypalEmail') || intl.formatMessage(this.messages['newExpense.paypal.label']) });

    return (
        <div className={`CreateExpense ${this.props.mode}`}>
        <style jsx>{`
          .CreateExpense {
            font-size: 1.2rem;
            overflow: hidden;
            margin: 0 1rem 5rem 1rem;
          }
          .disclaimer {
            font-size: 1.4rem;
            margin: 2rem 0;
          }
          .description {
            font-size: 1.4rem;
          }
          .CreateExpense .frame {
            padding: 4px;
            margin-top: 1rem;
            margin-right: 1rem;
            float: left;
            width: 128px;
          }
          .CreateExpense img {
            width: 100%;
          }
          .leftColumn, .rightColumn {
            overflow: hidden;
          }
          .leftColumn {
            float: left;
            margin-right: 2rem;
            display: flex;
            flex-direction: column;
          }
          .col {
            float: left;
            display: flex;
            flex-direction: column;
            margin-right: 1rem;
            margin-top: 1rem;
          }
          .col.incurredAt {
            width: 12rem;
          }
          .col.emailInput {
            width: 25rem;
          }
          .row {
            clear: both;
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
          .error {
            color: red;
          }
          @media(max-width: 600px) {
            .leftColumn {
              float: none;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .attachment img {
              width: 90%;
            }
          }
        `}</style>
        <style global jsx>{`
          .CreateExpense .inputField {
            margin: 0;
          }

          .CreateExpense .descriptionField {
            width: 50rem;
            max-width: 100%;
          }

          .CreateExpense .amountField {
            max-width: 15rem;
          }

          .CreateExpense .inputField textarea {
            font-size: 1.2rem;
          }

          .CreateExpense .attachmentField {
            width: 128px;
          }

          .CreateExpense .attachmentField .form-group {
            margin: 0;
          }

          .CreateExpense .col.privateMessage {
            width: 100%;
          }

          .CreateExpense .help-block {
            font-size: 1.2rem;
          }

          @media(max-width: 600px) {
            .attachmentField {
              width: 90%;
            }
          }
        `}</style>

        <form onSubmit={this.onSubmit}>
          <div className="disclaimer">
            <FormattedMessage id="expense.disclaimer" defaultMessage="Please make sure to upload a valid receipt or invoice. We should be able to see clearly on the picture (or PDF) the total amount paid, the date, the items purchased and the legal address." />
          </div>

          <div className="leftColumn">
            <div className="frame">
              <InputField
                type="dropzone"
                options={{ accept: "image/jpeg, image/png, application/pdf" }}
                name="attachment"
                className="attachmentField"
                onChange={attachment => this.handleChange('attachment', attachment)}
                defaultValue={expense.attachment || '/static/images/receipt.svg'}
                description={<FormattedMessage id="expense.attachment.description" defaultMessage="Upload receipt (photo or PDF)" />}
                />
            </div>
          </div>

          <div className="rightColumn">
            <div className="row">
              <div className="col large">
                <label><FormattedMessage id='expense.description' defaultMessage='description' /></label>
                <div className="description">
                  <span className="description">
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
              <label><FormattedMessage id='expense.amount' defaultMessage='amount' /></label>
              <div className="amountDetails">
                <span className="amount">
                  <InputField
                    defaultValue={expense.amount}
                    pre={getCurrencySymbol(collective.currency)}
                    type='currency'
                    className="amountField"
                    onChange={amount => this.handleChange('amount', amount)}
                    />
                </span>
              </div>
            </div>

            <div className="col incurredAt">
              <label><FormattedMessage id='expense.incurredAt' defaultMessage='Date' /></label>
              <div className="incurredAt">
                <span className="incurredAt">
                  <InputField
                    defaultValue={new Date}
                    type='date'
                    className="incurredAtField"
                    onChange={incurredAt => this.handleChange('incurredAt', incurredAt)}
                    />
                </span>
              </div>
            </div>

            <div className="col">
              <label><FormattedMessage id='expense.category' defaultMessage='category' /></label>
              <div className="category">
                <span className="category">
                  <InputField
                    type="select"
                    options={this.categoriesOptions}
                    defaultValue={expense.category}
                    className="categoryField"
                    onChange={category => this.handleChange('category', category)}
                    />
                </span>
              </div>
            </div>

            <div className="col">
              <label><FormattedMessage id='expense.payoutMethod' defaultMessage='payout method' /></label>
              <InputField
                type="select"
                name="payoutMethod"
                options={payoutMethods}
                defaultValue={expense.payoutMethod}
                onChange={payoutMethod => this.handleChange('payoutMethod', payoutMethod)}
                />
            </div>

            { this.state.expense.payoutMethod === 'paypal' &&
              <div className="col emailInput">
                <label><FormattedMessage id='expense.payoutMethod.paypal.label' defaultMessage='PayPal address' /></label>
                <InputField
                  type="email"
                  name="paypalEmail"
                  key={`paypalEmail-${get(LoggedInUser, 'id')}`}
                  defaultValue={this.state.expense.paypalEmail}
                  onChange={paypalEmail => this.handleChange('paypalEmail', paypalEmail)}
                  />
              </div>
            }

            <div className="col privateMessage">
              <label>
                <FormattedMessage id='expense.privateMessage' defaultMessage='Private instructions' />
              </label>
              <InputField
                type="textarea"
                name="privateMessage"
                onChange={privateMessage => this.handleChange('privateMessage', privateMessage)}
                defaultValue={expense.privateMessage}
                description={<FormattedMessage id="expense.privateMessage.description" defaultMessage="Private instructions for the host to reimburse your expense" />}
                />
            </div>

            { !LoggedInUser &&
              <div className="col emailInput">
                <label><FormattedMessage id='expense.email.label' defaultMessage='Your email address' /></label>
                <InputField
                  type="email"
                  name="email"
                  key={`email-${this.state.expense.paypalEmail}`}
                  defaultValue={this.state.expense.paypalEmail}
                  onChange={email => this.handleChange('email', email)}
                  />
              </div>
            }

            <div className="row">
              <div className="col large">
                <Button bsStyle="primary" type="submit" ref="submit" disabled= {this.state.loading || !this.state.isExpenseValid} >
                  { this.state.loading && <FormattedMessage id="form.processing" defaultMessage="processing" /> }
                  { !this.state.loading && <FormattedMessage id="expense.new.submit" defaultMessage="Submit Expense" /> }
                </Button>
              </div>
            </div>

            <div className="row">
              <div className="col large">
                { this.state.error &&
                  <div className="error">
                    {this.state.error}
                  </div>
                }
              </div>
            </div>

          </div>
        </form>
      </div>
    );
  }
}

export default withIntl(CreateExpense);