import React from 'react';
import PropTypes from 'prop-types';
import { gql, NetworkStatus, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { getPersonalTokenSettingsRoute } from '../../lib/url-helpers';

import Avatar from '../Avatar';
import { Box, Flex, Grid } from '../Grid';
import Image from '../Image';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Pagination from '../Pagination';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledLink from '../StyledLink';
import { H3, P } from '../Text';

import CreatePersonalTokenModal from './CreatePersonalTokenModal';

const personalTokenQuery = gql`
  query PersonalTokens($slug: String!, $limit: Int, $offset: Int) {
    individual(slug: $slug) {
      id
      name
      slug
      type
      imageUrl(height: 128)
      personalTokens(limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          name
        }
      }
    }
  }
`;

const PersonalTokensList = ({ account, onPersonalTokenCreated, offset = 0 }) => {
  const variables = { slug: account.slug, limit: 12, offset: offset };
  const [showCreatePersonalToken, setShowCreatePersonalTokenModal] = React.useState(false);
  const { data, loading, error, networkStatus } = useQuery(personalTokenQuery, {
    variables,
    context: API_V2_CONTEXT,
  });

  const showLoadingState = loading || networkStatus === NetworkStatus.refetch;

  return (
    <div data-cy="personal-tokens-list">
      <Flex width="100%" alignItems="center">
        <H3 fontSize="18px" fontWeight="700">
          <FormattedMessage defaultMessage="Personal Tokens" />
        </H3>
        <StyledHr mx={2} flex="1" borderColor="black.400" />
        <StyledButton
          data-cy="create-personal-token-btn"
          buttonSize="tiny"
          onClick={() => setShowCreatePersonalTokenModal(true)}
        >
          + <FormattedMessage defaultMessage="Create Personal token" />
        </StyledButton>
        {showCreatePersonalToken && (
          <CreatePersonalTokenModal
            account={data.individual}
            onClose={() => setShowCreatePersonalTokenModal(false)}
            onSuccess={onPersonalTokenCreated}
          />
        )}
      </Flex>
      <P my={2} color="black.700">
        <FormattedMessage
          defaultMessage="Personal tokens are used to authenticate with the API. They are not tied to a specific application. Pass it as {headerName} HTTP header or {queryParam} query parameter in the URL."
          values={{
            headerName: <code>Personal-Token</code>,
            queryParam: <code>personalToken</code>,
          }}
        />
      </P>
      <Box my={4}>
        {error ? (
          <MessageBoxGraphqlError error={error} />
        ) : !showLoadingState && !data.individual.personalTokens.totalCount ? (
          <StyledCard p="24px">
            <Flex>
              <Flex flex="0 0 64px" height="64px" justifyContent="center" alignItems="center">
                <Image src="/static/icons/apps.png" width="52px" height="52px" alt="" />
              </Flex>
              <Flex flexDirection="column" ml={3}>
                <P fontSize="14px" fontWeight="700" lineHeight="20px" mb="12px">
                  <FormattedMessage defaultMessage="You don't have any token yet" />
                </P>
                <P fontSize="12px" lineHeight="18px" color="black.700">
                  <FormattedMessage
                    defaultMessage="You can create personal token that integrate with the Open Collective platform. <CreateTokenLink>Create Personal Token</CreateTokenLink>."
                    values={{
                      CreateTokenLink: children => (
                        <StyledLink
                          data-cy="create-token-link"
                          as="button"
                          color="blue.500"
                          onClick={() => setShowCreatePersonalTokenModal(true)}
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
              : data.individual.personalTokens.nodes.map(token => (
                  <Flex key={token.id} data-cy="personal-token" alignItems="center">
                    <Box mr={24}>
                      <Avatar radius={64} collective={data.individual} />
                    </Box>
                    <Flex flexDirection="column">
                      <P fontSize="18px" lineHeight="26px" fontWeight="500" color="black.900">
                        {token.name ?? <FormattedMessage defaultMessage={'Unnamed token'} />}
                      </P>
                      <P mt="10px" fontSize="14px">
                        <Link href={getPersonalTokenSettingsRoute(data.individual, token)}>
                          <FormattedMessage id="Settings" defaultMessage="Settings" />
                        </Link>
                      </P>
                    </Flex>
                  </Flex>
                ))}
          </Grid>
        )}
      </Box>
      {data?.individual?.personalTokens?.totalCount > variables.limit && (
        <Flex mt={5} justifyContent="center">
          <Pagination
            total={data.individual.personalTokens.totalCount}
            limit={variables.limit}
            offset={variables.offset}
            ignoredQueryParams={['slug', 'section']}
          />
        </Flex>
      )}
    </div>
  );
};

PersonalTokensList.propTypes = {
  account: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),
  onPersonalTokenCreated: PropTypes.func.isRequired,
  offset: PropTypes.number,
};

export default PersonalTokensList;
