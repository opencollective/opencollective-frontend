import React from 'react';
import { truncate } from 'lodash';

import { ContributionTypes } from '../../lib/constants/contribution-types';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import Contribute from './Contribute';

/**
 * A contribute card specialized to display a collective. Useful to display child collectives.
 */
const ContributeCollective = ({ collective, ...props }) => {
  const description = truncate(collective.description, { length: 100 });
  return (
    <Contribute
      route={getCollectivePageRoute(collective)}
      type={ContributionTypes.CHILD_COLLECTIVE}
      title={collective.name}
      contributors={collective.contributors}
      stats={collective.stats.backers}
      image={collective.backgroundImageUrl}
      {...props}
    >
      {description}
    </Contribute>
  );
};

export default ContributeCollective;
