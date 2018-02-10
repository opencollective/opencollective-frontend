import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { FormattedMessage } from 'react-intl'
import ExpensesWithData from './ExpensesWithData';
import TransactionsWithData from './TransactionsWithData';
import Currency from './Currency';
import { Button } from 'react-bootstrap';
import { Router } from '../server/pages';

class ExpensesSection extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired, // collective.id
    LoggedInUser: PropTypes.object,
    limit: PropTypes.number
  }

  constructor(props) {
    super(props);
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
                values={{ n: collective.stats.expenses.all }}
                defaultMessage={`{n, plural, one {Latest expense} other {Latest expenses}}`}
                />
            </h2>
            <ExpensesWithData
              collective={collective}
              LoggedInUser={LoggedInUser}
              compact={true}
              limit={5}
              />
            <div className="actions">
              <a className="ViewAllExpensesBtn" onClick={() =>Router.pushRoute(`/${collective.slug}/expenses`)}><FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" /></a>
            </div>
          </div>

          <div id="transactions" className="col">
            <h2>
              <FormattedMessage
                id="collective.transactions.title"
                values={{ n: collective.stats.transactions }}
                defaultMessage={`{n, plural, one {Latest transaction} other {Latest transactions}}`}
                />
            </h2>
            <TransactionsWithData
              collective={collective}
              LoggedInUser={LoggedInUser}
              limit={5}
              showCSVlink={false}
              />
            <div className="actions">
              <a className="ViewAllTransactionsBtn" onClick={() => Router.pushRoute(`/${collective.slug}/transactions`)}><FormattedMessage id="transactions.viewAll" defaultMessage="View All Transactions" /></a>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export default withIntl(ExpensesSection);