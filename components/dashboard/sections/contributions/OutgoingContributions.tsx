import React from 'react';

import OutgoingContributionsForHosted from './OutgoingContributionsForHosted';
import OutgoingContributionsForOrganizations from './OutgoingContributionsForOrganizations';

const OutgoingContributions = ({ account }) => {
  if (account.type === 'ORGANIZATION') {
    return <OutgoingContributionsForOrganizations accountSlug={account.slug} />;
  } else {
    return <OutgoingContributionsForHosted accountSlug={account.slug} />;
  }
};

export default OutgoingContributions;
