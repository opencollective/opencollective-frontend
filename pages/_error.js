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
  static async getInitialProps(context) {
    const { res, err, req, asPath } = context;
    const statusCode = res ? res.statusCode : err ? err.statusCode : null;
    const initialProps = { statusCode, err, requestUrl: req && req.originalUrl };

    // Returning early because we don't want to log 404 errors to Sentry.
    if (res?.statusCode === 404) {
      return initialProps;
    }

    // Running on the server, the response object (`res`) is available.
    //
    // Next.js will pass an err on the server if a page's data fetching methods
    // threw or returned a Promise that rejected
    //
    // Running on the client (browser), Next.js will provide an err if:
    //
    //  - a page's `getInitialProps` threw or returned a Promise that rejected
    //  - an exception was thrown somewhere in the React lifecycle (render,
    //    componentDidMount, etc) that was caught by Next.js's React Error
    //    Boundary. Read more about what types of exceptions are caught by Error
    //    Boundaries: https://reactjs.org/docs/error-boundaries.html

    if (err) {
      Sentry.captureException(err);

      // Flushing before returning is necessary if deploying to Vercel, see
      // https://vercel.com/docs/platform/limits#streaming-responses
      await Sentry.flush(2000);

      return initialProps;
    }

    // If this point is reached, getInitialProps was called without any
    // information about what the error might be. This is unexpected and may
    // indicate a bug introduced in Next.js, so record it in Sentry
    Sentry.captureException(new Error(`_error.js getInitialProps missing data at path: ${asPath}`));
    await Sentry.flush(2000);

    return initialProps;
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
