import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from './Grid';
import MessageBox from './MessageBox';
import ReplyToMemberInvitationCard from './ReplyToMemberInvitationCard';

/**
 * Displays a `ReplyToMemberInvitationCard` list, scrolling to the given selected
 * element on mount.
 */
const MemberInvitationsList = ({ invitations, selectedInvitationId }) => {
  React.useEffect(() => {
    if (selectedInvitationId) {
      const elem = document.getElementById(`invitation-${selectedInvitationId}`);
      if (elem) {
        const elemTop = elem.getBoundingClientRect().top + window.scrollY;
        window.scroll({ top: elemTop - 100, behavior: 'smooth' });
      }
    }
  }, [selectedInvitationId]);

  if (invitations.length === 0) {
    return (
      <MessageBox type="info" withIcon>
        <FormattedMessage id="MemberInvitations.none" defaultMessage="No pending invitations" />
      </MessageBox>
    );
  }

  return (
    <Flex flexDirection="column" alignItems="center">
      {invitations.map(invitation => (
        <Box key={invitation.id} mb={5}>
          <ReplyToMemberInvitationCard
            invitation={invitation}
            isSelected={invitation.id === selectedInvitationId}
            redirectOnAccept={invitations.length === 1}
          />
        </Box>
      ))}
    </Flex>
  );
};

export default MemberInvitationsList;
