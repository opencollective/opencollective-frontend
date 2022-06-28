import React from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

import { getOauthAppSettingsRoute } from '../../../lib/url-helpers';

import OAuthApplicationSettings from '../../oauth/OAuthApplicationSettings';
import OAuthApplicationsList from '../../oauth/OAuthApplicationsList';

const ForDevelopers = ({ accountSlug }) => {
  const router = useRouter() || {};
  const query = router.query;
  const [subSection, id] = query.subpath || [];
  if (subSection === 'oauth' && id) {
    return <OAuthApplicationSettings id={id} backPath={router.asPath.replace(/\/oauth\/.+/, '')} />;
  } else {
    return (
      <OAuthApplicationsList
        accountSlug={accountSlug}
        offset={query.offset ? parseInt(query.offset) : 0}
        onApplicationCreated={(app, account) => router.push(getOauthAppSettingsRoute(account, app))}
      />
    );
  }
};

ForDevelopers.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default ForDevelopers;
