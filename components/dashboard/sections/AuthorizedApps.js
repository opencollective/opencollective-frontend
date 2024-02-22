import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';
import { getDashboardRoute } from '../../../lib/url-helpers';

import { Box, Flex } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Link from '../../Link';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { AuthorizedApp } from '../../oauth/AuthorizedApp';
import { authorizedAppsQuery } from '../../oauth/queries';
import Pagination from '../../Pagination';
import StyledHr from '../../StyledHr';
import { P } from '../../Text';
import { ALL_SECTIONS } from '../constants';

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
            defaultMessage="No Authorized App yet. You can create your own OAuth application from the <ForDevelopersLink>For Developers</ForDevelopersLink> section."
            values={{
              ForDevelopersLink: getI18nLink({
                as: Link,
                href: getDashboardRoute(LoggedInUser.collective, ALL_SECTIONS.FOR_DEVELOPERS),
              }),
            }}
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
          />
        </Flex>
      )}
    </Box>
  );
};

export default AuthorizedAppsSection;
