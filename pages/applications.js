import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { PREVIEW_FEATURE_KEYS } from '../lib/preview-features';
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
              <FormattedMessage defaultMessage="Applications have been deprecated in favor of personal token" />
            </MessageBox>
            <StyledLink
              href={
                LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DASHBOARD)
                  ? getDashboardRoute(LoggedInUser.collective, 'for-developers')
                  : `/${LoggedInUser.collective.slug}/admin/for-developers`
              }
            >
              <StyledButton buttonStyle="primary" buttonSize="medium" mt={3}>
                <FormattedMessage defaultMessage="View personal tokens" />
              </StyledButton>
            </StyledLink>
          </Flex>
        )}
      </AuthenticatedPage>
    );
  }
}

// ignore unused exports default
// next.js export
export default Apps;
