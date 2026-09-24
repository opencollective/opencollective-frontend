import React from 'react';
import { truncate } from 'lodash-es';
import { FormattedMessage } from 'react-intl';

import { cn } from '../lib/utils';
import { getCollectivePageRoute } from '@/lib/url-helpers';

import { DashboardContext } from './dashboard/DashboardContext';
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
  truncateNameLength = null,
  ...props
}) => {
  const context = React.useContext(DashboardContext);
  const peoplesDashboardURL = context?.getProfileUrl?.(collective);
  const formatName = name => (truncateNameLength ? truncate(name, { length: truncateNameLength }) : name);
  const route = peoplesDashboardURL || getCollectivePageRoute(collective);

  // We do handle incognito and guest accounts if we have a contextual dashboard profile URL
  if (!peoplesDashboardURL) {
    if (
      !collective ||
      collective.isIncognito ||
      (collective.type === 'USER' && (!collective.name || !collective.slug))
    ) {
      return children || <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />;
    } else if (collective.isGuest) {
      if (children) {
        return children;
      } else if (collective.name === 'Guest') {
        return <FormattedMessage id="profile.guest" defaultMessage="Guest" />;
      } else {
        return collective.name;
      }
    } else if (!route) {
      // No route means the collective has no public profile (hidden, private, vendor, missing slug, etc.)
      return children || formatName(collective.name);
    }
  }

  const { slug, name } = collective;
  const link = (
    <Link
      href={route}
      title={noTitle || withHoverCard ? null : title || name}
      target={target}
      className={cn('hover:underline', className)}
      {...props}
    >
      {children || formatName(name || slug)}
    </Link>
  );

  if (withHoverCard) {
    return (
      <AccountHoverCard {...hoverCardProps} account={collective} trigger={<span className="min-w-0">{link}</span>} />
    );
  }

  return link;
};

export default LinkCollective;
