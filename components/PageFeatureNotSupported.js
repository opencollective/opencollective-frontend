import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { Flex } from './Grid';
import Page from './Page';
import { H1, P } from './Text';

const messages = defineMessages({
  title: {
    id: 'FeatureNotSupported.title',
    defaultMessage: 'Feature not supported',
  },
});

/**
 * A page to show when the feature is not supported by the collective.
 * Ensures the page is not referenced by robots.
 */
const PageFeatureNotSupported = ({ showContactSupportLink, ...props }) => {
  const { formatMessage } = useIntl();
  const title = formatMessage(messages.title);
  return (
    <Page noRobots title={title} {...props}>
      <Flex flexDirection="column" justifyContent="center" alignItems="center" px={2} py={[5, 6]}>
        <H1 mb={3} textAlign="center">
          {title}
        </H1>
        <P fontSize="64px" mt={3} mb={5}>
          🙈️
        </P>
        <P>
          <FormattedMessage
            id="FeatureNotSupported.description"
            defaultMessage="This feature has not been activated for this Collective."
          />
          {showContactSupportLink && (
            <React.Fragment>
              {' '}
              <FormattedMessage
                id="ContactSupportForDetails"
                defaultMessage="Please contact support@opencollective.com for more details."
              />
            </React.Fragment>
          )}
        </P>
      </Flex>
    </Page>
  );
};

PageFeatureNotSupported.propTypes = {
  showContactSupportLink: PropTypes.bool,
};

PageFeatureNotSupported.defaultProps = {
  showContactSupportLink: true,
};

export default PageFeatureNotSupported;
