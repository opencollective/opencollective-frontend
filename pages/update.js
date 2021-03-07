import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';

import { NAVBAR_CATEGORIES } from '../lib/collective-sections';
import { addCollectiveCoverData } from '../lib/graphql/queries';

import Body from '../components/Body';
import CollectiveNavbar from '../components/collective-navbar';
import { Sections } from '../components/collective-page/_constants';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import { Box } from '../components/Grid';
import Header from '../components/Header';
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
      <div className="UpdatePage">
        <Header collective={collective} LoggedInUser={LoggedInUser} />
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{`${updateSlug} - ${collective.name} - Open Collective`}</title>
        </Head>

        <Body>
          <CollectiveNavbar
            collective={collective}
            isAdmin={LoggedInUser && LoggedInUser.canEditCollective(collective)}
            selected={Sections.UPDATES}
            selectedCategory={NAVBAR_CATEGORIES.CONNECT}
          />

          <Box className="content" py={4}>
            <UpdateWithData
              collectiveSlug={collective.slug}
              updateSlug={updateSlug}
              editable={true}
              LoggedInUser={LoggedInUser}
            />
          </Box>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withUser(addCollectiveCoverData(UpdatePage));
