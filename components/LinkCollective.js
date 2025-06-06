import React from 'react';
import { FormattedMessage } from 'react-intl';

import { getCollectivePageRoute } from '../lib/url-helpers';
import { cn } from '../lib/utils';

import { AccountHoverCard } from './AccountHoverCard';
import Link from './Link';

/**
 * Create a `Link` to the collective based on collective type.
 * It properly deals with type `EVENT` and `isIncognito`
 */
const LinkCollective = ({
  collective,
  target = undefined,
  title = undefined,
  noTitle = false,
  children = undefined,
  withHoverCard = false,
  className = undefined,
  hoverCardProps = undefined,
  ...props
}) => {
  if (!collective || collective.isIncognito || (collective.type === 'USER' && (!collective.name || !collective.slug))) {
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

  const { slug, name } = collective;
  const link = (
    <Link
      href={getCollectivePageRoute(collective)}
      title={noTitle || withHoverCard ? null : title || name}
      target={target}
      className={cn('hover:underline', className)}
      {...props}
    >
      {children || name || slug}
    </Link>
  );

  if (withHoverCard) {
    return <AccountHoverCard {...hoverCardProps} account={collective} trigger={<span>{link}</span>} />;
  }

  return link;
};

export default LinkCollective;
