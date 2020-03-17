import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import OrdersWithData from '../components/expenses/OrdersWithData';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ErrorPage from '../components/ErrorPage';
import SectionTitle from '../components/SectionTitle';

import { generateNotFoundError } from '../lib/errors';
import { addCollectiveCoverData } from '../lib/graphql/queries';

import { withUser } from '../components/UserProvider';

class OrdersPage extends React.Component {
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
    const { slug, data, LoggedInUser } = this.props;

    if (!data || data.error || data.loading) {
      return <ErrorPage data={data} />;
    } else if (!data.Collective) {
      return <ErrorPage error={generateNotFoundError(slug, true)} log={false} />;
    }

    const collective = data.Collective;

    let action, subtitle, filter;
    if (this.props.value) {
      action = {
        label: <FormattedMessage id="orders.viewAll" defaultMessage="View All Orders" />,
        href: `/${collective.slug}/orders`,
      };

      if (this.props.filter === 'categories') {
        const category = decodeURIComponent(this.props.value);
        filter = { category };
        subtitle = (
          <FormattedMessage id="orders.byCategory" defaultMessage="Orders in {category}" values={{ category }} />
        );
      }
      if (this.props.filter === 'recipients') {
        const recipient = decodeURIComponent(this.props.value);
        filter = { recipient };
        subtitle = (
          <FormattedMessage id="orders.byRecipient" defaultMessage="Orders by {recipient}" values={{ recipient }} />
        );
      }
    }

    return (
      <div className="OrdersPage">
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
          />

          <div className="content">
            <SectionTitle section="orders" subtitle={subtitle} action={action} />

            <div className=" columns">
              <div className="col large">
                <OrdersWithData collective={collective} LoggedInUser={LoggedInUser} filter={filter} />
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
  addCollectiveCoverData(OrdersPage, {
    options: props => ({
      variables: { slug: props.slug, throwIfMissing: false },
    }),
  }),
);
