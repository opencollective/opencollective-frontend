import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

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
 * Create a `Link` to the collective based on collective type.
 * It properly deals with type `EVENT` and `isIncognito`
 */
const LinkCollective = ({ target, title, collective, children, ...props }) => {
  if (!collective || collective.isIncognito) {
    return children || <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />;
  }
  if (!collective.slug) {
    return children || collective.name;
  }

  const { type, slug, name, parentCollective, isIncognito } = collective;
  if (type === 'USER' && (!name || isIncognito || !slug)) {
    return children || <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />;
  }
  return type !== 'EVENT' ? (
    <Link route="collective" params={{ slug }} {...props} title={title || name} target={target} passHref>
      {children || name || slug}
    </Link>
  ) : (
    <Link
      route="event"
      params={{ slug, parentCollectiveSlug: getEventParentCollectiveSlug(parentCollective) }}
      title={title || name}
      target={target}
      {...props}
      passHref
    >
      {children || name || slug}
    </Link>
  );
};

LinkCollective.propTypes = {
  /** The collective to link to */
  collective: PropTypes.shape({
    name: PropTypes.string,
    slug: PropTypes.string,
    type: PropTypes.string,
    isIncognito: PropTypes.bool,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }),
  /** If not given, will render the name of the collective */
  children: PropTypes.node,
  title: PropTypes.string,
  target: PropTypes.string,
};

export default LinkCollective;
