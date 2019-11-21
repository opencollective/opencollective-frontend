import React from 'react';
import PropTypes from 'prop-types';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveNavbar from '../components/CollectiveNavbar';
import ErrorPage from '../components/ErrorPage';
import UpdatesWithData from '../components/UpdatesWithData';

import { addCollectiveCoverData } from '../lib/graphql/queries';

import { withUser } from '../components/UserProvider';
import { Sections } from '../components/collective-page/_constants';

class UpdatesPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, action } }) {
    return { slug: collectiveSlug, action };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    action: PropTypes.string, // not clear whre it's coming from, not in the route
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object, // from withUser
  };

  render() {
    const { data, action, LoggedInUser } = this.props;

    if (!data.Collective) return <ErrorPage data={data} />;

    const collective = data.Collective;

    return (
      <div className="UpdatesPage">
        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveNavbar
            collective={collective}
            isAdmin={LoggedInUser && LoggedInUser.canEditCollective(collective)}
            selected={Sections.UPDATES}
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

export default withUser(addCollectiveCoverData(UpdatesPage));
