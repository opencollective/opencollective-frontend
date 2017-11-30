import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedNumber } from 'react-intl';
import { capitalize } from '../lib/utils';
import { get } from 'lodash';
import TransactionDetails from './TransactionDetails';
import Avatar from './Avatar';

class Transaction extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    transaction: PropTypes.object,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.state = { view: 'compact' };
    this.toggleDetails = this.toggleDetails.bind(this);
    this.messages = defineMessages({
      'debit': { id: 'transaction.debit', defaultMessage: 'debit' },
      'credit': { id: 'transaction.credit', defaultMessage: 'credit' },
      'credit.title': { id: 'transaction.credit.title', defaultMessage: '{interval, select, month {monthly} year {yearly} other {}} donation to {collective}' },
      'debit.meta': { id: 'transaction.debit.meta', defaultMessage: 'Expense submitted by {name}, paid on {createdAt, date, medium}' },
      'credit.meta': { id: 'transaction.credit.meta', defaultMessage: 'Donation made by {name} on {createdAt, date, medium}' },
      'closeDetails': { id: 'transaction.closeDetails', defaultMessage: 'Close Details' },
      'viewDetails': { id: 'transaction.viewDetails', defaultMessage: 'View Details' }
    });
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 2, maximumFractionDigits: 2};
  }

  toggleDetails() {
    this.setState({loadDetails: true, view: this.state.view === 'details' ? 'compact' : 'details'})
  }

  render() {
    const { intl, collective, transaction, LoggedInUser } = this.props;

    if (!transaction.fromCollective) return (<div />); // This only occurs for host collectives when they add funds

    const type = transaction.type.toLowerCase();

    let title = transaction.description;
    if (type === 'credit' && (!title || title.match(/donation to /i))) {
      title = intl.formatMessage(this.messages['credit.title'], {collective: collective.name, interval: get(transaction, 'subscription.interval')})
    }

    const meta = [];
    meta.push(transaction.category);
    meta.push(intl.formatMessage(this.messages[`${type}.meta`], { name: transaction.fromCollective.name, createdAt: new Date(transaction.createdAt) }));

    return (
      <div className={`transaction ${type} ${this.state.view}View`}>
        <style jsx>{`
          .transaction {
            width: 100%;
            margin: 0.5em 0;
            padding: 0.5em;
            transition: max-height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            overflow: hidden;
            max-height: 7rem;
            position: relative;
            display: flex;
          }
          .transaction.detailsView {
            background-color: #fafafa;
            max-height: 26rem;
          }
          a {
            cursor: pointer;
          }
          .fromCollective {
            float: left;
            margin-right: 1rem;
          }
          .body {
            overflow: hidden;
            font-size: 1.5rem;
          }
          .description {
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            display: block;
          }
          .meta {
            color: #919599;
            font-size: 1.2rem;
          }
          .amount {
            width: 10rem;
            margin-left: 0.5rem;
            text-align: right;
            font-family: montserratlight, arial;
            font-size: 1.5rem;
            font-weight: 300;
          }
          .debit .amount {
            color: #e21a60;
          }
          .credit .amount {
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
        <div className="fromCollective">
          <a href={`/${transaction.fromCollective.slug}`} title={transaction.fromCollective.name}>
            <Avatar src={transaction.fromCollective.image} key={transaction.fromCollective.id} radius={40} />
          </a>
        </div>
        <div className="body">
          <div className="description">
            <a onClick={this.toggleDetails} title={capitalize(title)}>{/* should link to `/${collective.slug}/transactions/${transaction.uuid}` once we have a page for it */}
              {capitalize(title)}
            </a>
          </div>
          <div className="meta">
            {capitalize(meta.join(' '))}
            <span> | <a onClick={this.toggleDetails}>{intl.formatMessage(this.messages[`${this.state.view === 'details' ? 'closeDetails' : 'viewDetails'}`])}</a></span>
          </div>
          {this.state.loadDetails && 
            <TransactionDetails
              LoggedInUser={LoggedInUser}
              transaction={transaction}
              collective={collective}
              mode={this.state.view === 'details' ? 'open' : 'closed'}
              />}
        </div>
        <div className="amount">
          <FormattedNumber
            value={transaction.amount / 100}
            currency={transaction.currency}
            {...this.currencyStyle}
            />
        </div>
      </div>
    );
  }
}

export default injectIntl(Transaction);