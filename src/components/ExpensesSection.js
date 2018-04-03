import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { FormattedMessage } from 'react-intl'
import ExpensesWithData from './ExpensesWithData';
import TransactionsWithData from './TransactionsWithData';
import Currency from './Currency';
import { Button } from 'react-bootstrap';
import { Router } from '../server/pages';
import { get } from 'lodash';

class ExpensesSection extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired, // collective.id
    LoggedInUser: PropTypes.object,
    limit: PropTypes.number
  }

  constructor(props) {
    super(props);
    this.totalExpenses = get(props.collective, 'stats.expenses.all');
    this.totalTransactions = get(props.collective, 'stats.transactions.all');
  }

  render() {
    const { collective, LoggedInUser, limit } = this.props;

    if (!collective) return (<NotFound />);

    return (
      <div className="ExpensesSection">
        <style jsx>{`
        .columns {
          display: flex;
          justify-content: space-evenly;
        }
        .col {
          width: 50%;
          max-width: 450px;
          min-width: 300px;
          margin: 0 2rem;
        }
        .actions {
          text-align: center;
          font-size: 1.4rem;
        }
        @media(max-width: 660px) {
          .columns {
            flex-direction: column;
          }
        }
        `}</style>
        <div className="columns">
          <div id="expenses" className="col">
            <h2>
              <FormattedMessage
                id="collective.expenses.title"
                values={{ n: this.totalExpenses }}
                defaultMessage={`{n, plural, one {Latest expense} other {Latest expenses}}`}
                />
            </h2>
            <ExpensesWithData
              collective={collective}
              LoggedInUser={LoggedInUser}
              view="compact"
              limit={5}
              />
            { this.totalExpenses > 0 &&
              <div className="actions">
                <a className="ViewAllExpensesBtn" onClick={() =>Router.pushRoute(`${collective.path}/expenses`)}><FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" /></a>
              </div>
            }
          </div>

          <div id="transactions" className="col">
            <h2>
              <FormattedMessage
                id="collective.transactions.title"
                values={{ n: this.totalTransactions }}
                defaultMessage={`{n, plural, one {Latest transaction} other {Latest transactions}}`}
                />
            </h2>
            <TransactionsWithData
              collective={collective}
              LoggedInUser={LoggedInUser}
              limit={5}
              showCSVlink={false}
              />
            { this.totalTransactions > 0 &&
              <div className="actions">
                <a className="ViewAllTransactionsBtn" onClick={() => Router.pushRoute(`${collective.path}/transactions`)}><FormattedMessage id="transactions.viewAll" defaultMessage="View All Transactions" /></a>
              </div>
            }
          </div>
        </div>
      </div>
    );
  }

}

export default withIntl(ExpensesSection);