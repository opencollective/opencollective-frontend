import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Email } from '@styled-icons/material/Email';
import { omit, size, uniq } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled, { useTheme } from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { getAllGuestTokens, normalizeEmailForGuestToken, removeGuestTokens } from '../lib/guest-accounts';

import Container from '../components/Container';
import { Box } from '../components/Grid';
import { getI18nLink } from '../components/I18nFormatters';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import MessageBoxGraphqlError from '../components/MessageBoxGraphqlError';
import Page from '../components/Page';
import StyledButton from '../components/StyledButton';
import StyledCard from '../components/StyledCard';
import StyledCheckbox from '../components/StyledCheckbox';
import StyledSpinner from '../components/StyledSpinner';
import { P } from '../components/Text';
import { useUser } from '../components/UserProvider';

const STATUS = {
  SUBMITTING: 'SUBMITTING',
  SUBMITTING_GUEST_PROFILES: 'SUBMITTING_GUEST_PROFILES',
  PICK_PROFILES: 'PICK_PROFILES',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

const confirmGuestAccountMutation = gqlV2`
  mutation ConfirmGuestAccount($email: EmailAddress!, $token: String!, $guestTokens: [String!]) {
    confirmGuestAccount(email: $email, emailConfirmationToken: $token, guestTokens: $guestTokens) {
      accessToken
      account {
        id
        slug
        name
      }
    }
  }
`;

const MESSAGES = defineMessages({
  pageTitle: {
    id: 'confirmGuest.title',
    defaultMessage: 'Account verification',
  },
});

const EmailCheckbox = styled(StyledCheckbox)`
  padding: 0 16px;

  &:hover,
  &:focus {
    background: #f7f8fa;
  }
`;

const GuestProfilePicker = ({ onChange, email, selectedTokens }) => {
  const guestTokens = getAllGuestTokens();
  const normalizedEmail = email && normalizeEmailForGuestToken(email);
  const otherTokens = omit(guestTokens, [normalizedEmail]);

  return (
    <StyledCard>
      {Object.entries(otherTokens).map(([guestEmail, guestToken]) => (
        <EmailCheckbox
          key={guestEmail}
          name="guest-email"
          data-cy="guest-email-checkbox"
          fontSize="13px"
          checked={selectedTokens.includes(guestToken)}
          label={<Box py={3}>{guestEmail}</Box>}
          onChange={({ target }) => {
            return onChange(
              target.checked
                ? uniq([...selectedTokens, guestToken])
                : selectedTokens.filter(token => token !== guestToken),
            );
          }}
        />
      ))}
    </StyledCard>
  );
};

GuestProfilePicker.propTypes = {
  onChange: PropTypes.func.isRequired,
  selectedTokens: PropTypes.arrayOf(PropTypes.string).isRequired,
  email: PropTypes.string,
};

const MUTATION_OPTS = { context: API_V2_CONTEXT };

const ConfirmGuestPage = () => {
  const intl = useIntl();
  const theme = useTheme();
  const router = useRouter();
  const { login } = useUser();
  const [status, setStatus] = React.useState(STATUS.SUBMITTING);
  const [selectedGuestTokens, setSelectedGuestTokens] = React.useState([]);
  const [callConfirmGuestAccount, { error, data }] = useMutation(confirmGuestAccountMutation, MUTATION_OPTS);
  const { token, email } = router.query;

  const confirmGuestAccount = async guestTokens => {
    try {
      const response = await callConfirmGuestAccount({ variables: { email, token, guestTokens } });
      const { accessToken, account } = response.data.confirmGuestAccount;
      removeGuestTokens([email], guestTokens);
      setStatus(STATUS.SUCCESS);
      await login(accessToken);
      router.push(`/${account.slug}`);
    } catch {
      setStatus(STATUS.ERROR);
    }
  };

  // Auto-submit on mount, or switch to "Pick profile"
  React.useEffect(() => {
    // Load guest
    const allGuestTokens = getAllGuestTokens();
    const nbTokens = size(allGuestTokens);
    const normalizedEmail = normalizeEmailForGuestToken(email);

    if (!email) {
      setStatus(STATUS.ERROR);
    } else if (nbTokens > 1 || (nbTokens === 1 && !allGuestTokens[normalizedEmail])) {
      setStatus(STATUS.PICK_PROFILES);
    } else {
      // Directly submit the confirmation
      const guestTokens = allGuestTokens[normalizedEmail] ? [allGuestTokens[normalizedEmail]] : [];
      setStatus(STATUS.SUBMITTING);
      confirmGuestAccount(guestTokens);
    }
  }, []);

  return (
    <Page title={intl.formatMessage(MESSAGES.pageTitle)}>
      <Container
        display="flex"
        py={[5, 6, 150]}
        px={2}
        flexDirection="column"
        alignItems="center"
        background="linear-gradient(180deg, #EBF4FF, #FFFFFF)"
      >
        {(status === STATUS.PICK_PROFILES || status === STATUS.SUBMITTING_GUEST_PROFILES) && (
          <Fragment>
            <Box my={3}>
              <Email size={42} color={theme.colors.primary[400]} />
            </Box>
            <strong>
              <FormattedMessage
                id="confirmGuest.otherContributions"
                defaultMessage="It seems that you've made other contributions using this browser."
              />
            </strong>
            <P fontSize="15px" lineHeight="22px" mb={3}>
              <FormattedMessage
                id="confirmGuest.select"
                defaultMessage="Select the ones that you want to link to your account:"
              />
            </P>
            <GuestProfilePicker onChange={setSelectedGuestTokens} selectedTokens={selectedGuestTokens} email={email} />
            <StyledButton
              buttonStyle="primary"
              mt={4}
              loading={status === STATUS.SUBMITTING_GUEST_PROFILES}
              data-cy="confirm-account-btn"
              onClick={async () => {
                setStatus(STATUS.SUBMITTING_GUEST_PROFILES);
                await confirmGuestAccount(selectedGuestTokens);
              }}
            >
              <FormattedMessage id="confirmGuest.submit" defaultMessage="Confirm account" />
            </StyledButton>
          </Fragment>
        )}
        {status === STATUS.SUBMITTING && (
          <Fragment>
            <Box my={3}>
              <Email size={42} color={theme.colors.primary[500]} />
            </Box>
            <MessageBox type="info" isLoading>
              <FormattedMessage id="confirmEmail.validating" defaultMessage="Validating your email address..." />
            </MessageBox>
          </Fragment>
        )}
        {status === STATUS.SUCCESS && (
          <Fragment>
            <Container mb={3} pb={3} px={4} textAlign="center" boxShadow="0px 8px 8px -10px rgb(146 146 146 / 40%)">
              <Box my={3}>
                <Email size={42} color={theme.colors.green[500]} />
              </Box>
              <strong>
                <FormattedMessage id="confirmEmail.success" defaultMessage="Your email has been confirmed" />
              </strong>
            </Container>
            <Container textAlign="center" p={2}>
              <Box my={2}>
                <StyledSpinner size={32} />
              </Box>
              {data?.confirmGuestAccount?.account && (
                <P fontSize="13px" lineHeight="18px" textAlign="center">
                  <FormattedMessage id="confirmGuest.redirecting" defaultMessage="Redirecting to your profile..." />
                  <br />
                  <FormattedMessage
                    id="confirmGuest.dontWait"
                    defaultMessage="If you don't wish to wait, click <Link>here</Link>."
                    values={{
                      Link: getI18nLink({
                        as: Link,
                        route: 'collective',
                        params: { slug: data.confirmGuestAccount?.account.slug },
                      }),
                    }}
                  />
                </P>
              )}
            </Container>
          </Fragment>
        )}
        {status === STATUS.ERROR && (
          <Fragment>
            <Box my={3}>
              <Email size={42} color={theme.colors.red[500]} />
            </Box>
            <MessageBoxGraphqlError error={error} />
          </Fragment>
        )}
      </Container>
    </Page>
  );
};

ConfirmGuestPage.getInitialProps = ({ req: { query } }) => {
  return { token: query.token, email: query.email };
};

export default ConfirmGuestPage;
