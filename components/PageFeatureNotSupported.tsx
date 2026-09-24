import React from 'react';
import { useIntl } from 'react-intl';

import FeatureNotSupported from './FeatureNotSupported';
import Page from './Page';

interface PageFeatureNotSupportedProps {
  showContactSupportLink?: boolean;
}

/**
 * A page to show when the feature is not supported by the collective.
 * Ensures the page is not referenced by robots.
 */
const PageFeatureNotSupported = ({ showContactSupportLink = false, ...props }: PageFeatureNotSupportedProps) => {
  const { formatMessage } = useIntl();
  const title = formatMessage({ defaultMessage: 'Access denied', id: 'T26lW2' });
  return (
    <Page noRobots title={title} {...props}>
      <FeatureNotSupported showContactSupportLink={showContactSupportLink} />
    </Page>
  );
};

export default PageFeatureNotSupported;
