import React from 'react';
import PropTypes from 'prop-types';
import { get, truncate } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';
import { Router } from '../server/pages';

import { Support } from 'styled-icons/boxicons-regular/Support';
import { Github } from 'styled-icons/fa-brands/Github';
import { Redo } from 'styled-icons/fa-solid/Redo';

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

class ErrorPage extends React.Component {
  static propTypes = {
    message: PropTypes.string,
    loading: PropTypes.bool,
    data: PropTypes.object, // we can pass the data object of Apollo to detect and handle GraphQL errors
    LoggedInUser: PropTypes.object,
    /** Define if error should be logged to console. Default: true */
    log: PropTypes.bool,
  };

  getErrorComponent() {
    const { data, loading, log = true } = this.props;

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

    if (get(data, 'error.message', '').includes('No collective found')) {
      return <NotFound slug={get(this.props.data, 'variables.slug')} />;
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
          <div className="content">{component}</div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default ErrorPage;
