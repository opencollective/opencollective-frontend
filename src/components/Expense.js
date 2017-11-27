import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedMessage, FormattedNumber, FormattedDate } from 'react-intl';
import { capitalize, formatCurrency } from '../lib/utils';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import Avatar from './Avatar';
import ExpenseDetails from './ExpenseDetails';
import ApproveExpenseBtn from './ApproveExpenseBtn';
import RejectExpenseBtn from './RejectExpenseBtn';
import PayExpenseBtn from './PayExpenseBtn';
import { Link } from '../server/pages';
import SmallButton from './SmallButton';

class Expense extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    expense: PropTypes.object,
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);

    this.state = {
      modified: false,
      expense: {},
      mode: 'summary'
    };

    this.save = this.save.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleDetails = this.toggleDetails.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.messages = defineMessages({
      'pending': { id: 'expense.pending', defaultMessage: 'pending' },
      'paid': { id: 'expense.paid', defaultMessage: 'paid' },
      'approved': { id: 'expense.approved', defaultMessage: 'approved' },
      'rejected': { id: 'expense.rejected', defaultMessage: 'rejected' },
      'closeDetails': { id: 'expense.closeDetails', defaultMessage: 'Close Details' },
      'edit': { id: 'expense.edit', defaultMessage: 'edit' },
      'cancelEdit': { id: 'expense.cancelEdit', defaultMessage: 'cancel edit' },
      'viewDetails': { id: 'expense.viewDetails', defaultMessage: 'View Details' }
    });
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 2, maximumFractionDigits: 2};
  }

  componentWillReceiveProps(newProps) {
    const { LoggedInUser } = newProps;
    const { expense } = this.props;
    if (LoggedInUser && this.state.mode === 'summary') {
      let mode = 'summary';
      if (LoggedInUser) {
        if (expense.status === 'PENDING' && LoggedInUser.canApproveExpense(expense)) {
          mode = 'details';
        }
        if (expense.status === 'APPROVED' && LoggedInUser.canPayExpense(expense)) {
          mode = 'details';
        }
      }

      this.setState({ mode });
    }
  }

  toggleDetails() {
    this.setState({
      mode: this.state.mode === 'details' ? 'summary' : 'details',
    });
  }

  cancelEdit() {
    this.setState({ modified: false, mode: 'details' });
  }

  edit() {
    this.setState({ modified: false, mode: 'edit' });
  }

  toggleEdit() {
    this.state.mode === 'edit' ? this.cancelEdit() : this.edit();
  }

  handleChange(expense) {
    console.log(">>> handleChange", expense);
    this.setState({ modified: true, expense });
  }

  async save() {
    const expense = {
      id: this.props.expense.id,
      ...this.state.expense
    }
    const res = await this.props.editExpense(expense);
    this.setState({ modified: false, mode: 'details' });
    console.log(">>> expense saved:", res);
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
      <div className={`expense ${status} ${this.state.mode}View`}>
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

          .actions .leftColumn {
            width: 72px;
            margin-right: 1rem;
            float: left;
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
            <span className="incurredAt"><FormattedDate value={expense.incurredAt} day="numeric" month="numeric" /></span> |&nbsp;
            { includeHostedCollectives &&
              <span className="collective"><Link route={`/${expense.collective.slug}`}><a>{expense.collective.slug}</a></Link> (balance: {formatCurrency(expense.collective.stats.balance, expense.collective.currency)}) | </span>
            }
            <span className="status">{intl.formatMessage(this.messages[status])}</span> | 
            {` ${capitalize(expense.category)}`}
            { LoggedInUser && LoggedInUser.canEditExpense(expense) &&
              <span> | <a onClick={this.toggleEdit}>{intl.formatMessage(this.messages[`${this.state.mode === 'edit' ? 'cancelEdit' : 'edit'}`])}</a></span>
            }
            { this.state.mode !== 'edit' &&
              <span> | <a onClick={this.toggleDetails}>{intl.formatMessage(this.messages[`${this.state.mode === 'details' ? 'closeDetails' : 'viewDetails'}`])}</a></span>
            }
          </div>

          <ExpenseDetails
            LoggedInUser={LoggedInUser}
            expense={expense}
            collective={collective}
            onChange={this.handleChange}
            mode={this.state.mode}
            />

          <div className="actions">
            { this.state.mode === 'edit' && this.state.modified &&
              <div>
                <div className="leftColumn"></div>
                <div className="rightColumn">
                  <SmallButton className="primary" onClick={this.save}><FormattedMessage id="expense.save" defaultMessage="save" /></SmallButton>
                </div>
              </div>
            }
            { this.state.mode !== 'edit' && expense.status === 'PENDING' && LoggedInUser && LoggedInUser.canApproveExpense(expense) &&
              <div>
                <ApproveExpenseBtn id={expense.id} />
                <RejectExpenseBtn id={expense.id} />
              </div>
            }
            { this.state.mode !== 'edit' && expense.status === 'APPROVED' && LoggedInUser && LoggedInUser.canPayExpense(expense) &&
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

const editExpenseQuery = gql`
mutation editExpense($expense: ExpenseInputType!) {
  editExpense(expense: $expense) {
    id
    description
    amount
    attachment
    category
    privateMessage
    payoutMethod
    status
  }
}
`;

const addMutation = graphql(editExpenseQuery, {
props: ( { mutate }) => ({
  editExpense: async (expense) => {
    return await mutate({ variables: { expense } })
  }
})
});

export default withIntl(addMutation(Expense));