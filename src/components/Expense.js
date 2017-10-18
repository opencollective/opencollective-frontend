import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedNumber } from 'react-intl';
import { capitalize } from '../lib/utils';
import Avatar from './Avatar';
import ExpenseDetails from './ExpenseDetails';
import ApproveExpenseBtn from './ApproveExpenseBtn';
import RejectExpenseBtn from './RejectExpenseBtn';
import PayExpenseBtn from './PayExpenseBtn';
import { Link } from '../server/pages';

class Expense extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    expense: PropTypes.object,
    includeHostedCollectives: PropTypes.bool,
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
    const {
      intl,
      collective,
      expense,
      includeHostedCollectives,
      LoggedInUser
    } = this.props;

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
            position: relative;
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
          .body {
            overflow: hidden;
            font-size: 1.5rem;
          }
          .description {
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 85%;
            overflow: hidden;
            display: block;
          }
          .meta {
            color: #919599;
            font-size: 1.2rem;
          }
          .meta .collective {
            margin-right: 0.2rem;
            float: left;
          }
          .amount .balance {
            font-size: 1.2rem;
            color: #919599;
          }
          .amount {
            width: 10rem;
            text-align: right;
            font-family: montserratlight, arial;
            font-size: 1.5rem;
            font-weight: 300;
            position: absolute;
            right: 1rem;
            top: 1rem;
          }
          .rejected .status {
            color: #e21a60;
          }
          .approved .status {
            color: #72ce00;
          }

          .status {
            text-transform: uppercase;
          }
          
          .actions > div {
            display: flex;
            margin: 0.5rem 0;
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
        <style jsx global>{`
          .expense .actions > div > div {
            margin-right: 0.5rem;
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
            <Avatar src={expense.fromCollective.image} key={expense.fromCollective.id} radius={40} />
          </a>
        </div>
        <div className="body">
          <div className="description">
            <a onClick={this.toggleDetails} title={capitalize(title)}>{/* should link to `/${collective.slug}/expenses/${expense.uuid}` once we have a page for it */}
              {capitalize(title)}
            </a>
          </div>
          <div className="meta">
            { includeHostedCollectives &&
              <span className="collective"><Link route={`/${expense.collective.slug}`}><a>{expense.collective.slug}</a></Link> | </span>
            }
            <span className="status">{intl.formatMessage(this.messages[status])}</span> | 
            {` ${capitalize(expense.category)}`}
            <span> | <a onClick={this.toggleDetails}>{intl.formatMessage(this.messages[`${this.state.view === 'details' ? 'closeDetails' : 'viewDetails'}`])}</a></span>
          </div>
          { this.state.loadDetails && 
            <ExpenseDetails
              LoggedInUser={LoggedInUser}
              expense={expense}
              collective={collective}
              mode={this.state.view === 'details' ? 'open' : 'closed'}
              />
          }
          <div className="actions">
          { expense.status === 'PENDING' && LoggedInUser && LoggedInUser.canEditExpense(expense) &&
            <div>
              <ApproveExpenseBtn id={expense.id} />
              <RejectExpenseBtn id={expense.id} />
            </div>
          }
          { expense.status === 'APPROVED' && LoggedInUser && LoggedInUser.canPayExpense(expense) &&
            <div>
              <PayExpenseBtn expense={expense} />
            </div>
          }
          </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(Expense);