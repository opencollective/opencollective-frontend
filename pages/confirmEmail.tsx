import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Email } from '@styled-icons/material/Email';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { gql } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import type { Mutation, MutationConfirmEmailArgs } from '../lib/graphql/types/v2/graphql';
import type { UserContextProps } from '../lib/hooks/useLoggedInUser';

import Container from '../components/Container';
import { Box } from '../components/Grid';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import { Button } from '../components/ui/Button';

const confirmUserEmailMutation = gql`
  mutation ConfirmEmail($token: NonEmptyString!) {
    confirmEmail(token: $token) {
      sessionToken
      individual {
        id
        email
      }
    }
  }
`;

function getIconColor(status: string) {
  if (status === 'submitting') {
    return '#3385FF';
  } else if (status === 'error') {
    return '#CC1836';
  } else {
    return '#00A34C';
  }
}

/**
 * The validation trigger logic ensures `refetchLoggedInUser` is not called while
 * the user is still loading, since Apollo discards duplicate queries.
 */
const ConfirmEmailPage = () => {
  const router = useRouter();
  const token = router.query.token as string;
  const { loadingLoggedInUser, login, refetchLoggedInUser } = useLoggedInUser();

  const [status, setStatus] = useState<'submitting' | 'success' | 'error'>('submitting');
  const [error, setError] = useState<{ extensions?: { code?: string }; message?: string } | null>(null);
  const validationTriggered = useRef(false);

  const [confirmEmail] = useMutation(confirmUserEmailMutation);

  useEffect(() => {
    if (loadingLoggedInUser || validationTriggered.current || !token) {
      return;
    }

    validationTriggered.current = true;

    (async () => {
      try {
        const result = await confirmEmail({ variables: { token } });
        if (result.data.confirmEmail.sessionToken) {
          await login(result.data.confirmEmail.sessionToken);
        } else {
          await refetchLoggedInUser();
        }
        setStatus('success');
      } catch (e) {
        const gqlError = e?.graphQLErrors?.[0] || e;
        setStatus('error');
        setError(gqlError);
      }
    })();
  }, [loadingLoggedInUser, token, confirmEmail, login, refetchLoggedInUser]);

  return (
    <Page title="Email confirmation">
      <Container
        display="flex"
        py={[5, 6]}
        px={2}
        flexDirection="column"
        alignItems="center"
        background="linear-gradient(180deg, #EBF4FF, #FFFFFF)"
      >
        <Box my={3}>
          <Email size={42} color={getIconColor(status)} />
        </Box>
        {status === 'submitting' && (
          <MessageBox fontSize="16px" type="info" isLoading>
            <FormattedMessage id="confirmEmail.validating" defaultMessage="Validating your email address..." />
          </MessageBox>
        )}
        {status === 'success' && (
          <React.Fragment>
            <MessageBox fontSize="16px" mb={4} type="success" withIcon>
              <FormattedMessage id="confirmEmail.sucess" defaultMessage="Your email has been changed" />
            </MessageBox>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft size={16} />
                <FormattedMessage defaultMessage="Go back to your Dashboard" id="ReeYyf" />
              </Button>
            </Link>
          </React.Fragment>
        )}
        {status === 'error' && (
          <MessageBox fontSize="16px" type="error" withIcon>
            {error?.extensions?.code === 'INVALID_TOKEN' ? (
              <FormattedMessage
                id="confirmEmail.error.InvalidToken"
                defaultMessage="The confirmation link is invalid or has expired"
              />
            ) : (
              error?.message
            )}
          </MessageBox>
        )}
      </Container>
    </Page>
  );
};

// ts-unused-exports:disable-next-line
export default ConfirmEmailPage;
