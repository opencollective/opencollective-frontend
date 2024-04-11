import React from 'react';
import { useMutation } from '@apollo/client';
import { Check } from '@styled-icons/feather/Check';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { Link as IconLink } from '@styled-icons/feather/Link';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import useClipboard from '../../lib/hooks/useClipboard';

import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../ConfirmationModal';
import { useDrawerActionsContainer } from '../Drawer';
import { Flex } from '../Grid';
import PopupMenu from '../PopupMenu';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { useToast } from '../ui/useToast';

import Agreement from './Agreement';

const DELETE_AGREEMENT_MUTATION = gql`
  mutation DeleteAgreement($id: String!) {
    deleteAgreement(agreement: { id: $id }) {
      id
    }
  }
`;

const Action = styled.button`
  padding: 8px;
  margin: 0 8px;
  cursor: pointer;
  line-height: 16px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  background: transparent;
  outline: none;
  text-align: inherit;
  text-transform: capitalize;

  color: ${props => props.theme.colors.black[800]};

  :hover {
    color: ${props => props.theme.colors.black[700]};
  }

  :focus {
    color: ${props => props.theme.colors.black[700]};
    text-decoration: underline;
  }

  svg {
    margin-right: 8px;
    vertical-align: text-top;
  }
`;

export const AgreementWithActions = ({ agreement, onEdit, onDelete, openFileViewer }) => {
  const drawerActionsContainer = useDrawerActionsContainer();
  const [hasDeleteConfirm, setDeleteConfirm] = React.useState(false);
  const { isCopied, copy } = useClipboard();
  const [deleteAgreement] = useMutation(DELETE_AGREEMENT_MUTATION, { context: API_V2_CONTEXT });
  const { toast } = useToast();
  const intl = useIntl();
  return (
    <React.Fragment>
      <Agreement agreement={agreement} openFileViewer={() => openFileViewer(agreement.attachment)} />
      {drawerActionsContainer &&
        createPortal(
          <Flex justifyContent="space-between" width="100%">
            <PopupMenu
              placement="bottom-start"
              Button={({ onClick }) => (
                <StyledButton data-cy="more-actions" onClick={onClick} buttonSize="small" minWidth={140} flexGrow={1}>
                  <FormattedMessage defaultMessage="More actions" id="S8/4ZI" />
                  &nbsp;
                  <ChevronDown size="20px" />
                </StyledButton>
              )}
            >
              <Flex flexDirection="column">
                <Action onClick={() => copy(window.location.href)}>
                  {isCopied ? <Check size="16px" /> : <IconLink size="16px" />}
                  {isCopied ? (
                    <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
                  ) : (
                    <FormattedMessage id="CopyLink" defaultMessage="Copy link" />
                  )}
                </Action>
                <StyledHr borderColor="black.100" my={2} mx={2} />
                <Action data-cy="more-actions-delete-expense-btn" onClick={() => setDeleteConfirm(true)}>
                  <IconTrash size="16px" />
                  <FormattedMessage defaultMessage="Delete Agreement" id="iVzX67" />
                </Action>
              </Flex>
            </PopupMenu>
            <StyledButton buttonStyle="secondary" onClick={onEdit} data-cy="btn-edit-agreement">
              <FormattedMessage defaultMessage="Edit Agreement" id="ZhrlbS" />
            </StyledButton>
          </Flex>,
          drawerActionsContainer,
        )}
      {hasDeleteConfirm && (
        <ConfirmationModal
          isDanger
          type="delete"
          onClose={() => setDeleteConfirm(false)}
          header={<FormattedMessage defaultMessage="Delete Agreement" id="iVzX67" />}
          continueHandler={async () => {
            try {
              await deleteAgreement({ variables: { id: agreement.id } });
              toast({
                variant: 'success',
                message: <FormattedMessage defaultMessage="Agreement deleted successfully" id="RJt89q" />,
              });
              setDeleteConfirm(false);
              onDelete(agreement);
              return CONFIRMATION_MODAL_TERMINATE;
            } catch (e) {
              toast({
                variant: 'error',
                message: i18nGraphqlException(intl, e),
              });
            }
          }}
        >
          <FormattedMessage
            defaultMessage="This will permanently delete the agreement and all its attachments."
            id="SuVMZP"
          />
        </ConfirmationModal>
      )}
    </React.Fragment>
  );
};
