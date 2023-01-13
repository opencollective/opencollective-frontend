import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/fa-solid/Check';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { addAuthTokenToHeader } from '../../lib/api';
import { ERROR, formatErrorType } from '../../lib/errors';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import { getI18nLink } from '../I18nFormatters';
import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Image from '../Image';
import LinkCollective from '../LinkCollective';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import RadialIconContainer from '../RadialIconContainer';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import { P } from '../Text';

const TopAvatarsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: -48px;
  left: 0;
  width: 100%;
  gap: 28px;
`;

const SCOPES = {
  email: {
    label: <FormattedMessage defaultMessage="Access your email address." />,
  },
  incognito: {
    label: <FormattedMessage defaultMessage="Access your incognito account." />,
  },
  account: {
    label: <FormattedMessage defaultMessage="Manage your account, collectives and organizations." />,
  },
  expenses: {
    label: <FormattedMessage defaultMessage="Create and manage expenses, payout methods." />,
  },
  orders: {
    label: <FormattedMessage defaultMessage="Create and manage contributions, payment methods." />,
  },
  transactions: {
    label: <FormattedMessage defaultMessage="Refund and reject recorded transactions." />,
  },
  virtualCards: {
    label: <FormattedMessage defaultMessage="Create and manage virtual cards." />,
  },
  updates: {
    label: <FormattedMessage defaultMessage="Create and manage updates." />,
  },
  conversations: {
    label: <FormattedMessage defaultMessage="Create and manage conversations." />,
  },
  webhooks: {
    label: <FormattedMessage defaultMessage="Create and manage webhooks." />,
  },
  host: {
    label: <FormattedMessage defaultMessage="Administrate fiscal hosts." />,
  },
  /* We disable those scopes for now */
  /*
  applications: {
    label: <FormattedMessage defaultMessage="Create and manage OAuth applications." />,
  },
  connectedAccounts: {
    label: <FormattedMessage defaultMessage="Create and manage connected accounts." />,
  },
  root: {
    label: <FormattedMessage defaultMessage="Perform critical administrative operations. " />,
  },
  */
};

const fetchAuthorize = (application, redirectUri = null, state = null, scope = null) => {
  const authorizeParams = new URLSearchParams({
    /* eslint-disable camelcase */
    response_type: 'code',
    client_id: application.clientId,
    redirect_uri: redirectUri || application.redirectUri,
    state,
    /* eslint-enable camelcase */
  });

  if (scope) {
    authorizeParams.set('scope', scope);
  }

  return fetch(`/api/oauth/authorize?${authorizeParams.toString()}`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      ...addAuthTokenToHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

export const ApplicationApproveScreen = ({ application, redirectUri, autoApprove, state, scope }) => {
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const router = useRouter();
  const [isRedirecting, setRedirecting] = React.useState(autoApprove);
  const {
    call: callAuthorize,
    loading,
    error,
  } = useAsyncCall(async () => {
    let response = null;
    try {
      response = await fetchAuthorize(application, redirectUri, state, scope);
    } catch {
      setRedirecting(false); // To show errors with autoApprove
      throw formatErrorType(intl, ERROR.NETWORK);
    }

    const body = await response.json();
    if (response.ok) {
      setRedirecting(true);
      if (autoApprove) {
        setTimeout(() => {
          return router.push(body['redirect_uri']);
        }, 1000);
      } else {
        return router.push(body['redirect_uri']);
      }
    } else {
      setRedirecting(false); // To show errors with autoApprove
      throw new Error(body['error_description'] || body['error']);
    }
  });

  React.useEffect(() => {
    if (autoApprove) {
      callAuthorize();
    }
  }, []);

  const requestedScopes = scope?.split(',').filter(scope => SCOPES[scope]);
  const filteredScopes = Object.entries(SCOPES).filter(([scope]) => requestedScopes && requestedScopes.includes(scope));

  return (
    <Container position="relative" mt="48px" width="100%">
      <StyledCard maxWidth="520px" width="100%" px={24} py={32} m="0 auto">
        <TopAvatarsContainer>
          <Container flex="0 0 96px">
            <LinkCollective collective={application.account}>
              <Avatar size={96} collective={application.account} />
            </LinkCollective>
          </Container>
          <RadialIconContainer flex="0 0 40px" height="40px" bg="#29cc75">
            <Check width="18px" height="15px" />
          </RadialIconContainer>
          <Container flex="0 0 96px">
            <Image src="/static/images/oc-oauth-connect-logo.png" height={96} width={96} />
          </Container>
        </TopAvatarsContainer>
        <Box pt={56}>
          {isRedirecting ? (
            <Flex flexDirection="column" justifyContent="center" alignItems="center" pb={3}>
              <P fontSize="16px" fontWeight="500" mb={4}>
                <FormattedMessage defaultMessage="Redirecting…" />
              </P>
              <Loading />
            </Flex>
          ) : (
            <React.Fragment>
              <P fontWeight="700" fontSize="24px" textAlign="center" color="black.900" mb={32}>
                <FormattedMessage
                  defaultMessage="{applicationName} wants permission to:"
                  values={{ applicationName: application.name }}
                />
              </P>
              <Flex alignItems="center">
                <Avatar collective={LoggedInUser.collective} size={32} />
                <P fontSize="16px" color="black.700" ml={3}>
                  <FormattedMessage
                    defaultMessage="Verify your identity on {service}"
                    values={{ service: 'Open Collective' }}
                  />{' '}
                  <br />
                  <strong>{LoggedInUser.collective.name}</strong>{' '}
                  <small>
                    <FormattedMessage
                      defaultMessage="Not you? <SignOutLink>Sign Out</SignOutLink> to switch profile."
                      values={{ SignOutLink: getI18nLink({ href: `/signout` }) }}
                    />

                    {/**/}
                  </small>
                </P>
              </Flex>
              {filteredScopes.map(([scope, { label }]) => (
                <Flex key={scope} alignItems="center" mt={26}>
                  <Image src="/static/images/stars-exchange-rounded.png" width={32} height={32} />
                  <P fontSize="16px" color="black.700" ml={3}>
                    {label}
                  </P>
                </Flex>
              ))}
              {filteredScopes.length > 0 && (
                <MessageBox type="info" mt={40} fontSize="13px">
                  <FormattedMessage defaultMessage="These permissions are granted to all the accounts you're administrating, including your personal profile." />
                </MessageBox>
              )}
              {error && (
                <MessageBox type="error" withIcon mt={3}>
                  {error.toString()}
                </MessageBox>
              )}
            </React.Fragment>
          )}
        </Box>
      </StyledCard>
      {!isRedirecting && (
        <Flex mt={24} justifyContent="center" gap="24px" flexWrap="wrap">
          <StyledButton minWidth={175} onClick={() => window.history.back()} disabled={loading}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
          <StyledButton minWidth={175} buttonStyle="primary" loading={loading} onClick={callAuthorize}>
            <FormattedMessage defaultMessage="Authorize" />
          </StyledButton>
        </Flex>
      )}
    </Container>
  );
};

ApplicationApproveScreen.propTypes = {
  application: PropTypes.shape({
    name: PropTypes.string,
    clientId: PropTypes.string.isRequired,
    redirectUri: PropTypes.string.isRequired,
    account: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  redirectUri: PropTypes.string,
  state: PropTypes.string,
  scope: PropTypes.string,
  autoApprove: PropTypes.bool,
};
