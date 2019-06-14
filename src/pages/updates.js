import React from 'react';
import PropTypes from 'prop-types';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ErrorPage from '../components/ErrorPage';
import UpdatesWithData from '../components/UpdatesWithData';

import { addCollectiveCoverData } from '../graphql/queries';

import withIntl from '../lib/withIntl';
import { withUser } from '../components/UserProvider';

class UpdatesPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, action } }) {
    return { slug: collectiveSlug, action };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    action: PropTypes.string, // not clear whre it's coming from, not in the route
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
  };

  render() {
    const { data, action, LoggedInUser } = this.props;

    if (!data.Collective) return <ErrorPage data={data} />;

    const collective = data.Collective;

    return (
      <div className="UpdatesPage">
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
            href={`/${collective.slug}`}
            cta={{
              href: `/${collective.slug}#contribute`,
              label: 'contribute',
            }}
            key={collective.slug}
          />

          <div className="content">
            <UpdatesWithData
              collective={collective}
              includeHostedCollectives={collective.isHost}
              defaultAction={action}
              LoggedInUser={LoggedInUser}
            />
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withIntl(withUser(addCollectiveCoverData(UpdatesPage)));
