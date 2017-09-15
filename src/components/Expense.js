import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedNumber } from 'react-intl';
import { imagePreview, capitalize } from '../lib/utils';
import { pickAvatar } from '../lib/collective.lib';
import ExpenseDetails from './ExpenseDetails';

class Expense extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    expense: PropTypes.object,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.state = { view: 'compact' };
    this.toggleDetails = this.toggleDetails.bind(this);
    this.messages = defineMessages({
      'pending': { id: 'expense.pending', defaultMessage: 'pending' },
      'paid': { id: 'expense.paid', defaultMessage: 'paid' },
      'approved': { id: 'expense.approved', defaultMessage: 'approved' },
      'rejected': { id: 'expense.rejected', defaultMessage: 'rejected' },
      'closeDetails': { id: 'expense.closeDetails', defaultMessage: 'Close Details' },
      'viewDetails': { id: 'expense.viewDetails', defaultMessage: 'View Details' }
    });
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 0, maximumFractionDigits: 2};
  }

  toggleDetails() {
    this.setState({
      loadDetails: true,
      view: this.state.view === 'details' ? 'compact' : 'details'
    })
  }

  render() {
    const { intl, collective, expense, LoggedInUser } = this.props;

    const title = expense.description;
    const status = expense.status.toLowerCase();

    return (
      <div className={`expense ${status} ${this.state.view}View`}>
        <style jsx>{`
          .expense {
            width: 100%;
            margin: 0.5em 0;
            padding: 0.5em;
            transition: max-height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            overflow: hidden;
            max-height: 6rem;
          }
          .expense.detailsView {
            background-color: #fafafa;
            max-height: 20rem;
          }
          a {
            cursor: pointer;
          }
          .fromCollective {
            float: left;
            margin-right: 1rem;
          }
          .fromCollective img {
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
          .rejected .amount, .rejected .status {
            color: #e21a60;
          }
          .paid .amount, .approved .status {
            color: #72ce00;
          }

          .status {
            text-transform: uppercase;
          }

          @media(max-width: 600px) {
            .expense {
              max-height: 13rem;
            }
            .expense.detailsView {
              max-height: 45rem;
            }
            .details {
              max-height: 30rem;
            }
          }
        `}</style>
        <div className="amount">
          <FormattedNumber
            value={expense.amount / 100}
            currency={expense.currency}
            {...this.currencyStyle}
            />
        </div>
        <div className="fromCollective">
          <a href={`/${expense.fromCollective.slug}`} title={expense.fromCollective.name}>
            <img src={imagePreview(expense.fromCollective.image, pickAvatar(expense.fromCollective.id), { width: 80 })} />
          </a>
        </div>
        <div className="body">
        <a onClick={this.toggleDetails}>{/* should link to `/${collective.slug}/expenses/${expense.uuid}` once we have a page for it */}
          {capitalize(title)}
        </a>
          <div className="meta">
            <span className="status">{intl.formatMessage(this.messages[status])}</span> | 
            {capitalize(expense.category)}
            <span> | <a onClick={this.toggleDetails}>{intl.formatMessage(this.messages[`${this.state.view === 'details' ? 'closeDetails' : 'viewDetails'}`])}</a></span>
          </div>
          {this.state.loadDetails && 
            <ExpenseDetails
              LoggedInUser={LoggedInUser}
              expense={expense}
              collective={collective}
              mode={this.state.view === 'details' ? 'open' : 'closed'}
              />}
        </div>
      </div>
    );
  }
}

export default injectIntl(Expense);