import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { getDashboardRoute } from '../lib/url-helpers';

import AuthenticatedPage from '../components/AuthenticatedPage';
import { Flex } from '../components/Grid';
import MessageBox from '../components/MessageBox';
import StyledButton from '../components/StyledButton';
import StyledLink from '../components/StyledLink';

class Apps extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
  };

  render() {
    return (
      <AuthenticatedPage title="Applications">
        {LoggedInUser => (
          <Flex flexDirection="column" alignItems="center" justifyContent="center" width={1} my={5}>
            <MessageBox type="info" withIcon>
              <FormattedMessage
                defaultMessage="Applications have been deprecated in favor of personal token"
                id="wQEy7N"
              />
            </MessageBox>
            <StyledLink href={getDashboardRoute(LoggedInUser.collective, 'for-developers')}>
              <StyledButton buttonStyle="primary" buttonSize="medium" mt={3}>
                <FormattedMessage defaultMessage="View personal tokens" id="vaSCOx" />
              </StyledButton>
            </StyledLink>
          </Flex>
        )}
      </AuthenticatedPage>
    );
  }
}

// next.js export
// ts-unused-exports:disable-next-line
export default Apps;
