import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedNumber, FormattedMessage } from 'react-intl';
import { imagePreview, capitalize } from '../lib/utils';
import { pickAvatar } from '../lib/user.lib';
import { get } from 'lodash';
import TransactionDetails from './TransactionDetails';

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
      'viewDetails': { id: 'transaction.viewDetails', defaultMessage: 'View Details' }
    });
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 0, maximumFractionDigits: 2};
  }

  toggleDetails() {
    this.setState({loadDetails: true, view: this.state.view === 'details' ? 'compact' : 'details'})
  }

  render() {
    const { intl, collective, transaction } = this.props;

    const type = transaction.type.toLowerCase();

    const meta = [];
    meta.push(transaction.category);
    meta.push(intl.formatMessage(this.messages[`${type}.meta`], { name: transaction.user.name, createdAt: new Date(transaction.createdAt) }));

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
            font-family: montserratlight, arial;
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
          <a href={`/${transaction.user.username}`} title={transaction.user.name}>
            <img src={imagePreview(transaction.user.avatar,pickAvatar(transaction.user.id), { width: 80 })} />
          </a>
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
          {this.state.loadDetails && <TransactionDetails transaction={transaction} collective={collective} mode={this.state.view === 'details' ? 'open' : 'closed'} />}
        </div>
      </div>
    );
  }
}

export default injectIntl(Transaction);