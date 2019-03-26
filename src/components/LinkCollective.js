import React from 'react';
import PropTypes from 'prop-types';

import Link from './Link';

/**
 * Returns event's parent collective slug. If the parent is not available,
 * fallback on `collective` slug which will result in a valid URL: parent
 * collective slug is only used to generate pretty URLs.
 */
const getEventParentCollectiveSlug = parentCollective => {
  return parentCollective && parentCollective.slug ? parentCollective.slug : 'collective';
};

/**
 * Create a `Link` to the collective, properly switching between `event` and `collective`
 * routes based on collective type.
 */
const LinkCollective = ({ collective: { type, slug, parentCollective }, ...props }) => {
  return type !== 'EVENT' ? (
    <Link route="collective" params={{ slug }} {...props} />
  ) : (
    <Link
      route="event"
      params={{ eventSlug: slug, parentCollectiveSlug: getEventParentCollectiveSlug(parentCollective) }}
      {...props}
    />
  );
};

LinkCollective.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }).isRequired,
};

export default LinkCollective;
