import React, { Fragment } from 'react';
import { useMutation } from '@apollo/client';
import { PaperPlane } from '@styled-icons/boxicons-regular/PaperPlane';
import { Email } from '@styled-icons/material/Email';
import { size } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled, { useTheme } from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { getAllGuestTokens } from '../lib/guest-accounts';

import Container from '../components/Container';
import { Box } from '../components/Grid';
import { I18nSupportLink } from '../components/I18nFormatters';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import MessageBoxGraphqlError from '../components/MessageBoxGraphqlError';
import Page from '../components/Page';
import StyledButton from '../components/StyledButton';
import StyledCard from '../components/StyledCard';
import StyledRadioList from '../components/StyledRadioList';
import { H4, P, Span } from '../components/Text';
import { useUser } from '../components/UserProvider';

const STATUS = {
  SUBMITTING: 'SUBMITTING',
  PICK_PROFILE: 'PICK_PROFILE',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  ERROR_NO_EMAIL: 'ERROR_NO_EMAIL',
};

const MESSAGES = defineMessages({
  pageTitle: {
    id: 'guestJoin.title',
    defaultMessage: 'Join {service}',
  },
});

const confirmGuestAccountMutation = gqlV2`
  mutation SendGuestConfirmationEmail($email: EmailAddress!) {
    sendGuestConfirmationEmail(email: $email)
  }
`;

const EmailRadioEntry = styled.div.attrs({ 'data-cy': 'guest-email-entry' })`
  padding: 16px;

  &:hover,
  &:focus {
    background: #f7f8fa;
  }
`;

const MUTATION_OPTS = { context: API_V2_CONTEXT };

const JoinAsGuest = () => {
  const theme = useTheme();
  const [status, setStatus] = React.useState(STATUS.SUBMITTING);
  const router = useRouter();
  const guestTokens = getAllGuestTokens();
  const query = router?.query || {};
  const nbTokens = size(guestTokens);
  const [selectedEmail, setSelectedEmail] = React.useState(null);
  const [callSendGuestConfirmationEmail, { error }] = useMutation(confirmGuestAccountMutation, MUTATION_OPTS);
  const submittedEmail = selectedEmail || Object.keys(guestTokens)[0];

  const sendGuestConfirmationEmail = async email => {
    setStatus(STATUS.SUBMITTING);
    try {
      await callSendGuestConfirmationEmail({ variables: { email } });
      setStatus(STATUS.SUCCESS);
    } catch (e) {
      setStatus(STATUS.ERROR);
    }
  };

  // Submit on mount if there's only one guest token, else show picker
  React.useEffect(() => {
    if (!nbTokens) {
      setStatus(STATUS.ERROR_NO_EMAIL);
    } else if (nbTokens === 1) {
      const email = Object.keys(guestTokens)[0];
      sendGuestConfirmationEmail(email);
    } else if (nbTokens > 1) {
      setStatus(STATUS.PICK_PROFILE);
    }
  }, []);

  switch (status) {
    case STATUS.ERROR_NO_EMAIL:
      return (
        <MessageBox type="warning" withIcon maxWidth={550}>
          <strong>
            <FormattedMessage
              id="guestJoin.noEmail"
              defaultMessage="We could not find any contributions attached to this browser."
            />
          </strong>
          {query.OrderId && (
            <P mt={2} fontSize="14px" lineHeight="20px">
              <FormattedMessage
                id="guestJoin.contactSupport"
                defaultMessage="Please contact <SupportLink>support</SupportLink> to get more info on the procedure to claim your account. Please attach this order id to your request: {orderId}"
                values={{ SupportLink: I18nSupportLink, orderId: <code>{query.OrderId}</code> }}
              />
            </P>
          )}
        </MessageBox>
      );
    case STATUS.ERROR:
      return <MessageBoxGraphqlError error={error} />;
    case STATUS.SUBMITTING:
      return <Loading />;
    case STATUS.PICK_PROFILE:
      return (
        <Fragment>
          <Box my={3}>
            <Email size={42} color={theme.colors.primary[400]} />
          </Box>
          <strong>
            <FormattedMessage
              id="guestJoin.otherProfilesFound"
              defaultMessage="We found {count} emails that you used to contribute"
              values={{ count: nbTokens }}
            />
          </strong>
          <P fontSize="15px" lineHeight="22px" mt={2} mb={3}>
            <FormattedMessage
              id="guestJoin.select"
              defaultMessage="Select the email that you want to use for your account:"
            />
          </P>
          <StyledCard maxWidth={350}>
            <StyledRadioList
              options={Object.keys(guestTokens)}
              onChange={({ value }) => setSelectedEmail(value)}
              value={selectedEmail}
            >
              {({ value, radio }) => (
                <EmailRadioEntry>
                  {radio}
                  <Span ml={2} fontSize="13px" css={{ verticalAlign: 'top' }}>
                    {value}
                  </Span>
                </EmailRadioEntry>
              )}
            </StyledRadioList>
          </StyledCard>
          <StyledButton
            buttonStyle="primary"
            mt={4}
            disabled={!selectedEmail}
            onClick={() => sendGuestConfirmationEmail(selectedEmail)}
            data-cy="send-verification-email-btn"
          >
            <FormattedMessage id="SendVerificationEmail" defaultMessage="Send verification email" />
          </StyledButton>
        </Fragment>
      );
    case STATUS.SUCCESS:
      return (
        <Fragment>
          <Container mb={3} pb={3} px={4} textAlign="center" boxShadow="0px 8px 8px -10px rgb(146 146 146 / 40%)">
            <Box my={3}>
              <PaperPlane size={42} color={theme.colors.primary[300]} />
            </Box>
            <H4 as="h1" fontWeight="bold">
              <FormattedMessage id="SignIn.LinkSent" defaultMessage="Your magic link is on its way!" />
            </H4>
          </Container>
          <Container p={2} textAlign="center">
            <P fontSize="16px" lineHeight="24px" color="black.900" mt={4}>
              <FormattedMessage
                id="SignIn.SentTo"
                defaultMessage="We've sent it to {email}."
                values={{ email: <strong>{submittedEmail}</strong> }}
              />
            </P>
            <P color="black.700" fontSize="14px" lineHeight="18px" my={3}>
              <FormattedMessage
                id="SignIn.SuccessDetails"
                defaultMessage="You’ll be redirected from the link in the email, you can safely close this tab."
              />
            </P>
          </Container>
        </Fragment>
      );
    default:
      return null;
  }
};

const JoinGuestPage = () => {
  const intl = useIntl();
  const { LoggedInUser } = useUser();

  return (
    <Page title={intl.formatMessage(MESSAGES.pageTitle, { service: 'Open Collective' })}>
      <Container
        display="flex"
        py={[5, 6, 150]}
        px={2}
        flexDirection="column"
        alignItems="center"
        background="linear-gradient(180deg, #EBF4FF, #FFFFFF)"
      >
        {LoggedInUser ? (
          <Loading />
        ) : LoggedInUser ? (
          <MessageBox type="warning" withIcon maxWidth={550}>
            <FormattedMessage
              id="createAccount.alreadyLoggedIn"
              defaultMessage='It seems like you&apos;re already signed in as "{email}". If you want to create a new account, please log out first.'
              values={{ email: LoggedInUser.email }}
            />
          </MessageBox>
        ) : (
          <JoinAsGuest />
        )}
      </Container>
    </Page>
  );
};

export default JoinGuestPage;
