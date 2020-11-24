import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { ORDER_STATUS } from '../lib/constants/order-status';
import { addCollectiveCoverData } from '../lib/graphql/queries';

import CollectiveNavbar from '../components/CollectiveNavbar';
import Container from '../components/Container';
import OrdersWithData from '../components/orders/OrdersWithData';
import Page from '../components/Page';
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
    const collective = data?.collective;
    return (
      <Page>
        {(data?.loading || data?.Collective) && (
          <Container mb={4}>
            <CollectiveNavbar
              isLoading={data.loading}
              collective={data.Collective}
              isAdmin={LoggedInUser?.canEditCollective(collective)}
              showEdit
            />
          </Container>
        )}
        <OrdersWithData
          accountSlug={slug}
          status={ORDER_STATUS.PENDING}
          title={<FormattedMessage id="PendingBankTransfers" defaultMessage="Pending bank transfers" />}
        />
      </Page>
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
