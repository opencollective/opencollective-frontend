import React from 'react';
import PropTypes from 'prop-types';

import ErrorPage from '../components/ErrorPage';
import { generateNotFoundError } from '../lib/errors';

/**
 * This page is shown when NextJS triggers a critical error during server-side
 * rendering, typically 404 errors.
 */
class NextJSErrorPage extends React.Component {
  static getInitialProps({ res, err, req }) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : null;
    return { statusCode, err, url: req && req.originalUrl };
  }

  static propTypes = {
    statusCode: PropTypes.number.isRequired,
    url: PropTypes.string,
    err: PropTypes.object,
  };

  render() {
    const { statusCode, url } = this.props;

    if (statusCode === 404 && url) {
      const slugRegex = /^\/([^/?]+)/;
      const parsedUrl = slugRegex.exec(url);
      const pageSlug = parsedUrl && parsedUrl[1];
      return <ErrorPage log={false} error={generateNotFoundError(pageSlug, false)} />;
    } else {
      return <ErrorPage />;
    }
  }
}

export default NextJSErrorPage;
