import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { Check } from '@styled-icons/fa-solid/Check';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { addAuthTokenToHeader } from '../../lib/api';
import { ERROR, formatErrorType } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';

import Avatar from '../../components/Avatar';
import Container from '../../components/Container';
import EmbeddedPage from '../../components/EmbeddedPage';
import { Flex } from '../../components/Grid';
import Image from '../../components/Image';
import Loading from '../../components/Loading';
import MessageBox from '../../components/MessageBox';
import MessageBoxGraphqlError from '../../components/MessageBoxGraphqlError';
import RadialIconContainer from '../../components/RadialIconContainer';
import SignInOrJoinFree from '../../components/SignInOrJoinFree';
import StyledButton from '../../components/StyledButton';
import StyledCard from '../../components/StyledCard';
import { P } from '../../components/Text';
import { useUser } from '../../components/UserProvider';

const applicationQuery = gqlV2`
  query ExistingOAuthAuthorization($clientId: String!) {
    application(clientId: $clientId) {
      id
      name
      clientId
      callbackUrl

    }
  }
`;

// See https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1
const REQUIRED_URL_PARAMS = ['response_type', 'client_id'];

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

const ApplicationApproveScreen = ({ application, redirectUri }) => {
  const { LoggedInUser } = useUser();
  const intl = useIntl();
  const router = useRouter();
  const {
    call: callAuthorize,
    loading,
    error,
  } = useAsyncCall(async () => {
    const authorizeParams = new URLSearchParams({
      /* eslint-disable camelcase */
      response_type: 'code',
      client_id: application.clientId,
      redirect_uri: redirectUri || application.callbackUrl, // TODO
      /* eslint-enable camelcase */
    });

    let response = null;
    try {
      response = await fetch(`/api/oauth/authorize?${authorizeParams.toString()}`, {
        method: 'POST',
        redirect: 'manual', // Don't follow redirects
        // follow: 0, // Don't follow redirects
        headers: {
          ...addAuthTokenToHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch {
      throw formatErrorType(intl, ERROR.NETWORK);
    }

    const body = await response.json();
    if (response.ok) {
      return router.push(body['redirect_uri']);
    } else {
      throw new Error(body['error_description'] || body['error']);
    }
  });

  return (
    <Container position="relative">
      <StyledCard maxWidth="520px" width="100%" px={24} py={32}>
        <TopAvatarsContainer>
          <Avatar size={96} />
          <RadialIconContainer size="32px" bg="#29cc75">
            <Check size={12} />
          </RadialIconContainer>
          <RadialIconContainer bg="blue.700" size={96}>
            <Image src="/static/images/oc-logo-inverted.svg" height={56} width={56} />
          </RadialIconContainer>
        </TopAvatarsContainer>
        <P fontWeight="700" fontSize="24px" textAlign="center" color="black.900" mb={32} mt={56}>
          <FormattedMessage
            defaultMessage="{applicationName} wants permission to:"
            values={{ applicationName: application.name }}
          />
        </P>
        <Flex alignItems="center">
          <Avatar collective={LoggedInUser.collective} size={48} />
          <P fontSize="18px" color="black.700" ml={3}>
            <FormattedMessage
              defaultMessage="Verify your identity on {service}"
              values={{ service: 'Open Collective' }}
            />{' '}
            <strong>({LoggedInUser.collective.name})</strong>
          </P>
        </Flex>
        <Flex alignItems="center" mt={26}>
          <Avatar size={48} />
          <P fontSize="18px" color="black.700" ml={3}>
            <FormattedMessage defaultMessage="Access information about your Collective(s)" />
          </P>
        </Flex>
        <Flex alignItems="center" mt={26}>
          <Image src="/static/images/stars-exchange-rounded.png" width={48} height={48} />
          <P fontSize="18px" color="black.700" ml={3}>
            <FormattedMessage defaultMessage="Perform admin actions on your behalf" />
          </P>
        </Flex>
        <MessageBox type="info" mt={40} fontSize="13px">
          <FormattedMessage
            defaultMessage="By authorizing {applicationName} you are giving access to all your Collectives."
            values={{ applicationName: application.name }}
          />
        </MessageBox>
        {error && (
          <MessageBox type="error" withIcon mt={3}>
            {error.toString()}
          </MessageBox>
        )}
      </StyledCard>
      <Flex mt={24} justifyContent="center" gap="24px">
        <StyledButton minWidth={175} onClick={() => window.history.back()} disabled={loading}>
          <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
        </StyledButton>
        <StyledButton minWidth={175} buttonStyle="primary" loading={loading} onClick={callAuthorize}>
          <FormattedMessage defaultMessage="Authorize" />
        </StyledButton>
      </Flex>
    </Container>
  );
};

ApplicationApproveScreen.propTypes = {
  application: PropTypes.shape({
    name: PropTypes.string,
    clientId: PropTypes.string.isRequired,
    // TODO redirectUri: PropTypes.string.isRequired,
  }).isRequired,
  redirectUri: PropTypes.string,
};

const SignInOAuthPage = () => {
  const { query } = useRouter();
  // TODO remove const { client_id, response_type, redirect_uri } = router.query;
  const { loadingLoggedInUser, LoggedInUser } = useUser();
  const missingParams = REQUIRED_URL_PARAMS.filter(key => !query[key]);
  const skipQuery = !LoggedInUser || loadingLoggedInUser || missingParams.length;
  const queryVariables = { clientId: query['client_id'] };
  const queryParams = { skip: skipQuery, variables: queryVariables, context: API_V2_CONTEXT };
  const { data, error, loading: isLoadingAuthorization } = useQuery(applicationQuery, queryParams);
  const isLoading = loadingLoggedInUser || isLoadingAuthorization;
  const hasExistingAuthorization = false; // TODO

  return (
    <EmbeddedPage title="Authorize application">
      <Flex justifyContent="center" alignItems="center" py={[90, null, null, 180]} px={2}>
        {isLoading ? (
          <Loading />
        ) : !LoggedInUser ? (
          <SignInOrJoinFree />
        ) : missingParams.length ? (
          <MessageBox withIcon type="error">
            <FormattedMessage
              defaultMessage="Missing parameters: {parameters}"
              values={{ parameters: missingParams.join(', ') }}
            />
          </MessageBox>
        ) : query['response_type'] !== 'code' ? (
          <MessageBox withIcon type="error">
            <FormattedMessage
              defaultMessage='{field} has invalid value "{value}". Expected: "{expected}"'
              values={{ field: 'response_type', value: query['response_type'], expected: 'code' }}
            />
          </MessageBox>
        ) : error ? (
          <MessageBoxGraphqlError error={error} />
        ) : hasExistingAuthorization ? (
          'Redirecting...' // TODO
        ) : (
          <ApplicationApproveScreen application={data.application} redirectUri={query['redirect_uri']} />
        )}
      </Flex>
    </EmbeddedPage>
  );
};

export default SignInOAuthPage;
