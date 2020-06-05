import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/react-hooks';
import { X } from '@styled-icons/feather/X';
import { Edit } from '@styled-icons/material/Edit';
import themeGet from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import Avatar from '../Avatar';
import ConfirmationModal from '../ConfirmationModal';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import RoundHoriztonalDotsIcon from '../icons/RoundHorizontalDotsIcon';
import InlineEditField from '../InlineEditField';
import LinkCollective from '../LinkCollective';
import MessageBox from '../MessageBox';
import RichTextEditor from '../RichTextEditor';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { P } from '../Text';

import { CommentFieldsFragment } from './graphql';

const CommentBtn = styled(StyledButton)`
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
  }
`;

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

const ActionButton = styled(StyledButton)`
  padding: 4px 12px;
  height: 24px;
  color: #dadada;
  display: flex;
  justify-content: center;
  border-color: ${themeGet('colors.black.200')};

  &:active {
    background-color: ${themeGet('colors.white.full')};
    border-color: ${themeGet('colors.white.full')};
  }
  &:focus {
    border-color: ${themeGet('colors.white.full')};
    color: #dadada;
  }
`;

const deleteCommentMutation = gqlV2`
  mutation deleteComment($id: String!) {
    deleteComment(id: $id) {
      id
    }
  }
`;

const editCommentMutation = gqlV2`
  mutation editComment($comment: CommentUpdateInput!) {
    editComment(comment: $comment) {
      ...CommentFields
    }
  }
  ${CommentFieldsFragment}
`;

const mutationOptions = { context: API_V2_CONTEXT };

const REACT_POPPER_MODIFIERS = [
  {
    name: 'offset',
    options: {
      offset: [0, 8],
    },
  },
];

/**
 * Action buttons for the comment owner. Styles change between mobile and desktop.
 */
const AdminActionButtons = ({ canEdit, canDelete, openDeleteConfirmation, onEdit, closePopup }) => {
  return (
    <React.Fragment>
      {/** Buttons */}
      {canEdit && (
        <CommentBtn
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

/**
 * A custom hook to close the popper
 */
const useClosePopper = (popperState, closePopper) => {
  React.useEffect(() => {
    function handleOnClick(event) {
      if (popperState && !popperState.elements.reference.contains(event.target)) {
        closePopper();
      }
    }

    document.addEventListener('click', handleOnClick);
    return () => {
      document.removeEventListener('click', handleOnClick);
    };
  }, [popperState, closePopper]);
};

/**
 * Render a comment.
 *
 * /!\ Can only be used with data from API V2.
 */
const Comment = ({ comment, canEdit, canDelete, withoutActions, maxCommentHeight, isConversationRoot, onDelete }) => {
  const [isEditing, setEditing] = React.useState(false);
  const [isDeleting, setDeleting] = React.useState(null);
  const [showAdminActions, setShowAdminActions] = React.useState(false);
  const [refElement, setRefElement] = React.useState(null);
  const [popperElement, setPopperElement] = React.useState(null);

  const closePopup = () => {
    if (showAdminActions) {
      setShowAdminActions(false);
    }
  };
  const hasActions = !withoutActions && !isEditing && (canEdit || canDelete);

  const [deleteComment, { error: deleteError }] = useMutation(deleteCommentMutation, mutationOptions);
  const { styles, attributes, state } = usePopper(refElement, popperElement, {
    placement: 'bottom-start',
    modifiers: REACT_POPPER_MODIFIERS,
  });
  useClosePopper(state, closePopup);

  return (
    <Container width="100%" data-cy="comment">
      <Flex mb={3} justifyContent="space-between">
        <Flex>
          <Box mr={3}>
            <LinkCollective collective={comment.fromCollective}>
              <Avatar collective={comment.fromCollective} radius={40} />
            </LinkCollective>
          </Box>
          <Flex flexDirection="column">
            <LinkCollective collective={comment.fromCollective}>
              <P color="black.800" fontWeight="500" truncateOverflow>
                {comment.fromCollective.name}
              </P>
            </LinkCollective>
            <P fontSize="Caption" color="black.600" truncateOverflow title={comment.createdAt}>
              <FormattedMessage
                id="Comment.PostedOn"
                defaultMessage="Posted on {createdAt, date, long}"
                values={{ createdAt: new Date(comment.createdAt) }}
              />
            </P>
          </Flex>
        </Flex>
        {hasActions && (
          <ActionButton ref={setRefElement} onClick={() => setShowAdminActions(!showAdminActions)}>
            <RoundHoriztonalDotsIcon size="16" />
          </ActionButton>
        )}
        {showAdminActions && hasActions && (
          <AdminActionsPopupContainer ref={setPopperElement} style={styles.popper} {...attributes.popper}>
            <Flex justifyContent="space-between" alignItems="center">
              <P
                fontWeight="600"
                fontSize="H6"
                lineHeight="H6"
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
                onEdit={() => setEditing(true)}
                canEdit={canEdit}
                canDelete={canDelete}
                closePopup={closePopup}
              />
            </Flex>
          </AdminActionsPopupContainer>
        )}
      </Flex>
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
              <FormattedMessage id="conversation.deleteModalTitle" defaultMessage="Delete this conversation?" />
            ) : (
              <FormattedMessage id="Comment.DeleteConfirmTitle" defaultMessage="Delete this comment?" />
            )
          }
        >
          <hr />
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
      <Box position="relative" maxHeight={maxCommentHeight} css={{ overflowY: 'auto' }}>
        <InlineEditField
          mutation={editCommentMutation}
          mutationOptions={mutationOptions}
          values={comment}
          field="html"
          canEdit={canEdit}
          canDelete={canDelete}
          isEditing={isEditing}
          showEditIcon={false}
          prepareVariables={(comment, html) => ({ comment: { id: comment.id, html } })}
          disableEditor={() => setEditing(false)}
          warnIfUnsavedChanges
        >
          {({ isEditing, setValue }) =>
            !isEditing ? (
              <HTMLContent content={comment.html} fontSize="13px" data-cy="comment-body" />
            ) : (
              <RichTextEditor
                defaultValue={comment.html}
                onChange={e => setValue(e.target.value)}
                fontSize="13px"
                autoFocus
              />
            )
          }
        </InlineEditField>
      </Box>
    </Container>
  );
};

Comment.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    html: PropTypes.string,
    createdAt: PropTypes.string,
    fromCollective: PropTypes.shape({
      name: PropTypes.string,
    }),
  }).isRequired,
  /** Can current user edit this comment? */
  canEdit: PropTypes.bool,
  /** Can current user delete this comment? */
  canDelete: PropTypes.bool,
  /** Set this to true if the comment is the root comment of a conversation */
  isConversationRoot: PropTypes.bool,
  /** Set this to true to disable actions */
  withoutActions: PropTypes.bool,
  /** If set, comment will be scrollable over this height */
  maxCommentHeight: PropTypes.number,
  /** Called when comment gets deleted */
  onDelete: PropTypes.func,
};

export default Comment;
