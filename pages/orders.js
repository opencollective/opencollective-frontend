import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Container from '../components/Container';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';

class OrdersPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string.isRequired,
  };

  render() {
    return (
      <Page>
        <Container py={[4, 5, 6]} px={2} maxWidth={500} mx="auto">
          <MessageBox type="info">
            <FormattedMessage
              defaultMessage="This page does not exists anymore. You can see all the contributions by changing the filters on the <TransactionsLink>transactions page</TransactionsLink>."
              values={{
                TransactionsLink: msg => <Link href={`/${this.props.slug}/transactions`}>{msg}</Link>,
              }}
            />
          </MessageBox>
        </Container>
      </Page>
    );
  }
}

export default OrdersPage;
