import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ErrorPage from '../components/ErrorPage';
import UpdateWithData from '../components/UpdateWithData';

import { addCollectiveCoverData } from '../graphql/queries';

import withIntl from '../lib/withIntl';
import { withUser } from '../components/UserProvider';

class UpdatePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, updateSlug } }) {
    return { slug: collectiveSlug, updateSlug };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    updateSlug: PropTypes.string,
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from withIntl
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {};
    this.messages = defineMessages({
      'collective.contribute': {
        id: 'collective.contribute',
        defaultMessage: 'contribute',
      },
    });
  }

  render() {
    const { intl, data, updateSlug, LoggedInUser } = this.props;

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
          className={this.state.status}
          LoggedInUser={LoggedInUser}
        />

        <Body>
          <CollectiveCover
            collective={collective}
            key={collective.slug}
            cta={{
              href: '#contribute',
              label: intl.formatMessage(this.messages['collective.contribute']),
            }}
            href={`/${collective.slug}`}
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

export default withIntl(withUser(addCollectiveCoverData(UpdatePage)));
