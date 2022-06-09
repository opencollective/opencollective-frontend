import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Container from './Container';
import { Flex } from './Grid';
import Loading from './Loading';
import MessageBox from './MessageBox';
import Page from './Page';
import SignInOrJoinFreeV2 from './SignInOrJoinFreeV2';
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
 * <AuthenticatedPageV2>
 *   {(LoggedInUser) => (
 *     <div>
 *       Hello {LoggedInUser.collective.name}!
 *     </div>
 *   )}
 * </AuthenticatedPageV2>
 * ```
 */
class AuthenticatedPageV2 extends React.Component {
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
  };

  renderContent(loadingLoggedInUser, LoggedInUser) {
    if (!LoggedInUser) {
      return (
        <Container mt="128px" mb="128px">
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
              <SignInOrJoinFreeV2
                form="signinv2"
                routes={{ signin: '/signinv2', join: '/create-accountv2' }}
                disableSignup={this.props.disableSignup}
              />
            </Flex>
          )}
        </Container>
      );
    } else if (this.props.rootOnly && !LoggedInUser.isRoot()) {
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

    return (
      <Page
        showSearch={false}
        showFooter={false}
        noRobots
        {...pageProps}
        menuItems={{ discover: false, docs: false, howItWorks: false, pricing: false }}
        showProfileMenu={false}
      >
        {this.renderContent(loadingLoggedInUser, LoggedInUser)}
      </Page>
    );
  }
}

export default withUser(AuthenticatedPageV2);
