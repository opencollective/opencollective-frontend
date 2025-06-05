import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import roles from '../lib/constants/roles';
import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';
import formatMemberRole from '../lib/i18n/member-role';
import { formatDate } from '../lib/utils';

import Avatar from './Avatar';
import { Box, Flex } from './Grid';
import { getI18nLink } from './I18nFormatters';
import LinkCollective from './LinkCollective';
import MemberRoleDescription, { hasRoleDescription } from './MemberRoleDescription';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledCard from './StyledCard';
import StyledCheckbox from './StyledCheckbox';
import { H3, P } from './Text';
import { withUser } from './UserProvider';

const messages = defineMessages({
  emailDetails: {
    id: 'MemberInvitation.detailsEmail',
    defaultMessage: 'If you accept, your email address will be visible to other admins.',
  },
  decline: {
    id: 'Decline',
    defaultMessage: 'Decline',
  },
  accept: {
    id: 'Accept',
    defaultMessage: 'Accept',
  },
  accepted: {
    id: 'Invitation.Accepted',
    defaultMessage: 'Accepted',
  },
  declined: {
    id: 'Invitation.Declined',
    defaultMessage: 'Declined',
  },
});

const replyToMemberInvitationMutation = gql`
  mutation ReplyToMemberInvitation($invitation: MemberInvitationReferenceInput!, $accept: Boolean!) {
    replyToMemberInvitation(invitation: $invitation, accept: $accept)
  }
`;

/**
 * A card with actions for users to accept or decline an invitation to join the members
 * of a collective.
 */
const ReplyToMemberInvitationCard = ({ invitation, isSelected, refetchLoggedInUser, redirectOnAccept }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const router = useRouter();
  const hostTermsUrl = invitation.account.host?.termsUrl;
  const [acceptedTOS, setAcceptedTOS] = React.useState(!hostTermsUrl); // Automatically accepts the TOS if there is no TOS URL
  const [accepted, setAccepted] = React.useState();
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [sendReplyToInvitation, { error, data }] = useMutation(replyToMemberInvitationMutation, {
    context: API_V2_CONTEXT,
  });
  const isDisabled = isSubmitting;
  const hasReplied = data && typeof data.replyToMemberInvitation !== 'undefined';

  const buildReplyToInvitation = accept => async () => {
    setSubmitting(true);
    setAccepted(accept);
    await sendReplyToInvitation({ variables: { invitation: { id: invitation.id }, accept } });
    await refetchLoggedInUser();
    if (accept && redirectOnAccept) {
      await router.push(`/${invitation.account.slug}`);
    }
    setSubmitting(false);
  };

  return (
    <StyledCard
      id={`invitation-${invitation.id}`}
      p={3}
      width="100%"
      maxWidth={400}
      borderColor={isSelected ? 'primary.300' : undefined}
      data-cy="member-invitation-card"
    >
      <LinkCollective collective={invitation.account}>
        <Flex flexDirection="column" alignItems="center">
          <Avatar collective={invitation.account} />
          <H3 textAlign="center">{invitation.account.name}</H3>
        </Flex>
      </LinkCollective>
      <br />
      <Flex flexDirection="column" alignItems="center">
        <P textAlign="center">
          {invitation.inviter ? (
            <FormattedMessage
              id="MemberInvitation.detailsInviter"
              defaultMessage="Invited by {inviter} on {date}"
              values={{
                inviter: <LinkCollective collective={invitation.inviter} />,
                date: formatDate(invitation.createdAt, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
              }}
            />
          ) : (
            <FormattedMessage
              id="MemberInvitation.detailsDate"
              defaultMessage="Invited on {date}"
              values={{
                date: formatDate(invitation.createdAt, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
              }}
            />
          )}
        </P>
      </Flex>
      <hr className="my-5" />
      <div className="rounded bg-slate-100 p-3 text-center">{formatMemberRole(intl, invitation.role)}</div>
      {hasRoleDescription(invitation.role) && (
        <p className="my-4 px-2 text-sm text-slate-700">
          <MemberRoleDescription role={invitation.role} />
        </p>
      )}
      {hasReplied && !isSubmitting ? (
        <P mt={4} color={accepted ? 'green.500' : 'red.500'} textAlign="center" mb={2} fontWeight="bold">
          {accepted ? `✔️ ${formatMessage(messages.accepted)}` : `❌️ ${formatMessage(messages.declined)}`}
        </P>
      ) : (
        <React.Fragment>
          <MessageBox my={3} type="info" withIcon>
            {formatMessage(messages.emailDetails)}
          </MessageBox>
          {Boolean(hostTermsUrl) && (
            <Box mb={3} mt={4}>
              <StyledCheckbox
                onChange={({ checked }) => setAcceptedTOS(checked)}
                label={
                  <FormattedMessage
                    id="OCFHostApplication.tosCheckBoxLabel"
                    defaultMessage="I agree with the <TOSLink>terms of fiscal sponsorship</TOSLink>."
                    values={{
                      TOSLink: getI18nLink({
                        href: invitation.account.host.termsUrl,
                        openInNewTabNoFollow: true,
                        onClick: e => e.stopPropagation(), // don't check the checkbox when clicking on the link
                      }),
                    }}
                  />
                }
              />
            </Box>
          )}
          {error && (
            <MessageBox type="error" withIcon my={3}>
              {i18nGraphqlException(intl, error)}
            </MessageBox>
          )}
          <Flex mt={4} justifyContent="space-evenly">
            <StyledButton
              mx={2}
              minWidth={150}
              disabled={isDisabled}
              loading={isSubmitting && accepted === false}
              onClick={buildReplyToInvitation(false)}
              data-cy="member-invitation-decline-btn"
            >
              {formatMessage(messages.decline)}
            </StyledButton>
            <StyledButton
              mx={2}
              minWidth={150}
              buttonStyle="primary"
              disabled={isDisabled || !acceptedTOS}
              loading={isSubmitting && accepted === true}
              onClick={buildReplyToInvitation(true)}
              data-cy="member-invitation-accept-btn"
            >
              {formatMessage(messages.accept)}
            </StyledButton>
          </Flex>
        </React.Fragment>
      )}
    </StyledCard>
  );
};

ReplyToMemberInvitationCard.propTypes = {
  isSelected: PropTypes.bool,
  invitation: PropTypes.shape({
    id: PropTypes.string,
    role: PropTypes.oneOf(Object.values(roles)),
    account: PropTypes.shape({
      name: PropTypes.string,
      slug: PropTypes.string,
      host: PropTypes.shape({
        name: PropTypes.string,
        termsUrl: PropTypes.string,
      }),
    }),
    inviter: PropTypes.shape({
      name: PropTypes.string,
    }),
    createdAt: PropTypes.string,
  }),
  /** @ignore form withUser */
  refetchLoggedInUser: PropTypes.func,
  redirectOnAccept: PropTypes.bool,
};

export default withUser(ReplyToMemberInvitationCard);
