import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { CollectiveType } from '../../../lib/constants/collectives';

import Container from '../../Container';
import CollectivePickerAsync from '../../CollectivePickerAsync';
import { Flex } from '../../Grid';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

import MemberForm from './MemberForm';
import { coreContributorsQuery } from './Members';

const inviteMemberMutation = gqlV2/* GraphQL */ `
  mutation InviteMember(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole
    $description: String
    $since: ISODateTime
  ) {
    inviteMember(
      memberAccount: $memberAccount
      account: $account
      role: $role
      description: $description
      since: $since
    ) {
      id
    }
  }
`;

const InviteMemberModal = props => {
  const { intl, index, show, collective, membersIds, cancelHandler } = props;

  const { addToast } = useToasts();

  const [member, setMember] = React.useState(null);
  const mutationOptions = {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: coreContributorsQuery, variables: { collectiveId: get(collective, 'id') } }],
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

      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: <FormattedMessage id="editTeam.member.invite.success" defaultMessage="Member invited successfully." />,
      });

      cancelHandler();
    } catch (error) {
      addToast({
        type: TOAST_TYPE.ERROR,
        message: <FormattedMessage id="editTeam.member.invite.error" defaultMessage="Failed to invite member." />,
      });
    }
  };

  const handleSubmitForm = () => {
    if (submitMemberForm) {
      submitMemberForm();
    }
  };

  return (
    <Container>
      <Modal show={show} onClose={cancelHandler}>
        <ModalHeader>
          <FormattedMessage id="editTeam.member.edit" defaultMessage="Edit Team Member" />
        </ModalHeader>
        <ModalBody>
          {inviteError && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon m={[1, 3]} data-cy="cof-error-message">
                {inviteError.message}
              </MessageBox>
            </Flex>
          )}
          <CollectivePickerAsync
            inputId="member-collective-picker"
            creatable
            width="100%"
            minWidth={325}
            maxWidth={450}
            onChange={option => setMember(option.value)}
            // getOptions={member && (buildOption => buildOption(member))}
            isDisabled={Boolean(member)}
            types={[CollectiveType.USER]}
            filterResults={collectives => collectives.filter(c => !membersIds.includes(c.id))}
            data-cy="member-collective-picker"
          />
          <MemberForm
            intl={intl}
            collectiveImg={get(collective, 'imageUrl')}
            membersIds={membersIds}
            index={index}
            bindSubmitForm={bindSubmitForm}
            triggerSubmit={handleInviteMemberMutation}
          />
        </ModalBody>
        <ModalFooter>
          <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
            <StyledButton
              mx={20}
              my={1}
              autoFocus
              minWidth={140}
              onClick={cancelHandler}
              disabled={isInviting}
              data-cy="confirmation-modal-cancel"
            >
              <FormattedMessage id="no" defaultMessage="No" />
            </StyledButton>
            <StyledButton
              my={1}
              minWidth={140}
              buttonStyle="primary"
              data-cy="confirmation-modal-continue"
              loading={isInviting}
              onClick={handleSubmitForm}
            >
              <FormattedMessage id="yes" defaultMessage="Yes" />
            </StyledButton>
          </Container>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default InviteMemberModal;
