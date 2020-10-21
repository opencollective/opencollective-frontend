import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { pick } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { checkUserExistence, signin } from '../../lib/api';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import { getWebsiteUrl } from '../../lib/utils';

import { Box, Flex } from '../../components/Grid';
import StyledButton from '../../components/StyledButton';
import StyledCard from '../../components/StyledCard';
import StyledLink from '../../components/StyledLink';
import { H4, P } from '../../components/Text';

import pidgeon from '../../public/static/images/pidgeon.png';

const resendDraftExpenseInviteMutation = gqlV2/* GraphQL */ `
  mutation ResendDraftExpenseInvite($expense: ExpenseReferenceInput!) {
    resendDraftExpenseInvite(expense: $expense) {
      id
    }
  }
`;

const PidgeonIllustration = styled.img.attrs({ src: pidgeon })`
  width: 132px;
  height: 132px;
`;

const ResendDraftInviteButton = ({ expense }) => {
  const [resendDraftInvite, { loading, error, data }] = useMutation(resendDraftExpenseInviteMutation, {
    context: API_V2_CONTEXT,
  });
  const success = !error && data?.resendDraftExpenseInvite?.id;

  return (
    <StyledButton
      buttonStyle={success ? 'successSecondary' : 'primary'}
      buttonSize="tiny"
      mr={1}
      loading={loading}
      disabled={success}
      onClick={() => resendDraftInvite({ variables: { expense: pick(expense, ['id', 'legacyId']) } })}
    >
      {success ? (
        <FormattedMessage id="ResendInviteSuccessful" defaultMessage="Invite sent" />
      ) : (
        <FormattedMessage id="ResendInvite" defaultMessage="Resend invite" />
      )}
    </StyledButton>
  );
};

ResendDraftInviteButton.propTypes = {
  expense: PropTypes.object.isRequired,
};

const ResendSignInEmailButton = ({ createdUser }) => {
  const { loading, call, error, data } = useAsyncCall(async () => {
    const userExists = await checkUserExistence(createdUser.email);
    if (userExists) {
      const redirect = window.location.pathname + window.location.search;
      return await signin({
        user: { email: createdUser.email },
        redirect,
        websiteUrl: getWebsiteUrl(),
      });
    } else {
      throw Error('User does not exist.');
    }
  });
  const success = !error && data?.success;
  return (
    <StyledButton
      buttonStyle={success ? 'successSecondary' : 'primary'}
      buttonSize="tiny"
      mr={1}
      loading={loading}
      disabled={success}
      onClick={call}
    >
      {success ? (
        <FormattedMessage id="ResendEmailSuccessful" defaultMessage="Check your inbox!" />
      ) : (
        <FormattedMessage id="ResendEmail" defaultMessage="Resend email" />
      )}
    </StyledButton>
  );
};

ResendSignInEmailButton.propTypes = {
  createdUser: PropTypes.object.isRequired,
};

const ExpenseInviteNotificationBanner = props => {
  return (
    <StyledCard py={3} px="26px" mb={4} borderStyle={'solid'}>
      <Flex>
        <PidgeonIllustration />
        <Flex ml={[0, 2]} maxWidth="448px" flexDirection="column">
          <H4 mb="10px" fontWeight="500">
            {props.createdUser ? (
              <FormattedMessage id="VerifyEmailAddress" defaultMessage="Verify your email address" />
            ) : (
              <FormattedMessage id="InviteOnItsWay" defaultMessage="Your invite is on its way" />
            )}
          </H4>
          <P lineHeight="20px">
            {props.createdUser ? (
              <FormattedMessage
                id="VerifyEmailInstructions"
                defaultMessage="An email has been sent to {email} with a link to verify your account. if you have not
                      received the email after a few minutes, please check your spam folder."
                values={{
                  email: props.createdUser?.email || props.expense.draft?.payee?.name,
                }}
              />
            ) : (
              <FormattedMessage
                id="Expense.InviteIsOnItsWay.Description"
                defaultMessage="An email has been sent to {email} with the invitation to submit this expense. Only after this person validates his/her email and submit it, the expense would appear in the list."
                values={{
                  email: props.expense.draft?.payee?.email || props.expense.draft?.payee?.name,
                }}
              />
            )}
          </P>
          <Box mt="10px">
            {props.createdUser ? (
              <ResendSignInEmailButton createdUser={props.createdUser} />
            ) : (
              <ResendDraftInviteButton expense={props.expense} />
            )}
            <StyledLink href="mailto:support@opencollective.com" buttonStyle="standard" buttonSize="tiny">
              <FormattedMessage id="ContactSupport" defaultMessage="Contact Support" />
            </StyledLink>
          </Box>
        </Flex>
      </Flex>
    </StyledCard>
  );
};

ExpenseInviteNotificationBanner.propTypes = {
  createdUser: PropTypes.object.isRequired,
  expense: PropTypes.object.isRequired,
};

export default ExpenseInviteNotificationBanner;
