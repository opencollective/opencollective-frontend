import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl'
import { get } from 'lodash';

import withIntl from '../../../lib/withIntl';
import NotFound from '../../../components/NotFound';
import { formatCurrency } from '../../../lib/utils';
import { Router } from '../../../server/pages';
import SectionTitle from '../../../components/SectionTitle';

import ExpensesWithData from './ExpensesWithData';
import TransactionsWithData from './TransactionsWithData';


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
    const { collective, LoggedInUser } = this.props;
    let action;
    if (LoggedInUser && LoggedInUser.canEditCollective(collective)) {
      action = {
        href: `/${collective.slug}/expenses/new`,
        label: <FormattedMessage id="expense.new.submit" defaultMessage="Submit Expense" />
      }
    }

    if (!collective) return (<NotFound />);

    return (
      <section id="budget" className="clear">
        <div className="content" >
          <SectionTitle
            section="budget"
            values={{ balance: formatCurrency(get(collective, 'stats.balance'), collective.currency) }}
            action={action}
            />

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
                    <a className="ViewAllExpensesBtn" onClick={() => Router.pushRoute(`${collective.path}/expenses`)}><FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" /></a>
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
        </div>
      </section>     
    );
  }

}

export default withIntl(ExpensesSection);
