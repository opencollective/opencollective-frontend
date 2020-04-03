import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { FormattedMessage } from 'react-intl';
import { graphql } from '@apollo/react-hoc';
import { get } from 'lodash';

import Link from '../Link';
import Currency from '../Currency';

class ExpensesStatsWithData extends React.Component {
  static propTypes = {
    slug: PropTypes.string.isRequired, // update.id
    data: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const {
      slug,
      data: { Collective },
    } = this.props;
    const topExpenses = get(Collective, 'stats.topExpenses');
    if (!topExpenses) {
      return <div />;
    }

    return (
      <div className="ExpensesStats">
        <style jsx>
          {`
            h1 {
              margin-top: 1.8rem;
              font-size: 1.6rem;
              text-align: left;
            }
            h2 {
              font-size: 1.4rem;
            }
            .section {
              margin-top: 2rem;
            }
            ol {
              padding-left: 1.2rem;
            }
            ol li {
              color: #797c80;
              font-size: 1.2rem;
            }
          `}
        </style>

        <h1>
          <FormattedMessage id="collective.stats.balance.title" defaultMessage="Available balance" />
        </h1>
        <Currency value={Collective.stats.balance} currency={Collective.currency} precision={2} />
        <h1>
          <FormattedMessage id="expenses.stats.distribution.title" defaultMessage="Distribution" />
        </h1>
        <div className="section categories">
          <h2>
            <FormattedMessage id="expenses.stats.byCategory.title" defaultMessage="By category" />
          </h2>
          <ol>
            {topExpenses.byCategory.map(category => (
              <li key={category.category}>
                <Link route={`/${slug}/expenses/categories/${category.category}`} scroll={false}>
                  {category.category}
                </Link>{' '}
                (
                <Currency value={category.totalExpenses} currency={Collective.currency} />)
              </li>
            ))}
          </ol>
        </div>
        <div className="section recipients">
          <h2>
            <FormattedMessage id="expenses.stats.byRecipient.title" defaultMessage="By recipient" />
          </h2>
          <ol>
            {topExpenses.byCollective.map(recipientCollective => (
              <li key={recipientCollective.slug}>
                <Link route={`/${slug}/expenses/recipients/${recipientCollective.slug}`} scroll={false}>
                  {recipientCollective.name}
                </Link>{' '}
                (
                <Currency value={-recipientCollective.totalExpenses} currency={Collective.currency} />)
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }
}

const getExpensesStatsQuery = gql`
  query Collective($slug: String) {
    Collective(slug: $slug) {
      id
      currency
      stats {
        id
        balance
        topExpenses
      }
    }
  }
`;

export const addData = graphql(getExpensesStatsQuery);

export default addData(ExpensesStatsWithData);
