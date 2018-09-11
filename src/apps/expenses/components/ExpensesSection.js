import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { get } from 'lodash';

import withIntl from '../../../lib/withIntl';
import NotFound from '../../../components/NotFound';
import { formatCurrency } from '../../../lib/utils';
import { Router } from '../../../server/pages';
import SectionTitle from '../../../components/SectionTitle';

import ExpensesWithData from './ExpensesWithData';
import TransactionsWithData from './TransactionsWithData';
import SmallButton from '../../../components/SmallButton';

class ExpensesSection extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired, // collective.id
    LoggedInUser: PropTypes.object,
    limit: PropTypes.number,
  };

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
        label: (
          <FormattedMessage
            id="expense.new.submit"
            defaultMessage="Submit Expense"
          />
        ),
      };
    }

    if (!collective) return <NotFound />;

    // We don't show the Budget section on event if there is no transaction
    if (collective.type === 'EVENT' && this.totalTransactions === 0) {
      return <div />;
    }

    return (
      <section id="budget" className="clear">
        <div className="content">
          <SectionTitle
            section="budget"
            values={{
              balance: formatCurrency(
                get(collective, 'stats.balance'),
                collective.currency,
              ),
            }}
            action={action}
          />

          <div className="ExpensesSection">
            <style jsx>{`
            .columns {
              display: flex;
              max-width: 1080px;
            }
            .col {
              width: 50%;
              max-width: 488px;
              min-width: 300px;
            }
            .col.first {
              margin-right: 104px;
            }
            .actions {
              text-align: center;
              font-size: 1.4rem;
            }
            .col .header {
              display: flex;
              align-items: baseline;
              justify-content: space-between;
            }
            h2 {
              line-height: 24px;
              color: black;
              font-weight: 500;
              font-size: 2rem;
              margin-bottom: 4.8rem;
            }
            @media(max-width: 660px) {
              .columns {
                flex-direction: column;
              }
            }
            `}</style>
            <div className="columns">
              { this.totalExpenses > 0 &&
                <div id="expenses" className="first col">
                  <div className="header">
                    <h2>
                      <FormattedMessage
                        id="collective.expenses.title"
                        values={{ n: this.totalExpenses }}
                        defaultMessage="{n, plural, one {Latest expense} other {Latest expenses}}"
                        />
                    </h2>
                    <SmallButton
                      disabled={this.totalExpenses < 5}
                      className="light"
                      onClick={() => Router.pushRoute(`${collective.path}/expenses`)}
                      >
                      <FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" />
                    </SmallButton>
                  </div>
                  <ExpensesWithData
                    collective={collective}
                    LoggedInUser={LoggedInUser}
                    view="compact"
                    limit={5}
                    />
                </div>
              )}

              {this.totalTransactions > 0 && (
                <div id="transactions" className="col">
                  <div className="header">
                    <h2>
                      <FormattedMessage
                        id="collective.transactions.title"
                        values={{ n: this.totalTransactions }}
                        defaultMessage="{n, plural, one {Latest transaction} other {Latest transactions}}"
                        />
                    </h2>
                    <SmallButton
                      disabled={this.totalTransactions < 5}
                      className="light"
                      onClick={() => Router.pushRoute(`${collective.path}/transactions`)}
                      >
                      <FormattedMessage id="transactions.viewAll" defaultMessage="View All Transactions" />
                    </SmallButton>
                  </div>
                  <TransactionsWithData
                    collective={collective}
                    LoggedInUser={LoggedInUser}
                    limit={5}
                    showCSVlink={false}
                    />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default withIntl(ExpensesSection);
