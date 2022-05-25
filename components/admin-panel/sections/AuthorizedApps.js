import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import { Box } from '../../Grid';
import { I18nSupportLink } from '../../I18nFormatters';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { AuthorizedApp } from '../../oauth/AuthorizedApp';
import { authorizedAppsQuery } from '../../oauth/queries';
import StyledHr from '../../StyledHr';
import { P } from '../../Text';
import { useUser } from '../../UserProvider';

const AuthorizedAppsSection = () => {
  const { data, loading, error } = useQuery(authorizedAppsQuery, { context: API_V2_CONTEXT });
  const { LoggedInUser } = useUser();
  return loading ? (
    <LoadingPlaceholder height={300} />
  ) : error ? (
    <MessageBoxGraphqlError error={error} />
  ) : !data?.loggedInAccount?.oAuthAuthorizations?.totalCount ? (
    <div>
      {LoggedInUser.collective.settings.oauthBeta ? (
        <P>
          <FormattedMessage defaultMessage="You haven't configured any application yet" />
        </P>
      ) : (
        <MessageBox type="info" withIcon mt={3}>
          <FormattedMessage
            defaultMessage="We're beta-testing OAuth integrations for Open Collective. <SupportLink>Contact us</SupportLink> if you're interested to try it out early!"
            values={{ SupportLink: I18nSupportLink }}
          />
        </MessageBox>
      )}
    </div>
  ) : (
    <Box mt={3}>
      {data.loggedInAccount.oAuthAuthorizations.nodes.map((authorization, index) => (
        <React.Fragment key={authorization.id}>
          <AuthorizedApp authorization={authorization} />
          {index !== data.loggedInAccount.oAuthAuthorizations.nodes.length - 1 && (
            <StyledHr my={4} borderColor="black.300" />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default AuthorizedAppsSection;
