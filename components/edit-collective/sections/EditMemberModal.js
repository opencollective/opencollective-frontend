import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Delete } from '@styled-icons/material/Delete';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import roles from '../../../lib/constants/roles';

import Container from '../../Container';
import { Flex } from '../../Grid';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

import MemberForm from './MemberForm';
import { coreContributorsQuery } from './Members';

const editMemberMutation = gqlV2/* GraphQL */ `
  mutation EditMember(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole
    $description: String
    $since: ISODateTime
    $isInvitation: Boolean
  ) {
    editMember(
      memberAccount: $memberAccount
      account: $account
      role: $role
      description: $description
      since: $since
      isInvitation: $isInvitation
    ) {
      id
    }
  }
`;

const removeMemberMutation = gqlV2/* GraphQL */ `
  mutation RemoveMember(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole
    $isInvitation: Boolean
  ) {
    removeMember(memberAccount: $memberAccount, account: $account, role: $role, isInvitation: $isInvitation)
  }
`;

const EditMemberModal = props => {
  const { intl, member, index, editMember, show, collective, membersIds, isLastAdmin, cancelHandler } = props;

  const { addToast } = useToasts();

  const isInvitation = get(member, '__typename') === 'MemberInvitation';

  const mutationOptions = {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: coreContributorsQuery, variables: { collectiveId: get(collective, 'id') } }],
    awaitRefetchQueries: true,
  };

  const [editMemberAccount, { loading: isEditing, error: editError }] = useMutation(
    editMemberMutation,
    mutationOptions,
  );

  const [removeMemberAccount, { error: removeError }] = useMutation(removeMemberMutation, mutationOptions);

  let submitMemberForm = null;

  const bindSubmitForm = submitForm => {
    submitMemberForm = submitForm;
  };

  const handleEditMemberMutation = async values => {
    const { description, role, since } = values;

    try {
      await editMemberAccount({
        variables: {
          memberAccount: {
            slug: get(member.member, 'slug'),
          },
          account: { slug: get(collective, 'slug') },
          description,
          role,
          since,
          isInvitation,
        },
      });

      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: <FormattedMessage id="editTeam.member.edit.success" defaultMessage="Member updated successfully." />,
      });

      cancelHandler();
    } catch (error) {
      addToast({
        type: TOAST_TYPE.ERROR,
        message: <FormattedMessage id="editTeam.member.edit.error" defaultMessage="Failed to update member." />,
      });
    }
  };

  const handleRemoveMemberMutation = async () => {
    try {
      await removeMemberAccount({
        variables: {
          memberAccount: {
            slug: get(member.member, 'slug'),
          },
          account: { slug: get(collective, 'slug') },
          role: get(member, 'role'),
          isInvitation,
        },
      });

      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: <FormattedMessage id="editTeam.member.remove.success" defaultMessage="Member removed successfully." />,
      });

      cancelHandler();
    } catch (error) {
      addToast({
        type: TOAST_TYPE.ERROR,
        message: <FormattedMessage id="editTeam.member.remove.error" defaultMessage="Failed to remove member." />,
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
          {editError && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon m={[1, 3]} data-cy="cof-error-message">
                {editError.message}
              </MessageBox>
            </Flex>
          )}
          {removeError && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon m={[1, 3]} data-cy="cof-error-message">
                {removeError.message}
              </MessageBox>
            </Flex>
          )}
          <MemberForm
            intl={intl}
            collectiveImg={get(collective, 'imageUrl')}
            membersIds={membersIds}
            member={member}
            index={index}
            editMember={editMember}
            bindSubmitForm={bindSubmitForm}
            triggerSubmit={handleEditMemberMutation}
          />
          <Flex justifyContent="flex-end">
            <StyledButton
              mt={4}
              minWidth={140}
              disabled={isLastAdmin && member.role === roles.ADMIN}
              buttonStyle="dangerSecondary"
              data-cy="remove-member"
              onClick={handleRemoveMemberMutation}
            >
              <Flex alignItems="center">
                <Delete height={25} />
                <FormattedMessage id="as" defaultMessage="Delete Member" />
              </Flex>
            </StyledButton>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
            <StyledButton
              mx={20}
              my={1}
              autoFocus
              minWidth={140}
              onClick={cancelHandler}
              disabled={isEditing}
              data-cy="confirmation-modal-cancel"
            >
              <FormattedMessage id="no" defaultMessage="No" />
            </StyledButton>
            <StyledButton
              my={1}
              minWidth={140}
              buttonStyle="primary"
              data-cy="confirmation-modal-continue"
              loading={isEditing}
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

export default EditMemberModal;
