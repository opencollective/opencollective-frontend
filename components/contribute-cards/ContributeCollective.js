import React from 'react';
import PropTypes from 'prop-types';
import { truncate } from 'lodash';

import { ContributionTypes } from '../../lib/constants/contribution-types';

import Contribute from './Contribute';

/**
 * A contribute card specialized to display a collective. Useful to display child collectives.
 */
const ContributeCollective = ({ collective, ...props }) => {
  const description = truncate(collective.description, { length: 100 });
  return (
    <Contribute
      route={`/${collective.slug}`}
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

ContributeCollective.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    description: PropTypes.string,
    backgroundImageUrl: PropTypes.string,
    contributors: PropTypes.arrayOf(PropTypes.object),
    stats: PropTypes.shape({
      backers: PropTypes.object,
    }).isRequired,
  }),
};

export default ContributeCollective;
