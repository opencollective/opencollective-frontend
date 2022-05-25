import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import Avatar from '../../Avatar';
import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import { I18nSupportLink } from '../../I18nFormatters';
import LinkCollective from '../../LinkCollective';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import StyledButton from '../../StyledButton';
import StyledHr from '../../StyledHr';
import StyledLink from '../../StyledLink';
import { P, Span } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';
import { useUser } from '../../UserProvider';

const authorizedAppsQuery = gqlV2/* GraphQL */ `
  query AuthorizedApps {
    loggedInAccount {
      id
      oAuthAuthorizations {
        totalCount
        nodes {
          id
          createdAt
          account {
            id
            name
            slug
            type
            imageUrl(height: 48)
          }
          application {
            id
            name
            account {
              id
              name
              slug
              type
              imageUrl(height: 128)
            }
          }
        }
      }
    }
  }
`;

const revokeAuthorizationMutation = gqlV2/* GraphQL */ `
  mutation RevokeAuthorization($id: String!) {
    revokeOAuthAuthorization(oAuthAuthorization: { id: $id }) {
      id
    }
  }
`;

const AuthorizedApps = ({ authorizations }) => {
  // TODO pagination
  const intl = useIntl();
  const { addToast } = useToasts();
  const [revokeAuthorization, { loading }] = useMutation(revokeAuthorizationMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: authorizedAppsQuery, context: API_V2_CONTEXT }],
    awaitRefetchQueries: true,
  });
  return (
    <Box mt={3}>
      {authorizations.map((auth, index) => (
        <React.Fragment key={auth.id}>
          <Flex alignItems="center" justifyContent="space-between" maxWidth={776} mb={3} flexWrap="wrap">
            <Flex alignItems="center">
              <Avatar collective={auth.application.account} size={64} />
              <Box ml={24}>
                <P fontWeight="800" fontSize="15px">
                  {auth.application.name}
                </P>
                <Container display="flex" alignItems="center" flexWrap="wrap" fontSize="12px" mt={2} color="black.700">
                  <Span mr={1}>
                    <FormattedMessage
                      defaultMessage="Connected on {date, date, simple}"
                      values={{ date: new Date(auth.createdAt) }}
                    />
                  </Span>
                  <Flex alignItems="center">
                    <FormattedMessage
                      id="CreatedBy"
                      defaultMessage="by {name}"
                      values={{
                        name: (
                          <Flex alignItems="center" ml={2}>
                            <Avatar collective={auth.account} size={24} mr={1} />
                            <StyledLink as={LinkCollective} collective={auth.account} color="black.700" />
                          </Flex>
                        ),
                      }}
                    />
                  </Flex>
                </Container>
              </Box>
            </Flex>
            <Container ml={2} textAlign="center" mt={2} width={['100%', 'auto']}>
              <StyledButton
                buttonSize="small"
                buttonStyle="dangerSecondary"
                isBorderless
                loading={loading}
                onClick={async () => {
                  try {
                    await revokeAuthorization({ variables: { id: auth.id } });
                    addToast({
                      type: TOAST_TYPE.SUCCESS,
                      message: intl.formatMessage(
                        { defaultMessage: `Authorization for {appName} revoked` },
                        { appName: auth.application.name },
                      ),
                    });
                  } catch (e) {
                    addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
                  }
                }}
              >
                <FormattedMessage defaultMessage="Revoke access" />
              </StyledButton>
            </Container>
          </Flex>
          {index !== authorizations.length - 1 && <StyledHr my={4} borderColor="black.300" />}
        </React.Fragment>
      ))}
    </Box>
  );
};

AuthorizedApps.propTypes = {
  authorizations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      account: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        imageUrl: PropTypes.string,
      }).isRequired,
      application: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        account: PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          slug: PropTypes.string.isRequired,
          type: PropTypes.string.isRequired,
          imageUrl: PropTypes.string,
        }).isRequired,
      }).isRequired,
    }),
  ).isRequired,
};

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
    <AuthorizedApps authorizations={data.loggedInAccount.oAuthAuthorizations.nodes} />
  );
};

AuthorizedAppsSection.propTypes = {};

export default AuthorizedAppsSection;
