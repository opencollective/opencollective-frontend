import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { getCollectivePageRoute } from '../lib/url-helpers';

import Avatar from './Avatar';
import Link from './Link';

/**
 * Create a `Link` to the account based on account type.
 * It properly deals with type `EVENT` and `isIncognito`
 */
const LinkAccount = ({
  account,
  target = undefined,
  title = undefined,
  noTitle = true,
  children = undefined,
  withAvatar = true,
  withName = true,
  avatarSize = 24,
  ...props
}) => {
  if (!account || account.isIncognito) {
    return children || <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />;
  } else if (account.isGuest) {
    if (children) {
      return children;
    } else if (account.name === 'Guest') {
      return <FormattedMessage id="profile.guest" defaultMessage="Guest" />;
    } else {
      return account.name;
    }
  } else if (!account.slug || account.type === 'VENDOR') {
    return children || account.name;
  }

  const { type, slug, name, isIncognito } = account;
  if (type === 'USER' && (!name || isIncognito || !slug)) {
    return children || <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />;
  }
  return (
    <Link href={getCollectivePageRoute(account)} title={noTitle ? null : title || name} target={target} {...props}>
      {withAvatar && <Avatar collective={account} radius={avatarSize} />}
      {withName && name}
    </Link>
  );
};

LinkAccount.propTypes = {
  /** The collective to link to */
  account: PropTypes.shape({
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

export default LinkAccount;
