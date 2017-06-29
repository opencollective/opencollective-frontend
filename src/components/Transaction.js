import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedNumber, FormattedMessage } from 'react-intl';
import { imagePreview, capitalize } from '../lib/utils';
import { pickAvatar } from '../lib/user.lib';
import { get } from 'lodash';

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
      'expense': { id: 'transaction.expense', defaultMessage: 'expense' },
      'donation': { id: 'transaction.donation', defaultMessage: 'donation' },
      'donation.title': { id: 'transaction.donation.title', defaultMessage: '{interval, select, month {monthly} year {yearly} other {}} donation to {collective}' },
      'expense.meta': { id: 'transaction.expense.meta', defaultMessage: 'Expense submitted by {name}, paid on {createdAt, date, medium}' },
      'donation.meta': { id: 'transaction.donation.meta', defaultMessage: 'Donation made by {name} on {createdAt, date, medium}' },
      'closeDetails': { id: 'transaction.closeDetails', defaultMessage: 'Close Details' },
      'viewDetails': { id: 'transaction.viewDetails', defaultMessage: 'View Details' },
      'hostFeeInTxnCurrency': { id: 'transaction.hostFeeInTxnCurrency', defaultMessage: 'host fee' },
      'platformFeeInTxnCurrency': { id: 'transaction.platformFeeInTxnCurrency', defaultMessage: 'Open Collective fee' },
      'paymentProcessorFeeInTxnCurrency': { id: 'transaction.paymentProcessorFeeInTxnCurrency', defaultMessage: 'payment processor fee' }
    });
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 0, maximumFractionDigits: 2};
  }

  toggleDetails() {
    this.setState({view: this.state.view === 'details' ? 'compact' : 'details'})
  }

  render() {
    const { intl, collective, transaction } = this.props;

    const type = transaction.type.toLowerCase();

    const meta = [];
    meta.push(transaction.category);
    meta.push(intl.formatMessage(this.messages[`${type}.meta`], { name: transaction.user.name, createdAt: new Date(transaction.createdAt) }));

    const amountDetails = [intl.formatNumber(transaction.amount / 100, { currency: collective.currency, ...this.currencyStyle})];
    const addFees = (feesArray) => {
      feesArray.forEach(feeName => {
        if (transaction[feeName]) {
          amountDetails.push(`${intl.formatNumber(transaction[feeName] / 100, { currency: transaction.currency, ...this.currencyStyle})} (${intl.formatMessage(this.messages[feeName])})`);
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
            margin: 0.5em 0;
            padding: 0.5em;
            transition: max-height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            overflow: hidden;
            max-height: 6rem;
          }
          .transaction.detailsView {
            background-color: #fafafa;
            max-height: 20rem;
          }
          a {
            cursor: pointer;
          }
          .details {
            font-size: 1.2rem;
            overflow: hidden;
            transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            max-height: 15rem;
          }
          .details.closed {
            max-height: 0;
          }
          .details .frame {
            padding: 4px;
            margin-top: 1rem;
            margin-right: 1rem;
            float: left;
            background-color: #f3f4f5;
          }
          .details img {
            width: 64px;
          }
          .details .col {
            float: left;
            display: flex;
            flex-direction: column;         
            margin-right: 1rem;
            margin-top: 1rem;
          }
          .details label {
            text-transform: uppercase;
            color: #aaaeb3;
            font-weight: bold;
            font-family: Lato, Montserrat, Arial;
            white-space: nowrap;
          }
          .user {
            float: left;
            margin-right: 1rem;
          }
          .user img {
            border-radius: 50%;
            width: 40px;
            height: 40px;
            border: 1px solid #d4d7d9;
            padding: 4px;
          }
          .body {
            overflow: hidden;
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
            float:right;
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

          @media(max-width: 600px) {
            .transaction {
              max-height: 13rem;
            }
            .transaction.detailsView {
              max-height: 45rem;
            }
            .details {
              max-height: 30rem;
            }
          }
        `}</style>
        <div className="amount">
          <FormattedNumber
            value={transaction.amount / 100}
            currency={transaction.currency}
            {...this.currencyStyle}
            />
        </div>
        <div className="user">
          <img src={imagePreview(transaction.user.avatar,pickAvatar(transaction.user.id), { width: 80 })} />
        </div>
        <div className="body">
        <a onClick={this.toggleDetails}>{/* should link to `/${collective.slug}/transactions/${transaction.uuid}` once we have a page for it */}
          {type === 'expense' && transaction.title}
          {type === 'donation' && capitalize(intl.formatMessage(this.messages['donation.title'], {collective: collective.name, interval: get(transaction, 'subscription.interval')}))}
        </a>
          <div className="meta">
            {capitalize(meta.join(' '))}
            <span> | <a onClick={this.toggleDetails}>{intl.formatMessage(this.messages[`${this.state.view === 'details' ? 'closeDetails' : 'viewDetails'}`])}</a></span>
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
              <label><FormattedMessage id='transaction.host' defaultMessage='host' /></label>
              {transaction.host.name}
            </div>
            <div className="col">
              <label><FormattedMessage id='transaction.paymentMethod' defaultMessage='payment method' /></label>
              {capitalize(transaction.paymentMethod.name)}
            </div>
            <div className="col">
              <label><FormattedMessage id='transaction.amount' defaultMessage='amount' /></label>
              <div className="amountDetails">
                <span>{amountDetailsStr}</span>
                <span className="netAmountInGroupCurrency">&nbsp;=&nbsp;
                  <FormattedNumber
                    value={transaction.netAmountInGroupCurrency / 100}
                    currency={transaction.currency}
                    {...this.currencyStyle}
                    />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(Transaction);