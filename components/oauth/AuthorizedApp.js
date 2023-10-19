import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { FormattedMessage, FormattedRelativeTime, useIntl } from 'react-intl';

import { isIndividualAccount } from '../../lib/collective.lib';
import dayjs from '../../lib/dayjs';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import Avatar from '../Avatar';
import Container from '../Container';
import { generateDateTitle } from '../DateTime';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { P, Span } from '../Text';
import { useToast } from '../ui/useToast';

const revokeAuthorizationMutation = gql`
  mutation RevokeAuthorization($id: String!) {
    revokeOAuthAuthorization(oAuthAuthorization: { id: $id }) {
      id
    }
  }
`;

export const AuthorizedApp = ({ authorization, onRevoke }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [revokeAuthorization, { loading }] = useMutation(revokeAuthorizationMutation, {
    context: API_V2_CONTEXT,
    onCompleted: onRevoke,
  });

  return (
    <Flex
      data-cy="connected-oauth-app"
      alignItems="center"
      justifyContent="space-between"
      maxWidth={776}
      mb={3}
      flexWrap="wrap"
    >
      <Flex alignItems="center">
        <Avatar collective={authorization.application.account} size={64} />
        <Box ml={24}>
          <P fontWeight="800" fontSize="15px">
            {authorization.application.name}
          </P>
          <Container display="flex" alignItems="center" flexWrap="wrap" fontSize="12px" mt={2} color="black.700">
            <time dateTime={authorization.createdAt} title={generateDateTitle(intl, new Date(authorization.createdAt))}>
              <FormattedMessage defaultMessage="Connected on {date, date, simple}" values={{ date: new Date() }} />
            </time>
            <Span mr={1}>
              {authorization.lastUsedAt && (
                <React.Fragment>
                  &nbsp;•&nbsp;
                  <time
                    dateTime={authorization.lastUsedAt}
                    title={generateDateTitle(intl, new Date(authorization.lastUsedAt))}
                  >
                    <FormattedMessage
                      defaultMessage="Last used {timeElapsed}"
                      values={{
                        timeElapsed: (
                          <FormattedRelativeTime
                            value={dayjs(authorization.lastUsedAt).diff(dayjs(), 'second')}
                            unit="second"
                            updateIntervalInSeconds={60}
                          />
                        ),
                      }}
                    />
                  </time>
                </React.Fragment>
              )}
            </Span>
            {!isIndividualAccount(authorization.account) && (
              <Flex alignItems="center">
                <FormattedMessage
                  id="CreatedBy"
                  defaultMessage="by {name}"
                  values={{
                    name: (
                      <Flex alignItems="center" ml={2}>
                        <Avatar collective={authorization.account} size={24} mr={1} />
                        <StyledLink as={LinkCollective} collective={authorization.account} color="black.700" />
                      </Flex>
                    ),
                  }}
                />
              </Flex>
            )}
          </Container>
        </Box>
      </Flex>
      <Container ml={2} textAlign="center" mt={2} width={['100%', 'auto']}>
        <StyledButton
          data-cy="oauth-app-revoke-btn"
          buttonSize="small"
          buttonStyle="dangerSecondary"
          isBorderless
          loading={loading}
          onClick={async () => {
            try {
              await revokeAuthorization({ variables: { id: authorization.id } });
              toast({
                variant: 'success',
                message: intl.formatMessage(
                  { defaultMessage: `Authorization for {appName} revoked` },
                  { appName: authorization.application.name },
                ),
              });
            } catch (e) {
              toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
            }
          }}
        >
          <FormattedMessage defaultMessage="Revoke access" />
        </StyledButton>
      </Container>
    </Flex>
  );
};

AuthorizedApp.propTypes = {
  authorization: PropTypes.shape({
    id: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    lastUsedAt: PropTypes.string.isRequired,
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
  onRevoke: PropTypes.func,
};
