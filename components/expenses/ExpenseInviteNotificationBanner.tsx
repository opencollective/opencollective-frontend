import React from 'react';
import { useMutation } from '@apollo/client';
import { pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { checkUserExistence, signin } from '../../lib/api';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import { getWebsiteUrl } from '../../lib/utils';

import { Flex } from '../Grid';
import Image from '../Image';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledLink from '../StyledLink';
import { H4, P } from '../Text';
import { useToast } from '../ui/useToast';

const resendDraftExpenseInviteMutation = gql`
  mutation ResendDraftExpenseInvite($expense: ExpenseReferenceInput!) {
    resendDraftExpenseInvite(expense: $expense) {
      id
    }
  }
`;

const ResendDraftInviteButton = ({ expense }) => {
  const { toast } = useToast();
  const intl = useIntl();
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
      onClick={async () => {
        try {
          await resendDraftInvite({ variables: { expense: pick(expense, ['id', 'legacyId']) } });
          toast({
            variant: 'success',
            message: <FormattedMessage id="ResendInviteSuccessful" defaultMessage="Invite sent" />,
          });
        } catch (e) {
          toast({
            variant: 'error',
            message: i18nGraphqlException(intl, e),
          });
        }
      }}
    >
      {success ? (
        <FormattedMessage id="ResendInviteSuccessful" defaultMessage="Invite sent" />
      ) : (
        <FormattedMessage id="ResendInvite" defaultMessage="Resend invite" />
      )}
    </StyledButton>
  );
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

const ExpenseInviteNotificationBanner = props => {
  const canResendEmail = Boolean(props.expense.permissions?.canVerifyDraftExpense);
  return (
    <StyledCard py={3} px="26px" mb={4} borderStyle={'solid'} data-cy="expense-draft-banner">
      <Flex flexDirection={['column', null, 'row']} alignItems="center">
        <Image alt="" src="/static/images/pidgeon.png" width={132} height={132} />
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
                defaultMessage="A verification email has been sent to {email}. Click the link to complete submitting this expense. If you have not received the email, please check your spam."
                values={{
                  email: props.createdUser?.email || props.expense.draft?.payee?.name,
                }}
              />
            ) : (
              <FormattedMessage
                id="Expense.InviteIsOnItsWay.Description"
                defaultMessage="An invitation to submit this expense has been sent to {email}. Once they confirm and finish the process, it will appear on the expenses list."
                values={{
                  email: props.expense.draft?.payee?.email || props.expense.draft?.payee?.name,
                }}
              />
            )}
          </P>
          {canResendEmail && (
            <Flex mt="10px" flexWrap="wrap" gap="8px">
              {props.createdUser ? (
                <ResendSignInEmailButton createdUser={props.createdUser} />
              ) : (
                <ResendDraftInviteButton expense={props.expense} />
              )}
              <StyledLink href="/help" buttonStyle="standard" buttonSize="tiny">
                <FormattedMessage id="error.contactSupport" defaultMessage="Contact support" />
              </StyledLink>
            </Flex>
          )}
        </Flex>
      </Flex>
    </StyledCard>
  );
};

export default ExpenseInviteNotificationBanner;
