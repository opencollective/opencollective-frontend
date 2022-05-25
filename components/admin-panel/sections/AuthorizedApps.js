import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import { Box, Flex } from '../../Grid';
import { I18nSupportLink } from '../../I18nFormatters';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { AuthorizedApp } from '../../oauth/AuthorizedApp';
import { authorizedAppsQuery } from '../../oauth/queries';
import Pagination from '../../Pagination';
import StyledHr from '../../StyledHr';
import { P } from '../../Text';
import { useUser } from '../../UserProvider';

const AuthorizedAppsSection = () => {
  const router = useRouter() || {};
  const query = router.query;
  const variables = { limit: 10, offset: query.offset ? parseInt(query.offset) : 0 };
  const { data, loading, error, refetch } = useQuery(authorizedAppsQuery, { variables, context: API_V2_CONTEXT });
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
          <AuthorizedApp authorization={authorization} onRevoke={refetch} />
          {index !== data.loggedInAccount.oAuthAuthorizations.nodes.length - 1 && (
            <StyledHr my={4} borderColor="black.300" />
          )}
        </React.Fragment>
      ))}
      <Flex mt={5} justifyContent="center">
        <Pagination
          total={data.loggedInAccount.oAuthAuthorizations?.totalCount}
          limit={variables.limit}
          offset={variables.offset}
          ignoredQueryParams={['slug', 'section']}
          scrollToTopOnChange
        />
      </Flex>
    </Box>
  );
};

export default AuthorizedAppsSection;
