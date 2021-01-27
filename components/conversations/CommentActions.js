import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { X } from '@styled-icons/feather/X';
import { Edit } from '@styled-icons/material/Edit';
import { FormattedMessage } from 'react-intl';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';

import ConfirmationModal from '../ConfirmationModal';
import Container from '../Container';
import { Flex } from '../Grid';
import RoundHoriztonalDotsIcon from '../icons/RoundHorizontalDotsIcon';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { P } from '../Text';

import Comment from './Comment';

const AdminActionsPopupContainer = styled(Flex)`
  flex-direction: column;
  background: #ffffff;
  border: 1px solid rgba(49, 50, 51, 0.1);
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
  width: 184px;
  padding: 16px;
  z-index: 1;
`;

const CommentBtn = styled(StyledButton).attrs({ buttonSize: 'small' })`
  padding: 3px 5px;
  margin: 5px 0;
  width: 100%;
  text-align: left;
  border: none;

  span {
    margin-left: 12px;
    font-weight: 500;
    font-size: 14px;
    line-height: 21px;
    letter-spacing: -0.1px;
    vertical-align: middle;
  }
`;

/**
 * Action buttons for the comment owner. Styles change between mobile and desktop.
 */
const AdminActionButtons = ({ canEdit, canDelete, openDeleteConfirmation, onEdit, closePopup }) => {
  return (
    <React.Fragment>
      {/** Buttons */}
      {canEdit && (
        <CommentBtn
          data-cy="edit-comment-btn"
          onClick={() => {
            closePopup();
            onEdit();
          }}
        >
          <Edit size="1em" mr={2} />
          <FormattedMessage tagName="span" id="Edit" defaultMessage="Edit" />
        </CommentBtn>
      )}
      {canDelete && (
        <CommentBtn
          data-cy="delete-comment-btn"
          onClick={() => {
            closePopup();
            openDeleteConfirmation();
          }}
          color="red.600"
        >
          <X size="1em" mr={2} />
          <FormattedMessage tagName="span" id="actions.delete" defaultMessage="Delete" />
        </CommentBtn>
      )}
    </React.Fragment>
  );
};

AdminActionButtons.propTypes = {
  comment: PropTypes.object.isRequired,
  openDeleteConfirmation: PropTypes.func,
  onEdit: PropTypes.func,
  closePopup: PropTypes.func,
  isConversationRoot: PropTypes.bool,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
};

const deleteCommentMutation = gqlV2/* GraphQL */ `
  mutation DeleteComment($id: String!) {
    deleteComment(id: $id) {
      id
    }
  }
`;

const REACT_POPPER_MODIFIERS = [
  {
    name: 'offset',
    options: {
      offset: [0, 8],
    },
  },
];

const mutationOptions = { context: API_V2_CONTEXT };

const CommentActions = ({ comment, isConversationRoot, canEdit, canDelete, onDelete, onEditClick }) => {
  const [isDeleting, setDeleting] = React.useState(null);
  const [showAdminActions, setShowAdminActions] = React.useState(false);
  const [refElement, setRefElement] = React.useState(null);
  const [popperElement, setPopperElement] = React.useState(null);
  const [deleteComment, { error: deleteError }] = useMutation(deleteCommentMutation, mutationOptions);
  const { styles, attributes, state } = usePopper(refElement, popperElement, {
    placement: 'bottom-end',
    modifiers: REACT_POPPER_MODIFIERS,
  });

  useGlobalBlur(state?.elements.popper, outsise => {
    if (outsise && showAdminActions) {
      setShowAdminActions(false);
    }
  });

  return (
    <React.Fragment>
      <div>
        <StyledButton
          ref={setRefElement}
          buttonSize="tiny"
          data-cy="commnent-actions-trigger"
          onClick={() => setShowAdminActions(!showAdminActions)}
        >
          <RoundHoriztonalDotsIcon size="16" />
        </StyledButton>
      </div>

      {showAdminActions && (
        <AdminActionsPopupContainer ref={setPopperElement} style={styles.popper} {...attributes.popper}>
          <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <P
              fontWeight="600"
              fontSize="9px"
              lineHeight="14px"
              textTransform="uppercase"
              letterSpacing="0.6px"
              whiteSpace="nowrap"
              pr={2}
            >
              <FormattedMessage id="comment.actions" defaultMessage="Comment Actions" />
            </P>
            <StyledHr flex="1" borderStyle="solid" borderColor="black.300" />
          </Flex>
          <Flex flexDirection="column" alignItems="flex-start">
            <AdminActionButtons
              comment={comment}
              isConversationRoot={isConversationRoot}
              openDeleteConfirmation={() => setDeleting(true)}
              onEdit={onEditClick}
              canEdit={canEdit}
              canDelete={canDelete}
              closePopup={() => setShowAdminActions(false)}
            />
          </Flex>
        </AdminActionsPopupContainer>
      )}
      {/** Confirm Modals */}
      {isDeleting && (
        <ConfirmationModal
          show
          isDanger
          type="delete"
          onClose={() => setDeleting(false)}
          continueHandler={async () => {
            await deleteComment({ variables: { id: comment.id } });
            if (onDelete) {
              await onDelete(comment);
            }
          }}
          header={
            isConversationRoot ? (
              <FormattedMessage id="conversation.deleteModalTitle" defaultMessage="Delete this Conversation?" />
            ) : (
              <FormattedMessage id="Comment.DeleteConfirmTitle" defaultMessage="Delete this comment?" />
            )
          }
        >
          <StyledHr mb={4} borderColor="#e1e4e6" />
          {isConversationRoot && (
            <MessageBox type="warning" withIcon mb={3}>
              <FormattedMessage
                id="conversation.deleteMessage"
                defaultMessage="The message and all its replies will be permanently deleted."
              />
            </MessageBox>
          )}
          <Container padding={2} borderRadius={8} border="1px solid #e1e4e6">
            <Comment comment={comment} maxCommentHeight={150} withoutActions />
          </Container>
          {deleteError && (
            <MessageBox type="error" withIcon mt={3}>
              {getErrorFromGraphqlException(deleteError).message}
            </MessageBox>
          )}
        </ConfirmationModal>
      )}
    </React.Fragment>
  );
};

CommentActions.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    html: PropTypes.string,
    createdAt: PropTypes.string,
    fromCollective: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    }),
  }).isRequired,
  /** Can current user edit this comment? */
  canEdit: PropTypes.bool,
  /** Can current user delete this comment? */
  canDelete: PropTypes.bool,
  /** Set this to true if the comment is the root comment of a conversation */
  isConversationRoot: PropTypes.bool,
  /** Called when comment gets deleted */
  onDelete: PropTypes.func,
  /** Called when comment gets deleted */
  onEditClick: PropTypes.func,
};

export default CommentActions;
