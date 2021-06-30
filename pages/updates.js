import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';

import { NAVBAR_CATEGORIES } from '../lib/collective-sections';
import { addCollectiveNavbarData } from '../lib/graphql/queries';

import Body from '../components/Body';
import CollectiveNavbar from '../components/collective-navbar';
import { Sections } from '../components/collective-page/_constants';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import Header from '../components/Header';
import UpdatesWithData from '../components/UpdatesWithData';
import { withUser } from '../components/UserProvider';

class UpdatesPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, action } }) {
    return { slug: collectiveSlug, action };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveNavbarData
    action: PropTypes.string, // not clear whre it's coming from, not in the route
    data: PropTypes.shape({ account: PropTypes.object }).isRequired, // from withData
    LoggedInUser: PropTypes.object, // from withUser
    router: PropTypes.object,
  };

  render() {
    const { data, action, LoggedInUser, router } = this.props;

    if (!data.account) {
      return <ErrorPage data={data} />;
    }

    const collective = data.account;

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
            <UpdatesWithData
              collective={collective}
              defaultAction={action}
              LoggedInUser={LoggedInUser}
              limit={10}
              router={router}
            />
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withUser(withRouter(addCollectiveNavbarData(UpdatesPage)));
