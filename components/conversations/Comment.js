import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { useMutation } from 'react-apollo';

import { Edit } from '@styled-icons/feather/Edit';
import { X } from '@styled-icons/feather/X';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { getErrorFromGraphqlException } from '../../lib/utils';
import RichTextEditor from '../RichTextEditor';
import HTMLContent from '../HTMLContent';
import LinkCollective from '../LinkCollective';
import Avatar from '../Avatar';
import { P } from '../Text';
import Container from '../Container';
import StyledButton from '../StyledButton';
import Hide from '../Hide';
import ConfirmationModal from '../ConfirmationModal';
import MessageBox from '../MessageBox';
import InlineEditField from '../InlineEditField';
import { CommentFieldsFragment } from './graphql';

const CommentBtn = styled(StyledButton)`
  height: 32px;
  padding: 4px 16px;
  span {
    margin-left: 0.5em;
    @media (max-width: 52em) {
      display: none;
    }
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
  mutation editComment($comment: CommentEdit!) {
    editComment(comment: $comment) {
      ...CommentFields
    }
  }
  ${CommentFieldsFragment}
`;

const mutationOptions = { context: API_V2_CONTEXT };

/**
 * Action buttons for the comment owner. Styles change between mobile and desktop.
 */
const AdminActionButtons = ({ comment, canEdit, canDelete, isConversationRoot, onDelete, onEdit }) => {
  const [isDeleting, setDeleting] = React.useState(null);
  const [deleteComment, { error: deleteError }] = useMutation(deleteCommentMutation, mutationOptions);

  return (
    <React.Fragment>
      {/** Buttons */}
      {canEdit && (
        <CommentBtn onClick={onEdit} ml={2}>
          <Edit size="1em" />
          <FormattedMessage tagName="span" id="comment.edit" defaultMessage="Edit" />
        </CommentBtn>
      )}
      {canDelete && (
        <CommentBtn onClick={() => setDeleting(true)} ml={2}>
          <X size="1em" />
          <FormattedMessage tagName="span" id="comment.delete" defaultMessage="Delete" />
        </CommentBtn>
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
            await onDelete(comment);
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
    </React.Fragment>
  );
};

AdminActionButtons.propTypes = {
  comment: PropTypes.object.isRequired,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  isConversationRoot: PropTypes.bool,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
};

/**
 * Render a comment.
 *
 * /!\ Can only be used with data from API V2.
 */
const Comment = ({ comment, canEdit, canDelete, withoutActions, maxCommentHeight, isConversationRoot, onDelete }) => {
  const [isEditing, setEditing] = React.useState(false);
  const hasActions = !withoutActions && !isEditing && (canEdit || canDelete);

  const actionButtons =
    withoutActions || isEditing ? null : (
      <Flex>
        {hasActions && (
          <AdminActionButtons
            comment={comment}
            isConversationRoot={isConversationRoot}
            onDelete={onDelete}
            onEdit={() => setEditing(true)}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )}
      </Flex>
    );

  return (
    <Container width="100%">
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
        <Hide xs sm>
          {actionButtons}
        </Hide>
      </Flex>
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
              <HTMLContent content={comment.html} fontSize="13px" />
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
      <Hide md lg mt={3}>
        {actionButtons}
      </Hide>
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
