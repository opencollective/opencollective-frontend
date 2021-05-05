import React from 'react';
import PropTypes from 'prop-types';

import { generateNotFoundError } from '../lib/errors';

import ErrorPage from '../components/ErrorPage';

/**
 * This page is shown when NextJS triggers a critical error during server-side
 * rendering, typically 404 errors.
 */
class NextJSErrorPage extends React.Component {
  static getInitialProps({ res, err, req }) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : null;
    return { statusCode, err, requestUrl: req && req.originalUrl };
  }

  static propTypes = {
    statusCode: PropTypes.number.isRequired,
    requestUrl: PropTypes.string,
    err: PropTypes.object,
  };

  render() {
    const { statusCode, requestUrl } = this.props;

    if (statusCode === 404 && requestUrl) {
      const slugRegex = /^\/([^/?]+)/;
      const parsedUrl = slugRegex.exec(requestUrl);
      const pageSlug = parsedUrl && parsedUrl[1];
      return <ErrorPage log={false} error={generateNotFoundError(pageSlug)} />;
    } else {
      return <ErrorPage />;
    }
  }
}

export default NextJSErrorPage;
