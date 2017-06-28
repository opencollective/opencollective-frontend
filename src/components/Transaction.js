import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedDate, FormattedMessage } from 'react-intl';
import { imagePreview, formatCurrency, capitalize } from '../lib/utils';
import { pickAvatar } from '../lib/user.lib';

class Transaction extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    transaction: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.state = { view: 'compact' };
    this.toggleDetails = this.toggleDetails.bind(this);
    this.messages = defineMessages({
      'expense.type': { id: 'transaction.expense.type', defaultMessage: 'expense' },
      'expense.madeBy': { id: 'transaction.expense.madeBy', defaultMessage: 'submitted by' },
      'donation.type': { id: 'transaction.donation.type', defaultMessage: 'donation' },
      'donation.madeBy': { id: 'transaction.donation.madeBy', defaultMessage: 'made by' },
      'hostFeeInTxnCurrency': { id: 'transaction.hostFeeInTxnCurrency', defaultMessage: 'host fee' },
      'platformFeeInTxnCurrency': { id: 'transaction.platformFeeInTxnCurrency', defaultMessage: 'Open Collective fee' },
      'paymentProcessorFeeInTxnCurrency': { id: 'transaction.paymentProcessorFeeInTxnCurrency', defaultMessage: 'payment processor fee' }
    });    
  }

  toggleDetails() {
    this.setState({view: this.state.view === 'details' ? 'compact' : 'details'})
  }

  render() {
    const { intl, collective, transaction } = this.props;

    const type = transaction.type.toLowerCase();

    const meta = [];
    meta.push(transaction.category);
    meta.push(intl.formatMessage(this.messages[`${type}.type`]))
    meta.push(intl.formatMessage(this.messages[`${type}.madeBy`]));
    meta.push(transaction.user.name);
    meta.push(intl.formatDate(transaction.createdAt, { day: 'numeric', month: 'long' }));

    const amountDetails = [formatCurrency(transaction.amount, collective.currency)];
    const addFees = (feesArray) => {
      feesArray.forEach(feeName => {
        if (transaction[feeName]) {
          amountDetails.push(`${formatCurrency(transaction[feeName], transaction.currency)} (${intl.formatMessage(this.messages[feeName])})`);
        }
      })
    }

    addFees(['hostFeeInTxnCurrency', 'platformFeeInTxnCurrency', 'paymentProcessorFeeInTxnCurrency']);

    const amountDetailsStr = amountDetails.join(' - ')

    return (
      <div className={`transaction ${type} ${this.state.view}View`}>
        <style jsx>{`
          .transaction {
            width: 100%;
            height: 6rem;
            margin: 0.5em 0;
            padding: 0.5em;
            transition: height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            overflow: hidden;
          }
          .transaction.detailsView {
            background-color: #fafafa;
            height: 18rem;
          }
          .summary {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            height: 6rem;
          }
          a {
            cursor: pointer;
          }
          .details {
            padding-left: 50px;
            display: flex;
            flex-direction: row;
            font-size: 11px;
            overflow: hidden;
          }
          .details .frame {
            padding: 4px;
            background-color: #f3f4f5;
          }
          .details img {
            width: 64px;
          }
          .details .col {
            display: flex;
            flex-direction: column;         
            margin: 0.5rem;   
          }
          .details label {
            text-transform: uppercase;
            color: #aaaeb3;
            font-weight: bold;
            font-family: Lato, Montserrat, Arial;
            white-space: nowrap;
          }
          .user {
            width: 6rem;
          }
          .user img {
            border-radius: 50%;
            width: 40px;
            height: 40px;
            border: 1px solid #d4d7d9;
            padding: 4px;
          }
          .body {
            width: 100%;
          }
          .meta {
            color: #919599;
            font-size: 1.2rem;
          }
          .amount {
            width: 10rem;
            text-align: right;
            font-family: Montserrat;
            font-size: 1.6rem;
            font-weight: 300;
          }
          .expense .amount {
            color: #e21a60;
          }
          .donation .amount {
            color: #72ce00;
          }
          .netAmountInGroupCurrency {
            font-weight: bold;
          }
        `}</style>
        <div className="summary">
          <div className="user">
            <img src={imagePreview(transaction.user.avatar,pickAvatar(transaction.user.id), { width: 80 })} />
          </div>
          <div className="body">
          <a href={`/${collective.slug}/transactions/${transaction.uuid}`}>{transaction.title}</a>
          <div className="meta">
            {capitalize(meta.join(' ').trim())}
            <span> | <a onClick={this.toggleDetails}>{this.state.view === 'details' ? 'Close Details' : 'View Details'}</a></span>
          </div>
          </div>
          <div className="amount">
            {formatCurrency(transaction.amount, transaction.currency)}
          </div>
        </div>
        <div className={`details ${this.state.view !== 'details' && 'closed'}`}>
          {type === 'expense' &&
            <div className="frame">
              {transaction.attachment &&
                <a href={transaction.attachment} target="_blank" title="Open receipt in a new window">
                  <img src={imagePreview(transaction.attachment)} />
                </a>
              }
              {!transaction.attachment &&
                <img src={'/static/images/receipt.svg'} />
              }
            </div>
          }
          <div className="col">
            <label>Host</label>
            {transaction.host.name}
          </div>
          <div className="col">
            <label>Payment method</label>
            {transaction.paymentMethod.name}
          </div>
          <div className="col">
            <label>Amount</label>
            <div className="amountDetails">
              <span>{amountDetailsStr}</span>
              <span className="netAmountInGroupCurrency">{` = ${formatCurrency(transaction.netAmountInGroupCurrency, transaction.currency)}`}</span>
            </div>
          </div>
        </div>
      
      </div>
    );
  }
}

export default injectIntl(Transaction);