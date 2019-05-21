import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import { withUser } from './UserProvider';

import Body from '../components/Body';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import Header from '../components/Header';

const Page = ({
  children,
  data = {},
  description,
  image,
  loadingLoggedInUser,
  LoggedInUser,
  title,
  twitterHandle,
  showSearch,
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
        twitterHandle={twitterHandle}
        description={description}
        image={image}
      />
      <Body>{typeof children === 'function' ? children(childProps) : children}</Body>
      <Footer />
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
  image: PropTypes.string,
  loadingLoggedInUser: PropTypes.bool,
  LoggedInUser: PropTypes.shape({}),
  showSearch: PropTypes.bool,
  title: PropTypes.string,
  twitterHandle: PropTypes.string,
};

Page.defaultProps = {
  showSearch: true,
};

export default withUser(Page);
