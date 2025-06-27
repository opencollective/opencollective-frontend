import React from 'react';
import { useRouter } from 'next/router';

import { isIndividualAccount } from '../../../lib/collective';
import { getOauthAppSettingsRoute, getPersonalTokenSettingsRoute } from '../../../lib/url-helpers';

import OAuthApplicationSettings from '../../oauth/OAuthApplicationSettings';
import OAuthApplicationsList from '../../oauth/OAuthApplicationsList';
import PersonalTokenSettings from '../../personal-token/PersonalTokenSettings';
import PersonalTokensList from '../../personal-token/PersonalTokensList';

const ForDevelopers = ({ account }) => {
  const router = useRouter() || {};
  const query = router.query;
  const [subSection, id] = query.subpath || [];
  if (subSection === 'oauth' && id) {
    return <OAuthApplicationSettings id={id} backPath={router.asPath.replace(/\/oauth\/.+/, '')} />;
  } else if (subSection === 'personal-tokens' && id) {
    return <PersonalTokenSettings id={id} backPath={router.asPath.replace(/\/personal-tokens\/.+/, '')} />;
  } else {
    return (
      <React.Fragment>
        <OAuthApplicationsList
          account={account}
          offset={query.offset ? parseInt(query.offset) : 0}
          onApplicationCreated={(app, account) => router.push(getOauthAppSettingsRoute(account, app))}
        />
        {isIndividualAccount(account) && (
          <PersonalTokensList
            account={account}
            offset={query.offset ? parseInt(query.offset) : 0}
            onPersonalTokenCreated={(app, account) => router.push(getPersonalTokenSettingsRoute(account, app))}
          />
        )}
      </React.Fragment>
    );
  }
};

export default ForDevelopers;
