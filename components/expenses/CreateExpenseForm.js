import React from 'react';
import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { get } from 'lodash';
import { titleCase } from 'title-case';

import { getCurrencySymbol } from '../../lib/utils';
import categories from '../../lib/constants/categories';
import expenseTypes from '../../lib/constants/expenseTypes';

import InputField from '../InputField';
import SignInOrJoinFree from '../SignInOrJoinFree';
import Button from '../Button';
import Container from '../Container';
import { P } from '../Text';
import DefinedTerm, { Terms } from '../DefinedTerm';

class CreateExpenseForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    onSubmit: PropTypes.func,
    intl: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    mode: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.getOptions = this.getOptions.bind(this);
    this.renderForm = this.renderForm.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.messages = defineMessages({
      paypal: {
        id: 'expense.payoutMethod.paypal',
        defaultMessage: 'PayPal ({paypalEmail, select, missing {missing} other {{paypalEmail}}})',
      },
      'newExpense.paypal.label': {
        id: 'newExpense.paypal.label',
        defaultMessage: 'Please provide address',
      },
      other: {
        id: 'expense.payoutMethod.manual',
        defaultMessage: 'Other (see instructions)',
      },
      'error.descriptionMissing': {
        id: 'expense.error.descriptionMissing',
        defaultMessage: 'Missing description',
      },
      'error.amountMissing': {
        id: 'expense.error.amountMissing',
        defaultMessage: 'Amount must be greater than 0',
      },
      'error.privateMessageMissing': {
        id: 'expense.error.privateMessageMissing',
        defaultMessage: "Please provide instructions on how you'd like to be reimbursed as a private note",
      },
      'error.paypalEmailMissing': {
        id: 'expense.error.paypalEmailMissing',
        defaultMessage: 'Please provide your PayPal email address (or change the payout method)',
      },
      'error.attachmentMissing': {
        id: 'expense.error.attachmentMissing',
        defaultMessage: 'Missing attachment',
      },
      'error.expenseTypeMissing': {
        id: 'expense.error.expenseTypeMissing',
        defaultMessage: 'Please pick the type of this expense',
      },
    });

    this.categoriesOptions = categories(props.collective.slug).map(category => {
      return { [category]: category };
    });

    this.expenseTypes = Object.entries(expenseTypes).map(([key, value]) => {
      return { [key]: titleCase(value) };
    });

    this.state = {
      modified: false,
      expense: {
        category: Object.keys(this.categoriesOptions[0])[0],
        type: expenseTypes.DEFAULT,
        payoutMethod: 'paypal',
        paypalEmail: (props.LoggedInUser && props.LoggedInUser.paypalEmail) || undefined,
      },
      isExpenseValid: false,
      loading: false,
    };
  }

  componentDidUpdate(prevProps) {
    const hasLoggedIn = !prevProps.LoggedInUser && this.props.LoggedInUser;
    if (hasLoggedIn && !this.state.expense.paypalEmail && this.props.LoggedInUser.paypalEmail) {
      this.handleChange('paypalEmail', this.props.LoggedInUser.paypalEmail);
    }
  }

  getOptions(arr, intlVars) {
    return arr.map(key => {
      const obj = {};
      obj[key] = this.props.intl.formatMessage(this.messages[key], intlVars);
      return obj;
    });
  }

  validate(expense) {
    const { intl } = this.props;
    if (!expense.description) {
      this.setState({
        error: intl.formatMessage(this.messages['error.descriptionMissing']),
      });
      return false;
    }
    if (!expense.amount > 0) {
      this.setState({
        error: intl.formatMessage(this.messages['error.amountMissing']),
      });
      return false;
    }
    if (!expense.attachment) {
      this.setState({
        error: intl.formatMessage(this.messages['error.attachmentMissing']),
      });
      return false;
    }
    if (expense.payoutMethod === 'other' && !expense.privateMessage) {
      this.setState({
        error: intl.formatMessage(this.messages['error.privateMessageMissing']),
      });
      return false;
    }
    if (expense.payoutMethod === 'paypal' && !expense.paypalEmail) {
      this.setState({
        error: intl.formatMessage(this.messages['error.paypalEmailMissing']),
      });
      return false;
    }
    if (expense.type === '' && !expense.type) {
      this.setState({
        error: intl.formatMessage(this.messages['error.expenseTypeMissing']),
      });
      return false;
    }
    this.setState({ error: null });
    return true;
  }

  handleChange(attr, value) {
    const expense = {
      ...this.state.expense,
      [attr]: value,
    };
    const newState = {
      modified: true,
      expense,
      isExpenseValid: this.validate(expense),
    };
    this.setState(newState);
    this.props.onChange && this.props.onChange(expense);
  }

  async onSubmit(e) {
    if (e) {
      e.preventDefault();
    }
    this.setState({
      loading: true,
    });

    try {
      await this.props.onSubmit(this.state.expense);
      this.setState({
        modified: false,
        isExpenseValid: false,
        expense: {},
        loading: false,
      });
    } catch (e) {
      // TODO: this should be reported to the user
      console.error('CreateExpenseForm > onSubmit > error', e);
      this.setState({ loading: false });
    }
    return false;
  }

  renderForm() {
    const { LoggedInUser, intl, collective } = this.props;
    const { expense } = this.state;

    const payoutMethodOptions = this.getOptions(['paypal', 'other'], {
      paypalEmail: get(expense, 'user.paypalEmail') || intl.formatMessage(this.messages['newExpense.paypal.label']),
    });

    return (
      <div className={`CreateExpenseForm ${this.props.mode}`}>
        <style jsx>
          {`
            .CreateExpenseForm {
              font-size: 1.2rem;
              overflow: hidden;
              padding: 0 2rem 5rem;
            }
            .disclaimer,
            .expensePolicy {
              font-size: 1.4rem;
              margin: 2rem 0;
            }
            .description {
              font-size: 1.4rem;
            }
            .CreateExpenseForm .frame {
              padding: 4px;
              margin-top: 1rem;
              margin-right: 1rem;
              float: left;
              width: 128px;
            }
            .CreateExpenseForm img {
              width: 100%;
            }
            .leftColumn,
            .rightColumn {
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
              white-space: nowrap;
            }
            .netAmountInCollectiveCurrency {
              font-weight: bold;
            }
            .error {
              display: flex;
              align-items: center;
              color: red;
              margin-left: 1rem;
            }
            @media (max-width: 600px) {
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
          `}
        </style>
        <style global jsx>
          {`
            .CreateExpenseForm .inputField {
              margin: 0;
            }

            .CreateExpenseForm .descriptionField {
              width: 50rem;
              max-width: 100%;
            }

            .CreateExpenseForm .amountField {
              max-width: 15rem;
            }

            .CreateExpenseForm .inputField textarea {
              font-size: 1.2rem;
            }

            .CreateExpenseForm .attachmentField {
              width: 128px;
            }

            .CreateExpenseForm .attachmentField .form-group {
              margin: 0;
            }

            .CreateExpenseForm .col.privateMessage {
              width: 100%;
            }

            @media (max-width: 600px) {
              .attachmentField {
                width: 90%;
              }
            }
          `}
        </style>

        <Container as="form" onSubmit={this.onSubmit} maxWidth={[500, null, 800]} mx="auto">
          {!collective.expensePolicy && LoggedInUser && LoggedInUser.canEditCollective(collective) && (
            <div className="expensePolicy">
              <h2>
                <FormattedMessage id="collective.expensePolicy.label" defaultMessage="Collective expense policy" />
              </h2>
              <p>
                <FormattedMessage
                  id="collective.expensePolicy.description"
                  defaultMessage="It can be daunting to file an expense if you're not sure what's allowed. Provide a clear policy to guide expense submitters."
                />
              </p>
              <Button className="blue" href={`/${collective.slug}/edit/expenses`}>
                <FormattedMessage id="expense.expensePolicy.add" defaultMessage="add an expense policy" />
              </Button>
            </div>
          )}
          {(collective.expensePolicy || get(collective, 'host.expensePolicy')) && (
            <div className="expensePolicy">
              <h2>
                <FormattedMessage id="expense.expensePolicy" defaultMessage="Fiscal Host expense policy" />
              </h2>
              {collective.expensePolicy && <Markdown source={collective.expensePolicy} />}
              {get(collective, 'host.expensePolicy') && <Markdown source={get(collective, 'host.expensePolicy')} />}
            </div>
          )}
          <div className="disclaimer">
            <FormattedMessage
              id="expense.disclaimer"
              defaultMessage="You must upload a valid receipt or invoice clearly showing the total amount, date, legal address, and what the payment is for."
            />
          </div>

          <div className="leftColumn">
            <div className="frame">
              <InputField
                type="dropzone"
                options={{ accept: 'image/jpeg, image/png, application/pdf' }}
                name="attachment"
                className="attachmentField"
                onChange={attachment => this.handleChange('attachment', attachment)}
                defaultValue={expense.attachment}
                placeholder={'/static/images/receipt.svg'}
                description={
                  <FormattedMessage
                    id="expense.attachment.description"
                    defaultMessage="Upload receipt or invoice (photo or PDF)"
                  />
                }
              />
            </div>
          </div>

          <div className="rightColumn">
            <div className="row">
              <div className="col large">
                <label>
                  <FormattedMessage id="Fields.description" defaultMessage="Description" />
                </label>
                <div className="description">
                  <span className="description">
                    <InputField
                      type="text"
                      name="description"
                      defaultValue={expense.description}
                      className="descriptionField"
                      maxLength={255}
                      onChange={description => this.handleChange('description', description)}
                    />
                  </span>
                </div>
              </div>
            </div>

            <div className="col">
              <label>
                <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
              </label>
              <div className="amountDetails">
                <span className="amount">
                  <InputField
                    defaultValue={expense.amount}
                    pre={getCurrencySymbol(collective.currency)}
                    type="currency"
                    name="amount"
                    className="amountField"
                    onChange={amount => this.handleChange('amount', amount)}
                  />
                </span>
              </div>
            </div>

            <div className="col incurredAt">
              <label>
                <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
              </label>
              <div className="incurredAt">
                <span className="incurredAt">
                  <InputField
                    defaultValue={new Date()}
                    type="date"
                    name="incurredAt"
                    className="incurredAtField"
                    onChange={incurredAt => this.handleChange('incurredAt', incurredAt)}
                  />
                </span>
              </div>
            </div>

            <div className="col">
              <label>
                <FormattedMessage id="expense.category" defaultMessage="category" />
              </label>
              <div className="category">
                <span className="category">
                  <InputField
                    type="select"
                    options={this.categoriesOptions}
                    defaultValue={expense.category}
                    name="category"
                    className="categoryField"
                    onChange={category => this.handleChange('category', category)}
                  />
                </span>
              </div>
            </div>

            <div className="col">
              <label>
                <DefinedTerm term={Terms.EXPENSE_TYPE} />
              </label>
              <div className="expenseType">
                <span className="expenseType">
                  <InputField
                    type="select"
                    options={this.expenseTypes}
                    defaultValue={expenseTypes.DEFAULT}
                    name="type"
                    className="expenseField"
                    onChange={expenseType => this.handleChange('type', expenseTypes[expenseType])}
                  />
                </span>
              </div>
            </div>

            <div className="col">
              <label>
                <FormattedMessage id="expense.payoutMethod" defaultMessage="payout method" />
              </label>
              <InputField
                type="select"
                name="payoutMethod"
                options={payoutMethodOptions}
                defaultValue={expense.payoutMethod}
                onChange={payoutMethod => this.handleChange('payoutMethod', payoutMethod)}
              />
            </div>

            {this.state.expense.payoutMethod === 'paypal' && (
              <div className="col emailInput">
                <label>
                  <FormattedMessage id="expense.payoutMethod.paypal.label" defaultMessage="PayPal address" />
                </label>
                <InputField
                  type="email"
                  name="paypalEmail"
                  key={`paypalEmail-${get(LoggedInUser, 'id')}`}
                  value={this.state.expense.paypalEmail}
                  onChange={paypalEmail => this.handleChange('paypalEmail', paypalEmail)}
                />
              </div>
            )}

            <div className="col privateMessage">
              <label>
                <FormattedMessage id="expense.privateMessage" defaultMessage="Private instructions" />
              </label>
              <InputField
                type="textarea"
                name="privateMessage"
                onChange={privateMessage => this.handleChange('privateMessage', privateMessage)}
                defaultValue={expense.privateMessage}
                description={
                  <FormattedMessage
                    id="expense.privateMessage.description"
                    defaultMessage="Private instructions for the host to reimburse your expense"
                  />
                }
              />
            </div>

            <div className="row">
              <div>
                <Button className="blue" type="submit" disabled={this.state.loading || !this.state.isExpenseValid}>
                  {this.state.loading && <FormattedMessage id="form.processing" defaultMessage="processing" />}
                  {!this.state.loading && <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />}
                </Button>
              </div>

              {this.state.error && <div className="error">{this.state.error}</div>}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  render() {
    const { LoggedInUser, collective } = this.props;

    if (!LoggedInUser) {
      return (
        <div className="CreateExpenseForm">
          <P textAlign="center" mt={4} fontSize="LeadParagraph" lineHeight="LeadParagraph">
            <FormattedMessage id="expenses.create.login" defaultMessage="Sign up or login to submit an expense." />
          </P>
          <SignInOrJoinFree />
        </div>
      );
    } else if (collective.isArchived) {
      return (
        <div className="CreateExpenseForm">
          <P textAlign="center" mt={4} fontSize="LeadParagraph" lineHeight="LeadParagraph">
            <FormattedMessage
              id="expenses.create.archived"
              defaultMessage="Cannot submit expenses for an archived collective."
            />
          </P>
        </div>
      );
    } else {
      return this.renderForm();
    }
  }
}

export default injectIntl(CreateExpenseForm);
