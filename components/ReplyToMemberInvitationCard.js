import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { defineMessages, useIntl } from 'react-intl';

import roles from '../lib/constants/roles';
import { getErrorFromGraphqlException } from '../lib/errors';
import formatMemberRole from '../lib/i18n/member-role';

import Avatar from './Avatar';
import { Flex } from './Grid';
import LinkCollective from './LinkCollective';
import MemberRoleDescription, { hasRoleDescription } from './MemberRoleDescription';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledCard from './StyledCard';
import StyledTag from './StyledTag';
import { H3, P } from './Text';
import { withUser } from './UserProvider';

const messages = defineMessages({
  emailDetails: {
    id: 'MemberInvitation.detailsEmail',
    defaultMessage: 'If you accept, your email address will be visible to other admins of this Collective.',
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
  mutation ReplyToMemberInvitation($id: Int!, $accept: Boolean!) {
    replyToMemberInvitation(invitationId: $id, accept: $accept)
  }
`;

/**
 * A card with actions for users to accept or decline an invitation to join the members
 * of a collective.
 */
const ReplyToMemberInvitationCard = ({ invitation, isSelected, refetchLoggedInUser }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [accepted, setAccepted] = React.useState();
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [sendReplyToInvitation, { error, data }] = useMutation(replyToMemberInvitationMutation);
  const isDisabled = isSubmitting;
  const hasReplied = data && typeof data.replyToMemberInvitation !== 'undefined';

  const buildReplyToInvitation = accept => async () => {
    setSubmitting(true);
    setAccepted(accept);
    await sendReplyToInvitation({ variables: { id: invitation.id, accept } });
    await refetchLoggedInUser();
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
      <LinkCollective collective={invitation.collective}>
        <Flex flexDirection="column" alignItems="center">
          <Avatar collective={invitation.collective} />
          <H3>{invitation.collective.name}</H3>
        </Flex>
      </LinkCollective>
      <hr />
      <StyledTag textTransform="uppercase">{formatMemberRole(intl, invitation.role)}</StyledTag>
      {hasRoleDescription(invitation.role) && (
        <P my={3} px={2} color="black.600" lineHeight="18px">
          <MemberRoleDescription role={invitation.role} />
        </P>
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
          {error && (
            <MessageBox type="error" withIcon my={3}>
              {getErrorFromGraphqlException(error).message}
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
              disabled={isDisabled}
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
    id: PropTypes.number,
    role: PropTypes.oneOf(Object.values(roles)),
    collective: PropTypes.shape({
      name: PropTypes.string,
    }),
  }),
  /** @ignore form withUser */
  refetchLoggedInUser: PropTypes.func,
};

export default withUser(ReplyToMemberInvitationCard);
