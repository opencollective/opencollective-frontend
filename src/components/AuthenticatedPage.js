import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';

import { withUser } from './UserProvider';
import Page from './Page';
import Loading from './Loading';
import MessageBox from './MessageBox';
import SignInOrJoinFree from './SignInOrJoinFree';

/**
 * A wrapper arround `Page` that will display a spinner while user is loading.
 * If authentication fails, users will be prompted with a form to login that will
 * redirect them to the correct page once they do.
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
    children: PropTypes.func,
    /** @ignore from withUser */
    loadingLoggedInUser: PropTypes.bool,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
  };

  renderContent(loadingLoggedInUser, LoggedInUser) {
    if (!LoggedInUser) {
      return (
        <Flex justifyContent="center" my={[5, null, 6]} px={2}>
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
              <SignInOrJoinFree />
            </Flex>
          )}
        </Flex>
      );
    } else {
      return this.props.children(LoggedInUser);
    }
  }

  render() {
    const { LoggedInUser, loadingLoggedInUser, ...pageProps } = this.props;

    return <Page {...pageProps}>{this.renderContent(loadingLoggedInUser, LoggedInUser)}</Page>;
  }
}

export default withUser(AuthenticatedPage);
