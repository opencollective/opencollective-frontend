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
const LinkCollective = ({ collective: { type, slug, name, parentCollective }, children, isNewVersion, ...props }) => {
  return type !== 'EVENT' ? (
    <Link route={isNewVersion ? 'new-collective-page' : 'collective'} params={{ slug }} {...props}>
      {children || name || slug}
    </Link>
  ) : (
    <Link
      route="event"
      params={{ eventSlug: slug, parentCollectiveSlug: getEventParentCollectiveSlug(parentCollective) }}
      {...props}
    >
      {children || name || slug}
    </Link>
  );
};

LinkCollective.propTypes = {
  /** The collective to link to */
  collective: PropTypes.shape({
    name: PropTypes.string,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }).isRequired,
  /** If not given, will render the name of the collective */
  children: PropTypes.node,
  /** Link to the new collective page */
  isNewVersion: PropTypes.bool,
};

export default LinkCollective;
