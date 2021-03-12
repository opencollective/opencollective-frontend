import React from 'react';
import PropTypes from 'prop-types';

import { NAVBAR_CATEGORIES } from '../lib/collective-sections';
import { addCollectiveCoverData } from '../lib/graphql/queries';

import Body from '../components/Body';
import CollectiveNavbar from '../components/collective-navbar';
import { Sections } from '../components/collective-page/_constants';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import { Box } from '../components/Grid';
import Page from '../components/Page';
import UpdateWithData from '../components/UpdateWithData';
import { withUser } from '../components/UserProvider';

class UpdatePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, updateSlug } }) {
    return { slug: collectiveSlug, updateSlug };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    updateSlug: PropTypes.string,
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object, // from withUser
  };

  render() {
    const { data, updateSlug, LoggedInUser } = this.props;

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;

    return (
      <Page collective={collective}>
        <CollectiveNavbar
          collective={collective}
          isAdmin={LoggedInUser && LoggedInUser.canEditCollective(collective)}
          selected={Sections.UPDATES}
          selectedCategory={NAVBAR_CATEGORIES.CONNECT}
        />

        <Container py={4} maxWidth={1260} m="0 auto" px={[0, null, null, 4]}>
          <UpdateWithData
            collectiveSlug={collective.slug}
            updateSlug={updateSlug}
            editable={true}
            LoggedInUser={LoggedInUser}
          />
        </Container>
      </Page>
    );
  }
}

export default withUser(addCollectiveCoverData(UpdatePage));
