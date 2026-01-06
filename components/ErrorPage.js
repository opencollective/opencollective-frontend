import React from 'react';
import PropTypes from 'prop-types';
import copy from 'copy-to-clipboard';
import { get } from 'lodash';
import { CircleHelp, RefreshCw } from 'lucide-react';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { ERROR } from '../lib/errors';

import Footer from './navigation/Footer';
import { Button } from './ui/Button';
import Body from './Body';
import Header from './Header';
import Image from './Image';
import Link from './Link';
import Loading from './Loading';
import MessageBox from './MessageBox';
import NotFound from './NotFound';
import { withUser } from './UserProvider';

/**
 * A flexible error page
 */
class ErrorPage extends React.Component {
  static propTypes = {
    /** Customize the error type. Check `createError.*` functions for more info */
    error: PropTypes.shape({
      type: PropTypes.oneOf(Object.values(ERROR)),
      payload: PropTypes.object,
    }),
    /** If true, a loading indicator will be displayed instead of an error */
    loading: PropTypes.bool,
    /** Define if error should be logged to console. Default: true */
    log: PropTypes.bool,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
    /** @deprecated please generate errors with the `createError` helper  */
    message: PropTypes.string,
    /** @deprecated please generate errors with the `createError` helper */
    data: PropTypes.object, // we can pass the data object of Apollo to detect and handle GraphQL errors
    router: PropTypes.object,
  };

  state = { copiedErrorMessage: false };

  getErrorComponent() {
    const { error, data, loading, log = true } = this.props;

    if (log && get(data, 'error')) {
      if (data.error.message !== 'Test error') {
        // That might not be the right place to log the error. Remove?
        // eslint-disable-next-line no-console
        console.error(data.error);
      }
    }

    if (get(data, 'error.networkError') || get(error, 'networkError')) {
      return this.networkError();
    }

    if (loading || get(data, 'loading')) {
      return <Loading />;
    }

    if (error && error.type) {
      switch (error.type) {
        case ERROR.NOT_FOUND:
          return <NotFound searchTerm={get(error.payload, 'searchTerm')} />;
        case ERROR.BAD_COLLECTIVE_TYPE:
          return this.renderErrorMessage(
            <FormattedMessage id="Error.BadCollectiveType" defaultMessage="This profile type is not supported" />,
          );
      }
    } else if (
      get(data, 'error.message', '').includes('No collective found') ||
      get(data, 'error.message', '').includes('Accounts not found') ||
      get(error, 'message', '').includes('Accounts not found') ||
      get(error, 'message', '').includes('No collective found')
    ) {
      return <NotFound searchTerm={get(this.props.data, 'variables.slug')} />;
    }

    // If error message is provided, we display it. This behaviour should be deprecated
    // as we loose the context of the page where the error took place.
    if (this.props.message) {
      return this.renderErrorMessage(this.props.message);
    }

    return this.unknownError();
  }

  renderErrorMessage(message) {
    return (
      <div className="flex w-full flex-col items-center justify-center px-4 py-8">
        <div className="mb-8">
          <MessageBox type="error" withIcon>
            {message}
          </MessageBox>
        </div>
        <Button size="lg" onClick={() => this.props.router.back()}>
          &larr; <FormattedMessage id="error.goBack" defaultMessage="Go back to the previous page" />
        </Button>
      </div>
    );
  }

  networkError() {
    return (
      <div className="flex w-full flex-col items-center justify-center px-4 py-8" data-cy="not-found">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <Image src="/static/images/unexpected-error.png" alt="" width={312} height={202} className="h-auto w-auto" />
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold">
              <FormattedMessage defaultMessage="Network error" id="BrdgZE" />
            </h2>
            <p className="text-muted-foreground">
              <FormattedMessage
                id="Error.Network"
                defaultMessage="A network error occurred, please check your connectivity or try again later"
              />
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => location.reload()}>
              <RefreshCw className="mr-1 h-4 w-4" />
              <FormattedMessage id="error.reload" defaultMessage="Reload the page" />
            </Button>
            <Link href="/help">
              <Button size="sm" variant="outline">
                <CircleHelp className="mr-1 h-4 w-4" />
                <FormattedMessage defaultMessage="Check Help & Support" id="DashboardErrorBoundary.HelpSupport" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  unknownError() {
    const message = get(this.props, 'data.error.message');
    const stackTrace = get(this.props, 'data.error.stack');
    const expandError = process.env.OC_ENV !== 'production';
    const fontSize = ['ci', 'e2e', 'test'].includes(process.env.OC_ENV) ? 22 : 13;
    const toBase64 = str => Buffer.from(str).toString('base64');
    const formatStacktrace = () => (process.env.OC_ENV === 'production' ? toBase64(stackTrace) : stackTrace);
    return (
      <div className="flex w-full flex-col items-center justify-center px-4 py-8" data-cy="not-found">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <Image src="/static/images/unexpected-error.png" alt="" width={312} height={202} className="h-auto w-auto" />
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold">
              <FormattedMessage defaultMessage="Something went wrong" id="SectionError.Title" />
            </h2>
            <p className="text-muted-foreground">
              <FormattedMessage
                defaultMessage="We encountered an issue loading this {type,select,section{section}other{page}}. Please reload the page or contact support if the problem persists."
                id="+SSp9V"
                values={{ type: 'page' }}
              />
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="sm" onClick={() => location.reload()}>
              <RefreshCw className="mr-1 h-4 w-4" />
              <FormattedMessage id="error.reload" defaultMessage="Reload the page" />
            </Button>
            <Link href="/help">
              <Button size="sm" variant="outline">
                <CircleHelp className="mr-1 h-4 w-4" />
                <FormattedMessage defaultMessage="Check Help & Support" id="DashboardErrorBoundary.HelpSupport" />
              </Button>
            </Link>
          </div>
          {(stackTrace || message) && (
            <div className="mt-4 w-full max-w-2xl">
              <details open={expandError}>
                <summary className="mb-3 cursor-pointer text-center text-sm font-medium">
                  <FormattedMessage id="error.details" defaultMessage="Error details" />
                </summary>
                <div>
                  {message && (
                    <div className="mb-4">
                      <p className="mb-1 font-semibold">
                        <FormattedMessage id="Contact.Message" defaultMessage="Message" />
                      </p>
                      <pre className="font-mono break-words whitespace-pre-wrap" style={{ fontSize }}>
                        {message}
                      </pre>
                    </div>
                  )}
                  {stackTrace && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm">
                          <FormattedMessage
                            defaultMessage="Please share these details when contacting support"
                            id="UFh1Me"
                          />
                        </p>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            const formattedMessage = `Error: ${message || ''}`;
                            const formattedDetails = `Details: ${formatStacktrace()}`;
                            copy(`${formattedMessage}\n${formattedDetails}`);
                            this.setState({ copiedErrorMessage: true });
                            setTimeout(() => this.setState({ copiedErrorMessage: false }), 2000);
                          }}
                        >
                          {this.state.copiedErrorMessage ? (
                            <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
                          ) : (
                            <FormattedMessage id="Clipboard.CopyShort" defaultMessage="Copy" />
                          )}
                        </Button>
                      </div>
                      <p className="mb-1 font-semibold">
                        <FormattedMessage id="Details" defaultMessage="Details" />
                      </p>
                      <pre
                        className="max-h-[400px] overflow-y-auto font-mono break-words whitespace-pre-wrap select-all"
                        style={{ fontSize }}
                      >
                        {formatStacktrace()}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    const { LoggedInUser } = this.props;

    const component = this.getErrorComponent();

    return (
      <div className="ErrorPage" data-cy="error-page">
        <Header LoggedInUser={LoggedInUser} noRobots />
        <Body>
          <div className="py-12 md:py-16">{component}</div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withUser(withRouter(ErrorPage));
