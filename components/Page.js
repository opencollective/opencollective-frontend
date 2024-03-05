import React from 'react';
import PropTypes from 'prop-types';

import Body from '../components/Body';
import ErrorPage from '../components/ErrorPage';
import Header from '../components/Header';
import Footer from '../components/navigation/Footer';

import { withUser } from './UserProvider';

const Page = ({
  children,
  data = {},
  description,
  image,
  loadingLoggedInUser,
  LoggedInUser,
  title,
  navTitle,
  metaTitle,
  noRobots,
  twitterHandle,
  showSearch,
  canonicalURL,
  collective,
  menuItems,
  withTopBar = true,
  showFooter = true,
  showProfileAndChangelogMenu = true,
  loading,
}) => {
  if (data.error) {
    return <ErrorPage data={data} LoggedInUser={LoggedInUser} />;
  }

  const childProps = { LoggedInUser, loadingLoggedInUser };
  return (
    <div>
      <Header
        showSearch={showSearch}
        title={title}
        navTitle={navTitle}
        noRobots={noRobots}
        twitterHandle={twitterHandle}
        description={description}
        image={image}
        metaTitle={metaTitle}
        canonicalURL={canonicalURL}
        collective={collective}
        menuItems={menuItems}
        LoggedInUser={LoggedInUser}
        showProfileAndChangelogMenu={showProfileAndChangelogMenu}
        loading={loading}
        withTopBar={withTopBar}
      />
      <Body>{typeof children === 'function' ? children(childProps) : children}</Body>
      {showFooter && <Footer />}
    </div>
  );
};

Page.displayName = 'Page';

Page.propTypes = {
  data: PropTypes.shape({
    error: PropTypes.shape({}),
  }),
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  description: PropTypes.string,
  canonicalURL: PropTypes.string,
  image: PropTypes.string,
  loadingLoggedInUser: PropTypes.bool,
  LoggedInUser: PropTypes.shape({}),
  showSearch: PropTypes.bool,
  noRobots: PropTypes.bool,
  title: PropTypes.string,
  navTitle: PropTypes.string,
  metaTitle: PropTypes.string,
  twitterHandle: PropTypes.string,
  collective: PropTypes.object,
  menuItems: PropTypes.object,
  showFooter: PropTypes.bool,
  showProfileAndChangelogMenu: PropTypes.bool,
  loading: PropTypes.bool,
  withTopBar: PropTypes.bool,
};

Page.defaultProps = {
  showSearch: true,
  withTopBar: true,
};

export default withUser(Page);
