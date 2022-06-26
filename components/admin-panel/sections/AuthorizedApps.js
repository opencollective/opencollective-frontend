import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

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

const AuthorizedAppsSection = () => {
  const router = useRouter() || {};
  const query = router.query;
  const variables = { limit: 10, offset: query.offset ? parseInt(query.offset) : 0 };
  const { data, loading, error, refetch } = useQuery(authorizedAppsQuery, { variables, context: API_V2_CONTEXT });
  const { LoggedInUser } = useLoggedInUser();
  const authorizations = data?.loggedInAccount?.oAuthAuthorizations;

  // Redirect to previous page when removing the last item of a page
  React.useEffect(() => {
    if (variables.offset && variables.offset >= authorizations?.totalCount) {
      const pathname = router.asPath.split('?')[0];
      const offset = Math.max(0, variables.offset - variables.limit);
      router.push({ pathname, query: { offset, limit: variables.limit } });
      refetch();
    }
  }, [authorizations?.totalCount, variables.offset]);

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
      {authorizations.nodes.map((authorization, index) => (
        <React.Fragment key={authorization.id}>
          <AuthorizedApp authorization={authorization} onRevoke={refetch} />
          {index !== authorizations.nodes.length - 1 && <StyledHr my={4} borderColor="black.300" />}
        </React.Fragment>
      ))}
      {authorizations.totalCount > variables.limit && (
        <Flex mt={5} justifyContent="center">
          <Pagination
            total={authorizations.totalCount}
            limit={variables.limit}
            offset={variables.offset}
            ignoredQueryParams={['slug', 'section']}
            scrollToTopOnChange
          />
        </Flex>
      )}
    </Box>
  );
};

export default AuthorizedAppsSection;
