import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import Body from '../components/Body';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import Header from '../components/Header';

import { withUser } from './UserProvider';

const Page = ({
  children,
  data = {},
  description,
  image,
  loadingLoggedInUser,
  LoggedInUser,
  title,
  metaTitle,
  noRobots,
  twitterHandle,
  showSearch,
  menuItems,
  canonicalURL,
  collective,
  showFooter = true,
}) => {
  if (data.error) {
    return <ErrorPage data={data} LoggedInUser={LoggedInUser} />;
  }

  const childProps = { LoggedInUser, loadingLoggedInUser };

  return (
    <Fragment>
      <Header
        showSearch={showSearch}
        title={title}
        noRobots={noRobots}
        twitterHandle={twitterHandle}
        description={description}
        image={image}
        metaTitle={metaTitle}
        canonicalURL={canonicalURL}
        collective={collective}
        menuItems={menuItems}
        LoggedInUser={LoggedInUser}
      />
      <Body>{typeof children === 'function' ? children(childProps) : children}</Body>
      {showFooter && <Footer />}
    </Fragment>
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
  metaTitle: PropTypes.string,
  twitterHandle: PropTypes.string,
  collective: PropTypes.object,
  menuItems: PropTypes.object,
  showFooter: PropTypes.bool,
};

Page.defaultProps = {
  showSearch: true,
};

export default withUser(Page);
