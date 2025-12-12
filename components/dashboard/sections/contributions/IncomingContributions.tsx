import React from 'react';

import IncomingContributionsForHosted from './IncomingContributionsForHosted';
import IncomingContributionsForOrganizations from './IncomingContributionsForOrganizations';

const IncomingContributions = ({ account }) => {
  if (account.type === 'ORGANIZATION') {
    return <IncomingContributionsForOrganizations accountSlug={account.slug} />;
  } else {
    return <IncomingContributionsForHosted accountSlug={account.slug} />;
  }
};

export default IncomingContributions;
