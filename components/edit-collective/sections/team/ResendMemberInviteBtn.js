import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { getLegacyIdForCollective } from '../../../../lib/collective';
import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';

import StyledButton from '../../../StyledButton';
import { useToast } from '../../../ui/useToast';

import { inviteMemberMutation } from './InviteMemberModal';

const ResendMemberInviteBtn = ({ member, collective }) => {
  const [inviteMember, { loading, error, data }] = useMutation(inviteMemberMutation, { context: API_V2_CONTEXT });
  const success = !error && data?.inviteMember?.id;
  const intl = useIntl();
  const { toast } = useToast();
  return (
    <StyledButton
      buttonStyle={success ? 'successSecondary' : 'standard'}
      buttonSize="tiny"
      mr={1}
      loading={loading}
      disabled={success}
      data-cy="resend-invite-btn"
      onClick={async () => {
        try {
          await inviteMember({
            variables: {
              memberAccount: { id: member.account.id },
              account: { legacyId: getLegacyIdForCollective(collective) },
              role: member.role,
            },
          });
        } catch (e) {
          toast({
            variant: 'error',
            title: intl.formatMessage({ defaultMessage: 'Cannot send member invitation', id: 'mGnvLd' }),
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

ResendMemberInviteBtn.propTypes = {
  collective: PropTypes.object.isRequired,
  member: PropTypes.shape({
    role: PropTypes.string,
    account: PropTypes.shape({ id: PropTypes.string.isRequired }).isRequired,
  }),
};

export default ResendMemberInviteBtn;
