import React from 'react';
import PropTypes from 'prop-types';
import { Support } from '@styled-icons/boxicons-regular/Support';
import { Redo } from '@styled-icons/fa-solid/Redo';
import copy from 'copy-to-clipboard';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { ERROR } from '../lib/errors';

import Footer from './navigation/Footer';
import Body from './Body';
import Container from './Container';
import { ErrorFallbackLinks } from './ErrorFallbackLinks';
import { Box, Flex } from './Grid';
import Header from './Header';
import Image from './Image';
import Link from './Link';
import Loading from './Loading';
import MessageBox from './MessageBox';
import NotFound from './NotFound';
import StyledButton from './StyledButton';
import StyledLink from './StyledLink';
import { H1, P } from './Text';
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

  state = { copied: false };

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

    if (error) {
      switch (error.type) {
        case ERROR.NOT_FOUND:
          return <NotFound searchTerm={get(error.payload, 'searchTerm')} />;
        case ERROR.BAD_COLLECTIVE_TYPE:
          return this.renderErrorMessage(
            <FormattedMessage id="Error.BadCollectiveType" defaultMessage="This profile type is not supported" />,
          );
      }
    } else if (get(data, 'error.message', '').includes('No collective found')) {
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
      <Flex flexDirection="column" alignItems="center" px={2} py={6}>
        <MessageBox type="error" withIcon mb={5}>
          {message}
        </MessageBox>
        <StyledButton buttonSize="large" buttonStyle="primary" onClick={() => this.props.router.back()}>
          &larr; <FormattedMessage id="error.goBack" defaultMessage="Go back to the previous page" />
        </StyledButton>
      </Flex>
    );
  }

  networkError() {
    return (
      <Flex data-cy="not-found" flexDirection="column" alignItems="center" p={2}>
        <Image src="/static/images/unexpected-error.png" alt="" width={624} height={403} />
        <H1 textAlign="center" mt={3} fontSize="40px" fontWeight="700">
          <FormattedMessage defaultMessage="Network error" />
        </H1>
        <Box maxWidth={550}>
          <P my="24px" fontSize="20px" fontWeight="500" color="black.800" textAlign="center">
            <FormattedMessage
              id="Error.Network"
              defaultMessage="A network error occurred, please check your connectivity or try again later"
            />
          </P>
        </Box>
        <Box>
          <P fontSize="16px" fontWeight="500" color="black.800" mb="16px" textAlign="center">
            <FormattedMessage defaultMessage="Here are some helpful links instead:" />
          </P>
          <ErrorFallbackLinks />
        </Box>
      </Flex>
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
      <Flex data-cy="not-found" flexDirection="column" alignItems="center" p={2}>
        <Image src="/static/images/unexpected-error.png" alt="" width={624} height={403} />
        <H1 textAlign="center" mt={3} fontSize="40px" fontWeight="700">
          <FormattedMessage defaultMessage="Unexpected error" />
        </H1>
        <P my="24px" fontSize="20px" fontWeight="500" color="black.800" textAlign="center">
          <FormattedMessage defaultMessage="Something went wrong, please refresh or try something else" />
        </P>
        <Box>
          <Flex mt={5} flexWrap="wrap" alignItems="center" justifyContent="center">
            <StyledLink my={2} as={Link} href="/contact" mx={2} buttonStyle="standard" buttonSize="large">
              <Support size="1em" /> <FormattedMessage id="error.contactSupport" defaultMessage="Contact support" />
            </StyledLink>
            <StyledButton my={2} mx={2} buttonSize="large" onClick={() => location.reload()}>
              <Redo size="0.8em" /> <FormattedMessage id="error.reload" defaultMessage="Reload the page" />
            </StyledButton>
          </Flex>
          {(stackTrace || message) && (
            <Container mt={5} maxWidth={800}>
              <details open={expandError}>
                <summary style={{ textAlign: 'center', marginBottom: 12 }}>
                  <FormattedMessage id="error.details" defaultMessage="Error details" />
                </summary>
                <Container p={3}>
                  {message && (
                    <React.Fragment>
                      <P fontWeight="bold" mb={1}>
                        <FormattedMessage id="Contact.Message" defaultMessage="Message" />
                      </P>
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize }}>{message}</pre>
                      <br />
                    </React.Fragment>
                  )}
                  {stackTrace && (
                    <React.Fragment>
                      <P fontWeight="bold" mb={1}>
                        <FormattedMessage id="Details" defaultMessage="Details" />
                      </P>
                      <Flex justifyContent="space-between" alignItems="center" mb={2}>
                        <FormattedMessage defaultMessage="Please share these details when contacting support" />
                        <StyledButton
                          buttonSize="tiny"
                          onClick={() => {
                            const formattedMessage = `Error: ${message}`;
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
                        </StyledButton>
                      </Flex>
                      <P
                        as="pre"
                        whiteSpace="pre-wrap"
                        fontSize={fontSize}
                        css={{
                          userSelect: 'all',
                          maxHeight: 400,
                          overflowY: 'auto',
                        }}
                      >
                        {formatStacktrace()}
                      </P>
                    </React.Fragment>
                  )}
                </Container>
              </details>
            </Container>
          )}
        </Box>
      </Flex>
    );
  }

  render() {
    const { LoggedInUser } = this.props;

    const component = this.getErrorComponent();

    return (
      <div className="ErrorPage" data-cy="error-page">
        <Header LoggedInUser={LoggedInUser} />
        <Body>
          <Container py={[5, 6]}>{component}</Container>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withUser(withRouter(ErrorPage));
