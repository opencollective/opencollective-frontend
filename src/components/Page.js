import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import withData from '../lib/withData';
import withLoggedInUser from '../lib/withLoggedInUser';

import Body from './Body';
import ErrorPage from './ErrorPage';
import Footer from './Footer';
import Header from './Header';

class Page extends React.Component {
  static propTypes = {
    getLoggedInUser: PropTypes.func,
    title: PropTypes.string,
  };

  state = {
    error: null,
    loadingLoggedInUser: true,
    LoggedInUser: null,
  };

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    try {
      const LoggedInUser = await getLoggedInUser();
      this.setState({ LoggedInUser });
    } catch (error) {
      this.setState({ error });
    } finally {
      this.setState({ loadingLoggedInUser: false });
    }
  }

  render() {
    const { children, title } = this.props;
    const { error, loadingLoggedInUser, LoggedInUser } = this.state;

    if (error) {
      return <ErrorPage message={error.message} />;
    }

    return (
      <Fragment>
        <Header
          className={loadingLoggedInUser ? 'loading' : ''}
          LoggedInUser={LoggedInUser}
          title={title}
        />
        <Body>{children(this.state)}</Body>
        <Footer />
      </Fragment>
    );
  }
}

export default withData(withLoggedInUser(Page));
