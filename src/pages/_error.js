import React from 'react';
import PropTypes from 'prop-types';

import ErrorPage from '../components/ErrorPage';
import { withUser } from '../components/UserProvider';

/**
 * This page is shown when NextJS triggers a critical error during server-side
 * rendering, typically 404 errors.
 */
class Error extends React.Component {
  static propTypes = {
    statusCode: PropTypes.number.isRequired,
    url: PropTypes.string,
    err: PropTypes.object,
    LoggedInUser: PropTypes.object,
  };

  static getInitialProps({ res, err, req }) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : null;
    return { statusCode, err, url: req && req.originalUrl };
  }

  render() {
    const { statusCode, url } = this.props;
    const { LoggedInUser } = this.props;

    if (statusCode === 404 && url) {
      const slugRegex = /^\/([^/?]+)/;
      const parsedUrl = slugRegex.exec(url);
      const errorData = parsedUrl && {
        error: { message: 'No collective found' },
        variables: { slug: parsedUrl[1] },
      };

      return <ErrorPage LoggedInUser={LoggedInUser} data={errorData} log={false} />;
    }
    return <ErrorPage LoggedInUser={LoggedInUser} />;
  }
}

export default withUser(Error);
