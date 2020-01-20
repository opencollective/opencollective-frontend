import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ExpensesWithData from '../components/expenses/ExpensesWithData';
import ExpensesStatsWithData from '../components/expenses/ExpensesStatsWithData';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ErrorPage, { generateError } from '../components/ErrorPage';
import SectionTitle from '../components/SectionTitle';

import { addCollectiveCoverData } from '../lib/graphql/queries';

import { withUser } from '../components/UserProvider';
import { ssrNotFoundError } from '../lib/nextjs_utils';
import hasFeature, { FEATURES } from '../lib/allowed-features';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';

class ExpensesPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, filter, value } }) {
    return { slug: collectiveSlug, filter, value };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    filter: PropTypes.string,
    value: PropTypes.string,
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
  };

  render() {
    const { data, slug } = this.props;
    const { LoggedInUser } = this.props;

    if (!data || data.error || data.loading) {
      return <ErrorPage data={data} />;
    } else if (!data.Collective) {
      ssrNotFoundError(); // Force 404 when rendered server side
      return <ErrorPage error={generateError.notFound(slug)} log={false} />;
    } else if (!hasFeature(data.Collective, FEATURES.RECEIVE_EXPENSES)) {
      return <PageFeatureNotSupported />;
    }

    const collective = data.Collective;

    let action, subtitle, filter;
    if (this.props.value) {
      action = {
        label: <FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" />,
        href: `/${collective.slug}/expenses`,
      };

      if (this.props.filter === 'categories') {
        const category = decodeURIComponent(this.props.value);
        filter = { category };
        subtitle = (
          <FormattedMessage id="expenses.byCategory" defaultMessage="Expenses in {category}" values={{ category }} />
        );
      }
      if (this.props.filter === 'recipients') {
        const recipient = decodeURIComponent(this.props.value);
        filter = { fromCollectiveSlug: recipient };
        subtitle = (
          <FormattedMessage id="expenses.byRecipient" defaultMessage="Expenses by {recipient}" values={{ recipient }} />
        );
      }
    }

    return (
      <div className="ExpensesPage">
        <style jsx>
          {`
            .columns {
              display: flex;
            }

            .col.side {
              width: 100%;
              min-width: 20rem;
              max-width: 25%;
              margin-left: 5rem;
            }

            .col.large {
              width: 100%;
              min-width: 30rem;
              max-width: 75%;
            }

            @media (max-width: 600px) {
              .columns {
                flex-direction: column-reverse;
              }
              .columns .col {
                max-width: 100%;
              }
            }
          `}
        </style>

        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveCover
            key={collective.slug}
            collective={collective}
            LoggedInUser={LoggedInUser}
            displayContributeLink={collective.isActive && collective.host ? true : false}
            callsToAction={{ hasContact: collective.canContact, hasSubmitExpense: !collective.isArchived }}
          />

          <div className="content">
            <SectionTitle section="expenses" subtitle={subtitle} action={action} />

            <div className=" columns">
              <div className="col large">
                <ExpensesWithData collective={collective} LoggedInUser={LoggedInUser} filters={filter} />
              </div>

              <div className="col side">
                <ExpensesStatsWithData slug={collective.slug} />
              </div>
            </div>
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withUser(
  addCollectiveCoverData(ExpensesPage, {
    options: props => ({
      variables: { slug: props.slug, throwIfMissing: false },
    }),
  }),
);
