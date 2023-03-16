import React from 'react';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/nextjs';

import { generateNotFoundError } from '../lib/errors';

import ErrorPage from '../components/ErrorPage';

/**
 * This page is shown when NextJS triggers a critical error during server-side
 * rendering, typically 404 errors.
 */
class NextJSErrorPage extends React.Component {
  static getInitialProps(context) {
    const { res, err, req } = context;

    // In case this is running in a serverless function, await this in order to give Sentry
    // time to send the error before the lambda exits
    Sentry.captureUnderscoreErrorException(context);

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
