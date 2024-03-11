import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';

import Link from './Link';

/**
 * `Contributor` type is meant to surface all types of contributors, even the one that
 * may not be registered yet on Open Collective -- for example, Github contributors.
 * The component will automatically fallback on displaying a `span` if the contributor
 * cannot be linked to on Open Collective.
 *
 * In the future it may also link to external profiles like Github.
 */
const LinkContributor = ({ contributor, children }) => {
  if (contributor.isGuest) {
    return children || <FormattedMessage id="profile.guest" defaultMessage="Guest" />;
  } else if (contributor.isIncognito) {
    return children || <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />;
  } else if (contributor.collectiveSlug && contributor.type !== CollectiveType.VENDOR) {
    return <Link href={`/${contributor.collectiveSlug}`}>{children || contributor.name}</Link>;
  } else {
    return children || <span>{contributor.name}</span>;
  }
};

LinkContributor.propTypes = {
  /** The contributor to link to */
  contributor: PropTypes.shape({
    collectiveSlug: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    isIncognito: PropTypes.bool,
    isGuest: PropTypes.bool,
  }).isRequired,
  /** By default we show the name in the link. Use this prop to override this */
  children: PropTypes.node,
};

export default LinkContributor;
