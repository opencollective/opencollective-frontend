import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import { getCollectivePageRoute } from '../lib/url-helpers';

import Link from './Link';

/**
 * Create a `Link` to the collective based on collective type.
 * It properly deals with type `EVENT` and `isIncognito`
 */
const LinkCollective = ({ target, title, noTitle, collective, children, ...props }) => {
  if (!collective || collective.isIncognito) {
    return children || <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />;
  } else if (collective.isGuest) {
    if (children) {
      return children;
    } else if (collective.name === 'Guest') {
      return <FormattedMessage id="profile.guest" defaultMessage="Guest" />;
    } else {
      return collective.name;
    }
  } else if (!collective.slug || collective.type === 'VENDOR') {
    return children || collective.name;
  }

  const { type, slug, name, isIncognito } = collective;
  if (type === 'USER' && (!name || isIncognito || !slug)) {
    return children || <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />;
  }
  return ![CollectiveType.EVENT, CollectiveType.PROJECT].includes(type) ? (
    <Link href={`/${slug}`} {...props} title={noTitle ? null : title || name} target={target}>
      {children || name || slug}
    </Link>
  ) : (
    <Link
      href={`${getCollectivePageRoute(collective)}`}
      title={noTitle ? null : title || name}
      target={target}
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
    slug: PropTypes.string,
    type: PropTypes.string,
    isIncognito: PropTypes.bool,
    isGuest: PropTypes.bool,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }),
  /** If not given, will render the name of the collective */
  children: PropTypes.node,
  title: PropTypes.string,
  target: PropTypes.string,
  /** Set this to true to remove the `title` attribute from the link */
  noTitle: PropTypes.bool,
};

export default LinkCollective;
