import React from 'react';
import PropTypes from 'prop-types';
import { Support } from '@styled-icons/boxicons-regular/Support';
import { Redo } from '@styled-icons/fa-solid/Redo';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { ERROR } from '../lib/errors';
import { Router } from '../server/pages';

import Body from './Body';
import Container from './Container';
import Footer from './Footer';
import { Flex } from './Grid';
import Header from './Header';
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
    /** If true, a loading indicator will be displayed instad of an error */
    loading: PropTypes.bool,
    /** Define if error should be logged to console. Default: true */
    log: PropTypes.bool,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
    /** @deprecated please generate errors with the `createError` helper  */
    message: PropTypes.string,
    /** @deprecated please generate errors with the `createError` helper */
    data: PropTypes.object, // we can pass the data object of Apollo to detect and handle GraphQL errors
  };

  getErrorComponent() {
    const { error, data, loading, log = true } = this.props;

    if (log && get(data, 'error')) {
      if (data.error.message !== 'Test error') {
        // That might not be the right place to log the error. Remove?
        // eslint-disable-next-line no-console
        console.error(data.error);
      }
    }

    if (get(data, 'error.networkError')) {
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
        <StyledButton buttonSize="large" buttonStyle="primary" onClick={() => Router.back()}>
          &larr; <FormattedMessage id="error.goBack" defaultMessage="Go back to the previous page" />
        </StyledButton>
      </Flex>
    );
  }

  networkError() {
    return (
      <Flex flexDirection="column" alignItems="center" px={2} py={6}>
        <H1 fontSize={30} textAlign="center">
          <FormattedMessage id="page.error.networkError" defaultMessage="Open Collective is momentarily unreachable" />
          &nbsp; 🙀
        </H1>
        <Flex mt={3}>
          <P textAlign="center">
            <FormattedMessage
              id="page.error.networkError.description"
              defaultMessage="Don't worry! One of our engineers is probably already on it 👩🏻‍💻👨🏿‍💻. Please try again later. Thank you for your patience 🙏 (and sorry for the inconvenience!)"
            />
          </P>
        </Flex>
      </Flex>
    );
  }

  unknownError() {
    const message = get(this.props, 'data.error.message');
    const stackTrace = get(this.props, 'data.error.stack');
    const expandError = process.env.OC_ENV !== 'production';
    const fontSize = ['ci', 'e2e', 'test'].includes(process.env.OC_ENV) ? 22 : 13;

    return (
      <Flex flexDirection="column" alignItems="center" px={2} py={[4, 6]}>
        <H1 fontSize={30} textAlign="center">
          <FormattedMessage id="error.unexpected" defaultMessage="Oops, an unexpected error seems to have occurred" />
          &nbsp; 🤕
        </H1>
        <Flex mt={5} flexWrap="wrap" alignItems="center" justifyContent="center">
          <StyledLink my={2} href="mailto:support@opencollective.com" mx={2} buttonStyle="standard" buttonSize="large">
            <Support size="1em" /> <FormattedMessage id="error.contactSupport" defaultMessage="Contact support" />
          </StyledLink>
          <StyledButton my={2} mx={2} buttonSize="large" onClick={() => location.reload()}>
            <Redo size="0.8em" /> <FormattedMessage id="error.reload" defaultMessage="Reload the page" />
          </StyledButton>
        </Flex>
        {(stackTrace || message) && (
          <Container mt={5} maxWidth={1200}>
            <details open={expandError}>
              <summary style={{ textAlign: 'center', marginBottom: 12 }}>
                <FormattedMessage id="error.details" defaultMessage="Error details" />
              </summary>
              <Container p={3}>
                {message && (
                  <React.Fragment>
                    <strong>Message</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize }}>{message}</pre>
                    <br />
                  </React.Fragment>
                )}
                {stackTrace && (
                  <React.Fragment>
                    <strong>Trace</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize }}>{stackTrace}</pre>
                  </React.Fragment>
                )}
              </Container>
            </details>
          </Container>
        )}
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

export default withUser(ErrorPage);
