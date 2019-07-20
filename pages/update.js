import React from 'react';
import PropTypes from 'prop-types';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ErrorPage from '../components/ErrorPage';
import UpdateWithData from '../components/UpdateWithData';

import { addCollectiveCoverData } from '../lib/graphql/queries';

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
        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          LoggedInUser={LoggedInUser}
        />

        <Body>
          <CollectiveCover
            collective={collective}
            key={collective.slug}
            href={`/${collective.slug}`}
            displayContributeLink={collective.isActive && collective.host ? true : false}
          />

          <div className="content">
            <UpdateWithData
              collectiveSlug={collective.slug}
              updateSlug={updateSlug}
              editable={true}
              LoggedInUser={LoggedInUser}
            />
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withUser(addCollectiveCoverData(UpdatePage));
