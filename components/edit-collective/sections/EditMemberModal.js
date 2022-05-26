import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Delete } from '@styled-icons/material/Delete';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage } from 'react-intl';

import roles from '../../../lib/constants/roles';
import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { Flex } from '../../Grid';
import StyledButton from '../../StyledButton';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import StyledTooltip from '../../StyledTooltip';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

import MemberForm from './MemberForm';
import { coreContributorsQuery } from './Members';

const editMemberMutation = gqlV2/* GraphQL */ `
  mutation EditMember(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole
    $description: String
    $since: DateTime
  ) {
    editMember(
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

const editMemberInvitationMutation = gqlV2/* GraphQL */ `
  mutation EditMemberInvitation(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole
    $description: String
    $since: DateTime
  ) {
    editMemberInvitation(
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

const removeMemberMutation = gqlV2/* GraphQL */ `
  mutation RemoveMember(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole!
    $isInvitation: Boolean
  ) {
    removeMember(memberAccount: $memberAccount, account: $account, role: $role, isInvitation: $isInvitation)
  }
`;

const EditMemberModal = props => {
  const { intl, member, collective, canRemove, isLastAdmin, cancelHandler, LoggedInUser, refetchLoggedInUser } = props;

  const { addToast } = useToasts();

  const isInvitation = get(member, '__typename') === 'MemberInvitation';

  const messages = defineMessages({
    cantRemoveLast: {
      id: 'members.remove.cantRemoveLast',
      defaultMessage: 'The last admin cannot be removed. Please add another admin first.',
    },
    removeConfirm: {
      id: 'members.remove.confirm',
      defaultMessage: `Do you really want to remove {name} @{slug} {hasEmail, select, 1 {({email})} other {}}?`,
    },
  });

  const [editMemberAccount, { loading: isEditingMember }] = useMutation(editMemberMutation, {
    context: API_V2_CONTEXT,
  });

  const [editMemberInvitationAccount, { loading: isEditingMemberInvitation }] = useMutation(
    editMemberInvitationMutation,
    { context: API_V2_CONTEXT },
  );

  const [removeMemberAccount, { loading: isRemovingMember }] = useMutation(removeMemberMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: [
      {
        query: coreContributorsQuery,
        context: API_V2_CONTEXT,
        variables: {
          collectiveSlug: get(collective, 'slug'),
          account: { slug: get(collective, 'slug') },
        },
      },
    ],
    awaitRefetchQueries: true,
  });

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
            slug: get(member.account, 'slug'),
          },
          account: { slug: get(collective, 'slug') },
          description,
          role,
          since,
        },
      });

      addToast({
        type: TOAST_TYPE.SUCCESS,
        title: <FormattedMessage id="editTeam.member.edit.success" defaultMessage="Member updated successfully." />,
      });

      if (get(member, 'account.slug') === get(LoggedInUser, 'collective.slug')) {
        await refetchLoggedInUser();
      }

      cancelHandler();
    } catch (error) {
      addToast({
        type: TOAST_TYPE.ERROR,
        title: <FormattedMessage id="editTeam.member.edit.error" defaultMessage="Failed to update member." />,
        message: i18nGraphqlException(intl, error),
        variant: 'light',
      });
    }
  };

  const handleEditMemberInvitationMutation = async values => {
    const { description, role, since } = values;

    try {
      await editMemberInvitationAccount({
        variables: {
          memberAccount: {
            slug: get(member, 'memberAccount.slug'),
          },
          account: { slug: get(collective, 'slug') },
          description,
          role,
          since,
        },
      });

      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: (
          <FormattedMessage
            id="editTeam.memberInvitation.edit.success"
            defaultMessage="Member invitation updated successfully."
          />
        ),
      });

      cancelHandler();
    } catch (error) {
      addToast({
        type: TOAST_TYPE.ERROR,
        title: (
          <FormattedMessage
            id="editTeam.memberInvitation.edit.error"
            defaultMessage="Failed to update member invitation."
          />
        ),
        message: i18nGraphqlException(intl, error),
      });
    }
  };

  const confirmRemoveMember = memberEntry => {
    const account = memberEntry.account || memberEntry.memberAccount;
    return window.confirm(
      intl.formatMessage(messages.removeConfirm, {
        ...account,
        hasEmail: Number(account.email),
      }),
    );
  };

  const handleRemoveMemberMutation = async () => {
    if (confirmRemoveMember(member)) {
      try {
        await removeMemberAccount({
          variables: {
            memberAccount: {
              slug: get(member, 'account.slug') || get(member, 'memberAccount.slug'),
            },
            account: { slug: get(collective, 'slug') },
            role: get(member, 'role'),
            isInvitation,
          },
        });

        addToast({
          type: TOAST_TYPE.SUCCESS,
          message: (
            <FormattedMessage id="editTeam.member.remove.success" defaultMessage="Member removed successfully." />
          ),
        });

        if (get(member, 'account.slug') === get(LoggedInUser, 'collective.slug')) {
          await props.router.push({ pathname: `/${get(collective, 'slug')}` });
          await refetchLoggedInUser();
        }

        cancelHandler();
      } catch (error) {
        addToast({
          type: TOAST_TYPE.ERROR,
          title: <FormattedMessage id="editTeam.member.remove.error" defaultMessage="Failed to remove member." />,
          message: i18nGraphqlException(intl, error),
        });
      }
    } else {
      cancelHandler();
    }
  };

  const handleSubmitForm = () => {
    if (submitMemberForm) {
      submitMemberForm();
    }
  };

  return (
    <Container>
      <StyledModal width={688} onClose={cancelHandler}>
        <ModalHeader>
          <FormattedMessage id="editTeam.member.edit" defaultMessage="Edit Team Member" />
        </ModalHeader>
        <ModalBody>
          <MemberForm
            intl={intl}
            collectiveImg={get(collective, 'imageUrl')}
            member={member}
            bindSubmitForm={bindSubmitForm}
            triggerSubmit={isInvitation ? handleEditMemberInvitationMutation : handleEditMemberMutation}
          />
          <Flex justifyContent="flex-end">
            {isLastAdmin && member.role === roles.ADMIN ? (
              <StyledTooltip place="bottom" content={() => intl.formatMessage(messages.cantRemoveLast)}>
                <StyledButton
                  mt={4}
                  disabled={true}
                  buttonSize="tiny"
                  buttonStyle="dangerSecondary"
                  data-cy="remove-member"
                  onClick={handleRemoveMemberMutation}
                >
                  <Flex alignItems="center">
                    <Delete height={25} />
                    <FormattedMessage id="Remove" defaultMessage="Remove" />
                  </Flex>
                </StyledButton>
              </StyledTooltip>
            ) : (
              <StyledButton
                mt={4}
                disabled={!canRemove}
                buttonSize="tiny"
                buttonStyle="dangerSecondary"
                data-cy="remove-member"
                onClick={handleRemoveMemberMutation}
                loading={isRemovingMember}
              >
                <Flex alignItems="center">
                  <Delete height={25} />
                  <FormattedMessage id="Remove" defaultMessage="Remove" />
                </Flex>
              </StyledButton>
            )}
          </Flex>
        </ModalBody>
        <ModalFooter mt={5}>
          <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
            <StyledButton
              mx={20}
              my={1}
              autoFocus
              onClick={cancelHandler}
              disabled={isEditingMember || isEditingMemberInvitation || isRemovingMember}
              data-cy="confirmation-modal-cancel"
            >
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
            <StyledButton
              my={1}
              buttonStyle="primary"
              data-cy="confirmation-modal-continue"
              loading={isEditingMember || isEditingMemberInvitation}
              disabled={isRemovingMember}
              onClick={handleSubmitForm}
            >
              <FormattedMessage id="save" defaultMessage="Save" />
            </StyledButton>
          </Container>
        </ModalFooter>
      </StyledModal>
    </Container>
  );
};

EditMemberModal.propTypes = {
  collective: PropTypes.object,
  cancelHandler: PropTypes.func,
  intl: PropTypes.object.isRequired,
  isLastAdmin: PropTypes.bool,
  member: PropTypes.object,
  LoggedInUser: PropTypes.object.isRequired,
  refetchLoggedInUser: PropTypes.func.isRequired,
  router: PropTypes.object,
  canRemove: PropTypes.bool,
};

EditMemberModal.defaultProps = {
  canRemove: true,
};

export default withRouter(EditMemberModal);
