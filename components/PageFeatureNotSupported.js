import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { Flex } from './Grid';
import { I18nSupportLink } from './I18nFormatters';
import Page from './Page';
import { H1, P } from './Text';

/**
 * A page to show when the feature is not supported by the collective.
 * Ensures the page is not referenced by robots.
 */
const PageFeatureNotSupported = ({ showContactSupportLink, ...props }) => {
  const { formatMessage } = useIntl();
  const title = formatMessage({ id: 'FeatureNotSupported.title', defaultMessage: 'Page inaccessible' });
  return (
    <Page noRobots title={title} {...props}>
      <Flex flexDirection="column" justifyContent="center" alignItems="center" px={2} py={[5, 6]}>
        <H1 fontSize="38px" mb={3} textAlign="center">
          {title}
        </H1>
        <P fontSize="64px" mt={3} mb={5}>
          <span role="img" aria-label="Monkey Face">
            🙈️
          </span>
        </P>
        <P>
          <FormattedMessage
            id="FeatureNotSupported.description"
            defaultMessage="This page has not been activated for this Collective or you don't have permission to see it."
          />
          {showContactSupportLink && (
            <React.Fragment>
              {' '}
              <FormattedMessage
                id="ContactSupportForDetails"
                defaultMessage="Please contact <SupportLink>support</SupportLink> for more details."
                values={{ SupportLink: I18nSupportLink }}
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
