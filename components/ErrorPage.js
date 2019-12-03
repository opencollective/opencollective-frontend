import React from 'react';
import PropTypes from 'prop-types';
import { get, truncate } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';
import { Router } from '../server/pages';

import { Support } from '@styled-icons/boxicons-regular/Support';
import { Github } from '@styled-icons/fa-brands/Github';
import { Redo } from '@styled-icons/fa-solid/Redo';

import { objectToQueryString } from '../lib/url_helpers';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import Loading from './Loading';
import NotFound from './NotFound';
import { H1, P } from './Text';
import StyledButton from './StyledButton';
import Container from './Container';
import StyledLink from './StyledLink';
import MessageBox from './MessageBox';
import { withUser } from './UserProvider';

const ErrorTypes = {
  NOT_FOUND: 'NOT_FOUND',
};

/** Error generators to be passed with the `error` prop of `ErrorPage` */
export const generateError = {
  /**
   * Generate a error for when an entity is not found. If a search term is provided, it will
   * be used to show a button to propose user to search the item.
   * */
  notFound: searchTerm => {
    return { type: ErrorTypes.NOT_FOUND, payload: { searchTerm } };
  },
};

/**
 * A flexible error page
 */
class ErrorPage extends React.Component {
  static propTypes = {
    /** Customize the error type. Check `generateError.*` functions for more info */
    error: PropTypes.shape({
      type: PropTypes.oneOf(Object.values(ErrorTypes)),
      payload: PropTypes.object,
    }),
    /** If true, a loading indicator will be displayed instad of an error */
    loading: PropTypes.bool,
    /** Define if error should be logged to console. Default: true */
    log: PropTypes.bool,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
    /** @deprecated please generate errors with the `generateError` helper  */
    message: PropTypes.string,
    /** @deprecated please generate errors with the `generateError` helper */
    data: PropTypes.object, // we can pass the data object of Apollo to detect and handle GraphQL errors
  };

  getErrorComponent() {
    const { error, data, loading, log = true } = this.props;

    if (log && get(data, 'error')) {
      if (data.error.message !== 'Test error') {
        // That might not be the right place to log the error. Remove?
        console.error(data.error);
      }
    }

    if (get(data, 'error.networkError')) {
      return this.networkError();
    }

    if (loading || get(data, 'loading')) {
      return <Loading />;
    }

    if (error && error.type === ErrorTypes.NOT_FOUND) {
      return <NotFound searchTerm={get(error.payload, 'searchTerm')} />;
    } else if (get(data, 'error.message', '').includes('No collective found')) {
      return <NotFound searchTerm={get(this.props.data, 'variables.slug')} />;
    }

    // If error message is provided, we display it. This behaviour should be deprecated
    // as we loose the context of the page where the error took place.
    if (this.props.message) {
      return (
        <Flex flexDirection="column" alignItems="center" px={2} py={6}>
          <MessageBox type="error" withIcon mb={5}>
            {this.props.message}
          </MessageBox>
          <StyledButton buttonSize="large" buttonStyle="primary" onClick={() => Router.back()}>
            &larr; <FormattedMessage id="error.goBack" defaultMessage="Go back to previous page" />
          </StyledButton>
        </Flex>
      );
    }

    return this.unknownError();
  }

  networkError() {
    return (
      <Flex flexDirection="column" alignItems="center" px={2} py={6}>
        <H1 fontSize={30}>
          <FormattedMessage
            id="page.error.networkError"
            defaultMessage="The Open Collective Server is momentarily unreachable"
          />
          &nbsp; 🙀
        </H1>
        <Flex mt={3}>
          <P textAlign="center">
            <FormattedMessage
              id="page.error.networkError.description"
              defaultMessage="Worry not! One of our engineers is probably already on it  👩🏻‍💻👨🏿‍💻. Please try again later. Thank you for your patience 🙏 (and sorry for the inconvenience!)"
            />
          </P>
        </Flex>
      </Flex>
    );
  }

  getGithubIssueURL(stackTrace) {
    const navigatorInfo = typeof navigator === 'undefined' ? {} : navigator;
    const pageUrl = typeof window === 'undefined' ? '___________' : window.location;

    const title = 'Unexpected error when ___________';
    const body = `
# Describe the bug

<!-- A clear and concise description of what the bug is. -->
<!-- If applicable, add screenshots to help explain your problem. -->

I got an unexpected error on ${pageUrl} while I was trying to __________

# To Reproduce

<!-- Steps to reproduce the behavior -->

1. Go to ________
2. Click on ________
3. Scroll down to ________
4. See error

# Device
- OS: ${navigatorInfo.platform}
- Browser: \`${navigatorInfo.appVersion}\`

# Technical details

<!-- PLEASE REMOVE ANY PERSONAL INFORMATION FROM THE LOGS BELOW -->

\`\`\`
${truncate(stackTrace, { length: 6000 })}
\`\`\`
    `;
    return `https://github.com/opencollective/opencollective/issues/new${objectToQueryString({ title, body })}`;
  }

  unknownError() {
    const message = get(this.props, 'data.error.message');
    const stackTrace = get(this.props, 'data.error.stack');
    const expandError = process.env.NODE_ENV !== 'production';
    const fontSize = ['circleci', 'test'].includes(process.env.NODE_ENV) ? 22 : 13;

    return (
      <Flex flexDirection="column" alignItems="center" px={2} py={[4, 6]}>
        <H1 fontSize={30}>
          <FormattedMessage id="error.unexpected" defaultMessage="Ooops, an unexpected error seems to have occurred" />
          &nbsp; 🤕
        </H1>
        <Flex mt={5} flexWrap="wrap" alignItems="center" justifyContent="center">
          <StyledLink my={2} href="mailto:support@opencollective.com" mx={2} buttonStyle="standard" buttonSize="large">
            <Support size="1em" /> <FormattedMessage id="error.contactSupport" defaultMessage="Contact support" />
          </StyledLink>
          <StyledLink my={2} href={this.getGithubIssueURL(stackTrace)} mx={2} buttonStyle="standard" buttonSize="large">
            <Github size="1em" /> <FormattedMessage id="error.addOnGithub" defaultMessage="Add an issue on Github" />
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
      <div className="ErrorPage">
        <Header LoggedInUser={LoggedInUser} />
        <Body>
          <Container borderTop="1px solid #E8E9EB" py={[5, 6]}>
            {component}
          </Container>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withUser(ErrorPage);
