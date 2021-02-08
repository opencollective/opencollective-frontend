import React from 'react';
import PropTypes from 'prop-types';

import { NAVBAR_CATEGORIES } from '../../lib/collective-sections';
import { addCollectiveCoverData } from '../../lib/graphql/queries';

import Body from '../../components/Body';
import CollectiveNavbar from '../../components/collective-navbar';
import { Sections } from '../../components/collective-page/_constants';
import ErrorPage from '../../components/ErrorPage';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import UpdatesWithData from '../../components/UpdatesWithData';
import { withUser } from '../../components/UserProvider';

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

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;

    return (
      <div className="UpdatesPage">
        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveNavbar
            collective={collective}
            isAdmin={LoggedInUser && LoggedInUser.canEditCollective(collective)}
            selected={Sections.UPDATES}
            selectedCategory={NAVBAR_CATEGORIES.CONNECT}
          />

          <div className="content">
            <UpdatesWithData collective={collective} defaultAction={action} LoggedInUser={LoggedInUser} />
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withUser(addCollectiveCoverData(UpdatesPage));
