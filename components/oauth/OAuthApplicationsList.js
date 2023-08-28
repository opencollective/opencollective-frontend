import React from 'react';
import PropTypes from 'prop-types';
import { gql, NetworkStatus, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { getOauthAppSettingsRoute } from '../../lib/url-helpers';

import Avatar from '../Avatar';
import { Box, Flex, Grid } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Image from '../Image';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import CreateOauthApplicationModal from '../oauth/CreateOauthApplicationModal';
import Pagination from '../Pagination';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledLink from '../StyledLink';
import { H3, P } from '../Text';

const applicationsQuery = gql`
  query ApplicationsQuery($slug: String!, $limit: Int, $offset: Int) {
    account(slug: $slug) {
      id
      name
      slug
      type
      imageUrl(height: 128)
      oAuthApplications(limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          name
        }
      }
    }
  }
`;

const OAuthApplicationsList = ({ account, onApplicationCreated, offset = 0 }) => {
  const variables = { slug: account.slug, limit: 12, offset: offset };
  const [showCreateApplicationModal, setShowCreateApplicationModal] = React.useState(false);
  const { data, loading, error, networkStatus } = useQuery(applicationsQuery, {
    variables,
    context: API_V2_CONTEXT,
  });

  const showLoadingState = loading || networkStatus === NetworkStatus.refetch;
  return (
    <div data-cy="oauth-apps-list">
      <Flex width="100%" alignItems="center">
        <H3 fontSize="18px" fontWeight="700">
          <FormattedMessage defaultMessage="OAuth Apps" />
        </H3>
        <StyledHr mx={2} flex="1" borderColor="black.400" />
        <StyledButton data-cy="create-app-btn" buttonSize="tiny" onClick={() => setShowCreateApplicationModal(true)}>
          + <FormattedMessage defaultMessage="Create OAuth app" />
        </StyledButton>
        {showCreateApplicationModal && (
          <CreateOauthApplicationModal
            account={data.account}
            onClose={() => setShowCreateApplicationModal(false)}
            onSuccess={onApplicationCreated}
          />
        )}
      </Flex>
      <P my={2} color="black.700">
        <FormattedMessage defaultMessage="You can register new apps that you developed using Open Collective's API." />{' '}
        <FormattedMessage
          defaultMessage="For more information about OAuth applications, check <link>our documentation</link>."
          values={{
            link: getI18nLink({
              href: 'https://docs.opencollective.com/help/developers/oauth',
            }),
          }}
        />
      </P>
      <Box my={4}>
        {error ? (
          <MessageBoxGraphqlError error={error} />
        ) : !showLoadingState && !data.account.oAuthApplications.totalCount ? (
          <StyledCard p="24px">
            <Flex>
              <Flex flex="0 0 64px" height="64px" justifyContent="center" alignItems="center">
                <Image src="/static/icons/apps.png" width={52} height={52} alt="" />
              </Flex>
              <Flex flexDirection="column" ml={3}>
                <P fontSize="14px" fontWeight="700" lineHeight="20px" mb="12px">
                  <FormattedMessage defaultMessage="You don't have any app yet" />
                </P>
                <P fontSize="12px" lineHeight="18px" color="black.700">
                  <FormattedMessage
                    defaultMessage="You can create apps that integrate with the Open Collective platform. <CreateAppLink>Create an app</CreateAppLink> using the Open Collective's API."
                    values={{
                      CreateAppLink: children => (
                        <StyledLink
                          data-cy="create-app-link"
                          as="button"
                          color="blue.500"
                          onClick={() => setShowCreateApplicationModal(true)}
                        >
                          {children}
                        </StyledLink>
                      ),
                    }}
                  />
                </P>
              </Flex>
            </Flex>
          </StyledCard>
        ) : (
          <Grid gridTemplateColumns={['1fr', null, null, '1fr 1fr', '1fr 1fr 1fr']} gridGap="46px">
            {showLoadingState
              ? Array.from({ length: variables.limit }, (_, index) => <LoadingPlaceholder key={index} height="64px" />)
              : data.account.oAuthApplications.nodes.map(app => (
                  <Flex key={app.id} data-cy="oauth-app" alignItems="center">
                    <Box mr={24}>
                      <Avatar radius={64} collective={data.account} />
                    </Box>
                    <Flex flexDirection="column">
                      <P fontSize="18px" lineHeight="26px" fontWeight="500" color="black.900">
                        {app.name}
                      </P>
                      <P mt="10px" fontSize="14px">
                        <Link href={getOauthAppSettingsRoute(data.account, app)}>
                          <FormattedMessage id="Settings" defaultMessage="Settings" />
                        </Link>
                      </P>
                    </Flex>
                  </Flex>
                ))}
          </Grid>
        )}
      </Box>
      {data?.account?.oAuthApplications?.totalCount > variables.limit && (
        <Flex mt={5} justifyContent="center">
          <Pagination
            total={data.account.oAuthApplications.totalCount}
            limit={variables.limit}
            offset={variables.offset}
            ignoredQueryParams={['slug', 'section']}
          />
        </Flex>
      )}
    </div>
  );
};

OAuthApplicationsList.propTypes = {
  account: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),
  onApplicationCreated: PropTypes.func.isRequired,
  offset: PropTypes.number,
};

export default OAuthApplicationsList;
