import { Flex } from '@rebass/grid';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import React from 'react';
import { useMutation } from 'react-apollo';
import { defineMessages, useIntl } from 'react-intl';

import roles from '../lib/constants/roles';
import formatMemberRole from '../lib/i18n-member-role';
import { getErrorFromGraphqlException } from '../lib/utils';
import Avatar from './Avatar';
import LinkCollective from './LinkCollective';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledCard from './StyledCard';
import StyledTag from './StyledTag';
import { H3, P } from './Text';

const rolesDetails = defineMessages({
  [roles.ADMIN]: {
    id: 'RoleDetails.ADMIN',
    defaultMessage:
      'Admins can edit the Collective, change settings, approve expenses, make financial contributions to other Collectives and receive messages from people trying to contact the Collective.',
  },
  [roles.MEMBER]: {
    id: 'RoleDetails.MEMBER',
    defaultMessage:
      'Core contributors are major contributors and represent the Collective with their face on the Collective page as part of the team.',
  },
});

const messages = defineMessages({
  emailDetails: {
    id: 'MemberInvitation.detailsEmail',
    defaultMessage:
      'If you accept this invitation, your email address will be visible from the other admins of the collective.',
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

const replyToInvitationMutation = gql`
  mutation ReplyToInvitation($id: Int!, $accept: Boolean!) {
    replyToMemberInvitation(invitationId: $id, accept: $accept)
  }
`;

/**
 * A card with actions for users to accept or decline an invitation to join the members
 * of a collective.
 */
const ReplyToMemberInvitationCard = ({ invitation, isSelected }) => {
  const { formatMessage } = useIntl();
  const [accepted, setAccepted] = React.useState();
  const [sendReplyToInvitation, { loading, error, data }] = useMutation(replyToInvitationMutation);
  const isDisabled = loading;
  const hasReplied = data && typeof data.replyToMemberInvitation !== 'undefined';

  const buildReplyToInvitation = accept => () => {
    setAccepted(accept);
    sendReplyToInvitation({ variables: { id: invitation.id, accept } });
  };

  return (
    <StyledCard
      id={`invitation-${invitation.id}`}
      p={3}
      width="100%"
      maxWidth={400}
      borderColor={isSelected ? 'primary.300' : undefined}
    >
      <LinkCollective collective={invitation.collective}>
        <Flex flexDirection="column" alignItems="center">
          <Avatar collective={invitation.collective} />
          <H3>{invitation.collective.name}</H3>
        </Flex>
      </LinkCollective>
      <hr />
      <StyledTag>{formatMemberRole(formatMessage, invitation.role)}</StyledTag>
      {rolesDetails[invitation.role] && (
        <P my={2} color="black.600">
          {formatMessage(rolesDetails[invitation.role])}
        </P>
      )}
      {hasReplied ? (
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
              loading={loading && accepted === false}
              onClick={buildReplyToInvitation(false)}
            >
              {formatMessage(messages.decline)}
            </StyledButton>
            <StyledButton
              mx={2}
              minWidth={150}
              buttonStyle="primary"
              disabled={isDisabled}
              loading={loading && accepted === true}
              onClick={buildReplyToInvitation(true)}
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
};

export default ReplyToMemberInvitationCard;
