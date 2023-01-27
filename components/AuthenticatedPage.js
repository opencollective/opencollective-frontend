import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Container from './Container';
import { Flex } from './Grid';
import Loading from './Loading';
import MessageBox from './MessageBox';
import Page from './Page';
import SignInOrJoinFree from './SignInOrJoinFree';
import { withUser } from './UserProvider';

/**
 * A wrapper around `Page` that will display a spinner while user is loading.
 * If authentication fails, users will be prompted with a form to login that will
 * redirect them to the correct page once they do.
 *
 * Unless a `noRobots={true}` is provided, pages wrapped with this helper will not be indexed
 * by default.
 *
 * ## Usage
 *
 * ```jsx
 * <AuthenticatedPage>
 *   {(LoggedInUser) => (
 *     <div>
 *       Hello {LoggedInUser.collective.name}!
 *     </div>
 *   )}
 * </AuthenticatedPage>
 * ```
 */
class AuthenticatedPage extends React.Component {
  static propTypes = {
    /** A child renderer to call when user is properly authenticated */
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    /** Whether user can signup on this page */
    disableSignup: PropTypes.bool,
    /** Whether this page is limited to root users */
    rootOnly: PropTypes.bool,
    /** @ignore from withUser */
    loadingLoggedInUser: PropTypes.bool,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
    /* Title for the page */
    title: PropTypes.string,
  };

  renderContent(loadingLoggedInUser, LoggedInUser) {
    if (!LoggedInUser) {
      return (
        <Container display="flex" justifyContent="center" py={[5, null, 6]} px={2}>
          {loadingLoggedInUser ? (
            <Loading />
          ) : (
            <Flex flexDirection="column" alignItems="center">
              <MessageBox type="warning" mb={4} maxWidth={400} withIcon>
                <FormattedMessage
                  id="authorization.loginRequired"
                  defaultMessage="You need to be logged in to continue."
                />
              </MessageBox>
              <SignInOrJoinFree defaultForm="signin" disableSignup={this.props.disableSignup} />
            </Flex>
          )}
        </Container>
      );
    } else if (this.props.rootOnly && !LoggedInUser.isRoot) {
      return (
        <Flex flexDirection="column" alignItems="center">
          <MessageBox type="warning" my={[5, 6, 7]} maxWidth={400} withIcon>
            <FormattedMessage
              id="AuthenticatedPage.RootOnly"
              defaultMessage="This page is limited to site administrators"
            />
          </MessageBox>
        </Flex>
      );
    } else if (typeof this.props.children === 'function') {
      return this.props.children(LoggedInUser);
    } else {
      return this.props.children;
    }
  }

  render() {
    const { LoggedInUser, loadingLoggedInUser, ...pageProps } = this.props;

    const title = !title ? null : LoggedInUser ? this.props.title : `${this.props.title} - Open Collective - Sign In`; // 1password works better with this

    return (
      <Page noRobots {...pageProps} title={title}>
        {this.renderContent(loadingLoggedInUser, LoggedInUser)}
      </Page>
    );
  }
}

export default withUser(AuthenticatedPage);
