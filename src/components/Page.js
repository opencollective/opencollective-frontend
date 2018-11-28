import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import { withUser } from './UserProvider';

import Body from '../components/Body';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import Header from '../components/Header';

class Page extends React.Component {
  render() {
    const { children, data = {}, loadingLoggedInUser, LoggedInUser, title, showSearch } = this.props;

    if (data.error) {
      return <ErrorPage data={data} LoggedInUser={LoggedInUser} />;
    }

    const childProps = { LoggedInUser, loadingLoggedInUser };

    return (
      <Fragment>
        <Header
          className={loadingLoggedInUser ? 'loading' : ''}
          LoggedInUser={LoggedInUser}
          showSearch={showSearch}
          title={title}
        />
        <Body>{typeof children === 'function' ? children(childProps) : children}</Body>
        <Footer />
      </Fragment>
    );
  }
}

Page.propTypes = {
  data: PropTypes.shape({
    error: PropTypes.shape({}),
  }),
  LoggedInUser: PropTypes.shape({}),
  showSearch: PropTypes.bool,
  title: PropTypes.string,
};

Page.defaultProps = {
  showSearch: true,
};

export default withUser(Page);
