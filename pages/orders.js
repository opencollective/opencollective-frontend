import React from 'react';

import { addCollectiveNavbarData } from '../lib/graphql/queries';

import CollectiveNavbar from '../components/collective-navbar';
import Container from '../components/Container';
import { Box } from '../components/Grid';
import OrdersWithData from '../components/orders/OrdersWithData';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

class OrdersPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, filter, value } }) {
    return { slug: collectiveSlug, filter, value };
  }

  render() {
    const { slug, data, LoggedInUser } = this.props;
    const collective = data?.account;
    return (
      <Page>
        {(data?.loading || data?.account) && (
          <Container mb={4}>
            <CollectiveNavbar
              isLoading={data.loading}
              collective={data.account}
              isAdmin={LoggedInUser?.isAdminOfCollective(collective)}
            />
          </Container>
        )}
        <Box py={4}>
          <OrdersWithData accountSlug={slug} />
        </Box>
      </Page>
    );
  }
}

// next.js export
// ts-unused-exports:disable-next-line
export default withUser(addCollectiveNavbarData(OrdersPage));
