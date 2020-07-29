import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { cloneDeep, get, omit, pick, set, uniq } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import categories from '../../lib/constants/categories';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency-utils';
import { formatErrorMessage } from '../../lib/errors';
import { imagePreview } from '../../lib/image-utils';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../../lib/local-storage';

import InputField from '../../components/InputField';

import DefinedTerm, { Terms } from '../DefinedTerm';
import { Box, Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import StyledSpinner from '../StyledSpinner';

import ExpenseInvoiceDownloadHelper from './ExpenseInvoiceDownloadHelper';
import ExpenseNotesForm from './ExpenseNotesForm';
import PayoutMethodData from './PayoutMethodData';
import PayoutMethodTypeWithIcon from './PayoutMethodTypeWithIcon';
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
        id: 'Donation',
        defaultMessage: 'Donation',
      },
      banktransfer: {
        id: 'expense.payoutMethod.banktransfer',
        defaultMessage: 'Bank Transfer',
      },
      expenseTypeReceipt: {
        id: 'Expense.Type.Receipt',
        defaultMessage: 'Receipt',
      },
      expenseTypeInvoice: {
        id: 'Expense.Type.Invoice',
        defaultMessage: 'Invoice',
      },
      attachedFile: {
        id: 'Expense.OpenAttachedFile',
        defaultMessage: 'Open attached file in a new window',
      },
    });

    this.state = { modified: [], expense: this.getExpenseFromProps(props) };
  }

  componentDidMount() {
    this.setState({ expense: this.getExpenseFromProps(this.props) });
  }

  componentDidUpdate(oldProps) {
    const oldExpense = this.getExpenseFromProps(oldProps);
    const newExpense = this.getExpenseFromProps(this.props);
    if (oldExpense !== newExpense) {
      this.setState({ expense: newExpense });
    }
  }

  getOptions(arr, intlVars) {
    return arr.map(key => {
      const obj = {};
      obj[key] = this.props.intl.formatMessage(this.messages[key], intlVars);
      return obj;
    });
  }

  handleChange(attr, value) {
    this.setState(state => {
      const expense = cloneDeep(state.expense);
      set(expense, attr, value);
      const rootField = attr.split(/[[.]/)[0];
      const modified = uniq([...state.modified, rootField]);
      const expenseChangeset = pick(expense, [...modified, 'id']);
      if (expenseChangeset.items) {
        expenseChangeset.items = expenseChangeset.items.map(a => omit(a, ['__typename']));
      }
      this.props.onChange && this.props.onChange(expenseChangeset);
      return { modified, expense };
    });
  }

  getAttachmentPreview = attachmentUrl => {
    return attachmentUrl ? imagePreview(attachmentUrl) : '/static/images/receipt.svg';
  };

  getAttachmentTitle = (expense, attachment) => {
    if (!attachment.description) {
      return 'Open receipt in a new window';
    }

    return `${attachment.description} - ${formatCurrency(attachment.amount, expense.currency)}`;
  };

  getExpenseFromProps(props) {
    // Always prefer locally fetched data
    return props.data?.expense || props.expense;
  }

  render() {
    const { LoggedInUser, intl } = this.props;
    const expense = this.getExpenseFromProps(this.props);
    const canEditExpense = LoggedInUser && LoggedInUser.canEditExpense(expense);
    const isAuthor = LoggedInUser && LoggedInUser.collective.id === expense.fromCollective.id;
    const canEditAmount = expense.status !== 'PAID' || expense.payoutMethod !== 'paypal';
    const editMode = canEditExpense && this.props.mode === 'edit';
    const payoutMethod =
      get(expense, 'PayoutMethod.type') === 'BANK_ACCOUNT'
        ? 'banktransfer'
        : this.state.expense.payoutMethod || expense.payoutMethod;
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
    const expenseTypesOptions = [
      { [expenseTypes.DEFAULT]: '' },
      { [expenseTypes.RECEIPT]: intl.formatMessage(this.messages.expenseTypeReceipt) },
      { [expenseTypes.INVOICE]: intl.formatMessage(this.messages.expenseTypeInvoice) },
    ];
    const itemsWithFiles = expense.items?.filter(item => Boolean(item.url)) || [];
    const canDownloadAttachments =
      isAuthor ||
      LoggedInUser?.canEditCollective(expense.collective) ||
      LoggedInUser?.canEditCollective(expense.collective?.host);

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
              margin-top: 0.5rem;
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
        <Flex flexWrap="wrap">
          {editMode && (
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

          {editMode && canEditAmount && (
            <Box mt={2} mr={2}>
              <label>
                <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
              </label>
              <div className="amountDetails">
                <span className="amount">
                  <InputField
                    name="amount"
                    defaultValue={expense.amount}
                    pre={getCurrencySymbol(expense.currency)}
                    type="currency"
                    className="amountField"
                    onChange={amount => this.handleChange('amount', amount)}
                  />
                </span>
              </div>
            </Box>
          )}

          {(!editMode || payoutMethod !== 'banktransfer') && (
            <Box mt={2} mr={2}>
              <label>
                <FormattedMessage id="expense.payoutMethod" defaultMessage="payout method" />
              </label>
              {!editMode ? (
                <div>
                  <Box mb={2}>
                    <PayoutMethodTypeWithIcon type={expense.PayoutMethod?.type} fontSize="12px" iconSize={14} />
                  </Box>
                  <PayoutMethodData payoutMethod={expense.PayoutMethod} showLabel={false} />
                </div>
              ) : (
                <InputField
                  name="payoutMethod"
                  type="select"
                  options={payoutMethodOptions}
                  defaultValue={payoutMethod}
                  onChange={payoutMethod => this.handleChange('payoutMethod', payoutMethod)}
                />
              )}
            </Box>
          )}

          {(expense.privateMessage || ((isAuthor || canEditExpense) && payoutMethod === 'other')) && (
            <div className="col large privateMessage">
              <label>
                <FormattedMessage id="expense.privateNote" defaultMessage="private note" />
              </label>
              {!editMode ? (
                <HTMLContent content={expense.privateMessage} fontSize="12px" />
              ) : (
                <Box mb={2}>
                  <ExpenseNotesForm
                    hideLabel
                    onChange={e => this.handleChange('privateMessage', e.target.value)}
                    defaultValue={expense.privateMessage}
                  />
                </Box>
              )}
            </div>
          )}
        </Flex>
        {canDownloadAttachments && (
          <Box mt={2}>
            <label>
              <FormattedMessage id="Expense.Attachments" defaultMessage="Attachments" />
            </label>
            {expense.type === expenseTypes.INVOICE && itemsWithFiles.length === 0 && (
              <ExpenseInvoiceDownloadHelper
                collective={expense.collective}
                expense={{ ...expense, id: expense.idV2, legacyId: expense.id }}
              >
                {({ downloadInvoice, error, isLoading, filename }) => (
                  <div>
                    {error && (
                      <MessageBox type="error" withIcon>
                        {formatErrorMessage(intl, error)}
                      </MessageBox>
                    )}
                    <div className="frame">
                      <StyledButton asLink title={filename} onClick={downloadInvoice}>
                        {isLoading ? <StyledSpinner size={64} /> : <img src={this.getAttachmentPreview()} />}
                      </StyledButton>
                    </div>
                  </div>
                )}
              </ExpenseInvoiceDownloadHelper>
            )}
            {itemsWithFiles.map((attachment, idx) => (
              <div key={attachment.id}>
                <div className="frame">
                  {editMode && (
                    <InputField
                      type="dropzone"
                      options={{ accept: 'image/jpeg, image/png, application/pdf', canRemove: false }}
                      name={`attachment-${attachment.id}`}
                      className="attachmentField"
                      onChange={attachment => this.handleChange(`items[${idx}].url`, attachment)}
                      defaultValue={attachment.url || '/static/images/receipt.svg'}
                    />
                  )}
                  {!editMode && attachment.url && (
                    <StyledLink href={attachment.url} openInNewTab title={this.getAttachmentTitle(expense, attachment)}>
                      <img src={this.getAttachmentPreview(attachment.url)} />
                    </StyledLink>
                  )}
                  {!editMode && !attachment.url && <img src={this.getAttachmentPreview(attachment.url)} />}
                </div>
              </div>
            ))}
            {((!editMode && expense.attachedFiles) || []).map(attachment => (
              <div key={attachment.id}>
                <div className="frame">
                  {attachment.url ? (
                    <StyledLink
                      href={attachment.url}
                      openInNewTab
                      title={intl.formatMessage(this.messages.attachedFile)}
                    >
                      <img src={this.getAttachmentPreview(attachment.url)} />
                    </StyledLink>
                  ) : (
                    <img src={this.getAttachmentPreview(attachment.url)} />
                  )}
                </div>
              </div>
            ))}
          </Box>
        )}

        <div>
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

const expenseQuery = gql`
  query Expense($id: Int!) {
    Expense(id: $id) {
      id
      idV2
      description
      createdAt
      category
      amount
      status
      currency
      attachment
      items {
        id
        url
        description
        amount
      }
      attachedFiles {
        id
        url
      }
      payoutMethod
      PayoutMethod {
        id
        type
        data
      }
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

export const addExpenseData = component => {
  const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

  // if we don't have an accessToken, there is no need to get the details of a expense
  // as we won't have access to any more information than the allExpenses query
  if (!accessToken) {
    return component;
  }

  return graphql(expenseQuery, {
    options: props => ({
      variables: {
        id: props.expense.id,
      },
    }),
  })(component);
};

export default addExpenseData(injectIntl(ExpenseDetails));
