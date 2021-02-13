import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '../components/Grid';
import Link from '../components/Link';
import Page from '../components/Page';
import { P } from '../components/Text';

class OrderPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string,
  };

  render() {
    return (
      <Page>
        <Box textAlign="center" px={2} py={[4, 5, 6]}>
          <P fontSize="64px" mb={4}>
            🙈️
          </P>
          <p>
            <strong>This page has moved.</strong>
          </p>
          You can now manage pending bank transfers from{' '}
          <Link href={`${this.props.slug}/orders`}>the dedicated page.</Link>
        </Box>
      </Page>
    );
  }
}

export default OrderPage;
