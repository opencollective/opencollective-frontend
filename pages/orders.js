import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { addCollectiveNavbarData } from '../lib/graphql/queries';
import { isHiddenAccount } from '@/lib/collective';

import CollectiveNavbar from '../components/collective-navbar';
import Container from '../components/Container';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

import Custom404 from './404';

class OrdersPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveNavbarData
    data: PropTypes.shape({
      account: PropTypes.object,
      loading: PropTypes.bool,
    }).isRequired, // from withData
    LoggedInUser: PropTypes.object,
  };

  render() {
    const { slug, data, LoggedInUser } = this.props;
    const collective = data?.account;
    if (data && !data.loading) {
      if (!data.account || isHiddenAccount(data.account)) {
        return <Custom404 />;
      }
    }

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
        <Container py={[4, 5, 6]} px={2} maxWidth={500} mx="auto">
          <MessageBox type="info">
            <FormattedMessage
              defaultMessage="This page does not exists anymore. You can see all the contributions by changing the filters on the <TransactionsLink>transactions page</TransactionsLink>."
              values={{
                TransactionsLink: msg => <Link href={`/${slug}/transactions`}>{msg}</Link>,
              }}
            />
          </MessageBox>
        </Container>
      </Page>
    );
  }
}

// next.js export
// ts-unused-exports:disable-next-line
export default withUser(addCollectiveNavbarData(OrdersPage));
