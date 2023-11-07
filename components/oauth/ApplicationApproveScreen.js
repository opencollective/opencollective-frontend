import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/fa-solid/Check';
import { has } from 'lodash';
import {
  AlertTriangle,
  ArrowRightLeft,
  Coins,
  CreditCard,
  Mail,
  MessagesSquare,
  Network,
  Newspaper,
  Receipt,
  Users,
  Webhook,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { addAuthTokenToHeader } from '../../lib/api';
import { ERROR, formatErrorType } from '../../lib/errors';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import Avatar, { IncognitoAvatar } from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Image from '../Image';
import LinkCollective from '../LinkCollective';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import RadialIconContainer from '../RadialIconContainer';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledLinkButton from '../StyledLinkButton';
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

export const SCOPES_INFO = {
  email: {
    label: <FormattedMessage defaultMessage="Access your email address." />,
    icon: <Mail size={16} />,
  },
  incognito: {
    label: <FormattedMessage defaultMessage="Access your incognito account." />,
    icon: <IncognitoAvatar size={32} />,
  },
  account: {
    label: <FormattedMessage defaultMessage="Manage your account, collectives and organizations." />,
    icon: <Users size={16} />,
  },
  expenses: {
    label: <FormattedMessage defaultMessage="Create and manage expenses, payout methods." />,
    icon: <Receipt size={16} />,
  },
  orders: {
    label: <FormattedMessage defaultMessage="Create and manage contributions, payment methods." />,
    icon: <Coins size={16} />,
  },
  transactions: {
    label: <FormattedMessage defaultMessage="Refund and reject recorded transactions." />,
    icon: <ArrowRightLeft size={16} />,
  },
  virtualCards: {
    label: <FormattedMessage defaultMessage="Create and manage virtual cards." />,
    icon: <CreditCard size={16} />,
  },
  updates: {
    label: <FormattedMessage defaultMessage="Create and manage updates." />,
    icon: <Newspaper size={16} />,
  },
  conversations: {
    label: <FormattedMessage defaultMessage="Create and manage conversations." />,
    icon: <MessagesSquare size={16} />,
  },
  webhooks: {
    label: <FormattedMessage defaultMessage="Create and manage webhooks." />,
    icon: <Webhook size={16} />,
  },
  host: {
    label: <FormattedMessage defaultMessage="Administrate fiscal hosts." />,
    icon: <Network size={16} />,
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

const fetchAuthorize = (application, redirectUri = null, state = null, scopes = null) => {
  const authorizeParams = new URLSearchParams({
    /* eslint-disable camelcase */
    response_type: 'code',
    client_id: application.clientId,
    redirect_uri: redirectUri || application.redirectUri,
    state,
    /* eslint-enable camelcase */
  });

  if (scopes && scopes.length > 0) {
    authorizeParams.set('scope', scopes.join(','));
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

const prepareScopes = scopes => {
  return (
    scopes
      ?.split(',')
      .filter(scope => has(SCOPES_INFO, scope))
      .sort() || []
  );
};

export const ApplicationApproveScreen = ({ application, redirectUri, autoApprove, state, scope }) => {
  const { LoggedInUser, logout } = useLoggedInUser();
  const intl = useIntl();
  const router = useRouter();
  const [isRedirecting, setRedirecting] = React.useState(autoApprove);
  const filteredScopes = prepareScopes(scope);
  const {
    call: callAuthorize,
    loading,
    error,
  } = useAsyncCall(async () => {
    let response = null;
    try {
      response = await fetchAuthorize(application, redirectUri, state, filteredScopes);
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
                  <p className="mt-1 text-sm">
                    <strong>
                      {LoggedInUser.collective.name || LoggedInUser.collective.legalName} (@
                      {LoggedInUser.collective.slug})
                    </strong>
                    {'. '}
                    <FormattedMessage
                      defaultMessage="Not you? <SignOutLink>Sign out</SignOutLink> to switch profile."
                      values={{
                        SignOutLink: msg => (
                          <StyledLinkButton onClick={logout} type="button">
                            {msg}
                          </StyledLinkButton>
                        ),
                      }}
                    />
                  </p>
                </P>
              </Flex>
              {Boolean(application.preAuthorize2FA) && (
                <Flex alignItems="center" mt={26}>
                  <div className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-full bg-neutral-100 ">
                    <AlertTriangle size={18} className="text-red-600" />
                  </div>
                  <P fontSize="16px" color="black.700" ml={3}>
                    <FormattedMessage defaultMessage="Directly perform critical operations that would normally require 2FA." />
                  </P>
                </Flex>
              )}
              {filteredScopes.map(scope => (
                <Flex key={scope} alignItems="center" mt={26}>
                  {SCOPES_INFO[scope].icon ? (
                    <div className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-full bg-neutral-100 ">
                      {SCOPES_INFO[scope].icon}
                    </div>
                  ) : (
                    <Image src="/static/images/stars-exchange-rounded.png" width={32} height={32} />
                  )}
                  <P fontSize="16px" color="black.700" ml={3}>
                    {SCOPES_INFO[scope].label}
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
          <StyledButton
            minWidth={175}
            disabled={loading}
            onClick={() => {
              // If we're on the first page of the history, close the window. Otherwise, go back.
              if (window.history.length === 0) {
                window.close();
              } else {
                window.history.back();
              }
            }}
          >
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
    preAuthorize2FA: PropTypes.bool.isRequired,
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
