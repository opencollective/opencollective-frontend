import React from 'react';
import { useMutation } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../../lib/constants/collectives';
import { i18nGraphqlException } from '../../../../lib/errors';
import { gql } from '../../../../lib/graphql/helpers';

import { Dialog, DialogContent, DialogHeader, DialogPortal, DialogTitle } from '@/components/ui/Dialog';

import CollectivePickerAsync from '../../../CollectivePickerAsync';
import { Flex } from '../../../Grid';
import MessageBox from '../../../MessageBox';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';

import MemberForm from './MemberForm';
import { teamSectionQuery } from './queries';

export const inviteMemberMutation = gql`
  mutation InviteMember(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole!
    $description: String
    $since: DateTime
  ) {
    inviteMember(
      memberAccount: $memberAccount
      account: $account
      role: $role
      description: $description
      since: $since
    ) {
      id
      role
      description
      since
    }
  }
`;

const InviteMemberModal = props => {
  const { intl, collective, membersIds, cancelHandler } = props;

  const { toast } = useToast();

  const [member, setMember] = React.useState(null);
  const mutationOptions = {
    refetchQueries: [
      {
        query: teamSectionQuery,

        variables: {
          collectiveSlug: get(collective, 'slug'),
          account: { slug: get(collective, 'slug') },
        },
      },
    ],
    awaitRefetchQueries: true,
  };

  const [inviteMemberAccount, { loading: isInviting, error: inviteError }] = useMutation(
    inviteMemberMutation,
    mutationOptions,
  );

  let submitMemberForm = null;

  const bindSubmitForm = submitForm => {
    submitMemberForm = submitForm;
  };

  const handleInviteMemberMutation = async values => {
    const { description, role, since } = values;

    try {
      await inviteMemberAccount({
        variables: {
          memberAccount: {
            slug: get(member, 'slug'),
          },
          account: { slug: get(collective, 'slug') },
          description,
          role,
          since,
          isInvitee: true,
        },
      });

      toast({
        variant: 'success',
        message: <FormattedMessage id="editTeam.member.invite.success" defaultMessage="Member invited successfully." />,
      });

      cancelHandler();
    } catch (error) {
      toast({
        variant: 'error',
        title: <FormattedMessage id="editTeam.member.invite.error" defaultMessage="Failed to invite member." />,
        message: i18nGraphqlException(intl, error),
      });
    }
  };

  const handleSubmitForm = () => {
    if (submitMemberForm) {
      submitMemberForm();
    }
  };

  return (
    <Dialog onOpenChange={show => !show && cancelHandler()} open={true}>
      <DialogPortal>
        <DialogContent onClose={cancelHandler}>
          <DialogHeader>
            <DialogTitle>
              <FormattedMessage id="editTeam.member.invite" defaultMessage="Invite Team Member" />
            </DialogTitle>
          </DialogHeader>
          {inviteError && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon m={[1, 3]} data-cy="cof-error-message">
                {inviteError.message}
              </MessageBox>
            </Flex>
          )}
          <div className="flex flex-col">
            <p className="text-sm font-bold">
              <FormattedMessage id="Tags.USER" defaultMessage="User" />
            </p>
            <CollectivePickerAsync
              inputId="member-collective-picker"
              creatable
              width="100%"
              minWidth={325}
              onChange={option => setMember(option.value)}
              isDisabled={Boolean(member)}
              types={[CollectiveType.USER]}
              filterResults={collectives => collectives.filter(c => !membersIds.includes(c.id))}
              data-cy="member-collective-picker"
              menuPortalTarget={null}
            />
          </div>
          <MemberForm
            intl={intl}
            collectiveImg={get(collective, 'imageUrl')}
            bindSubmitForm={bindSubmitForm}
            triggerSubmit={handleInviteMemberMutation}
          />
          <div className="mt-2 flex justify-between gap-4">
            <Button
              autoFocus
              variant="outline"
              onClick={cancelHandler}
              disabled={isInviting}
              data-cy="confirmation-modal-cancel"
            >
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </Button>
            <Button
              data-cy="confirmation-modal-continue"
              loading={isInviting}
              onClick={handleSubmitForm}
              disabled={!member}
              className="w-1/4"
            >
              <FormattedMessage id="save" defaultMessage="Save" />
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default InviteMemberModal;
