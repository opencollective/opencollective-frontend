import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage, FormattedRelativeTime, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { P, Span } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

const revokeAuthorizationMutation = gqlV2/* GraphQL */ `
  mutation RevokeAuthorization($id: String!) {
    revokeOAuthAuthorization(oAuthAuthorization: { id: $id }) {
      id
    }
  }
`;

export const AuthorizedApp = ({ authorization, onRevoke }) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const [revokeAuthorization, { loading }] = useMutation(revokeAuthorizationMutation, {
    context: API_V2_CONTEXT,
    onCompleted: onRevoke,
  });
  const lastUsedAt = authorization.lastUsedAt ? (new Date() - new Date(authorization.lastUsedAt)) / 1000 : null;

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
            <Span mr={1}>
              {authorization.lastUsedAt ? (
                <FormattedMessage
                  defaultMessage="Last used {timeElapsed}"
                  values={{
                    timeElapsed: <FormattedRelativeTime value={lastUsedAt} updateIntervalInSeconds={60} />,
                  }}
                />
              ) : (
                <FormattedMessage
                  defaultMessage="Connected on {date, date, simple}"
                  values={{ date: new Date(authorization.createdAt) }}
                />
              )}
            </Span>
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
              addToast({
                type: TOAST_TYPE.SUCCESS,
                message: intl.formatMessage(
                  { defaultMessage: `Authorization for {appName} revoked` },
                  { appName: authorization.application.name },
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
  );
};

AuthorizedApp.propTypes = {
  authorization: PropTypes.shape({
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
  onRevoke: PropTypes.func,
};
