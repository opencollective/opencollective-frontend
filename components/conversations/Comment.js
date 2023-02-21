import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import InlineEditField from '../InlineEditField';
import RichTextEditor from '../RichTextEditor';

import CommentActions from './CommentActions';
import { CommentMetadata } from './CommentMetadata';
import EmojiReactionPicker from './EmojiReactionPicker';
import CommentReactions from './EmojiReactions';
import { commentFieldsFragment } from './graphql';

const editCommentMutation = gql`
  mutation EditComment($comment: CommentUpdateInput!) {
    editComment(comment: $comment) {
      id
      ...CommentFields
    }
  }
  ${commentFieldsFragment}
`;

const mutationOptions = { context: API_V2_CONTEXT };

/**
 * Render a comment.
 *
 * /!\ Can only be used with data from API V2.
 */
const Comment = ({
  comment,
  canEdit,
  canDelete,
  maxCommentHeight,
  isConversationRoot,
  onDelete,
  reactions,
  canReply,
}) => {
  const [isEditing, setEditing] = React.useState(false);
  const hasActions = !isEditing;
  const anchorHash = `comment-${new Date(comment.createdAt).getTime()}`;

  return (
    <Container width="100%" data-cy="comment" id={anchorHash}>
      <Flex mb={3} justifyContent="space-between">
        <CommentMetadata comment={comment} />
        {hasActions && (
          <CommentActions
            comment={comment}
            anchorHash={anchorHash}
            isConversationRoot={isConversationRoot}
            canEdit={canEdit}
            canDelete={canDelete}
            onDelete={onDelete}
            onEditClick={() => setEditing(true)}
          />
        )}
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
          required
        >
          {({ isEditing, setValue, setUploading }) =>
            !isEditing ? (
              <HTMLContent content={comment.html} fontSize="13px" data-cy="comment-body" />
            ) : (
              <RichTextEditor
                kind="COMMENT"
                defaultValue={comment.html}
                onChange={e => setValue(e.target.value)}
                fontSize="13px"
                autoFocus
                setUploading={setUploading}
              />
            )
          }
        </InlineEditField>
        {(reactions || canReply) && (
          <Flex mt={3} flexWrap="wrap" data-cy="comment-reactions">
            {reactions && <CommentReactions reactions={reactions} />}
            {canReply && <EmojiReactionPicker comment={comment} reactions={reactions} />}
          </Flex>
        )}
      </Box>
    </Container>
  );
};

Comment.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    html: PropTypes.string,
    createdAt: PropTypes.string,
    fromAccount: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    }),
  }).isRequired,
  /** Reactions associated with this comment? */
  reactions: PropTypes.object,
  /** Can current user edit this comment? */
  canEdit: PropTypes.bool,
  /** Can current user delete this comment? */
  canDelete: PropTypes.bool,
  canReply: PropTypes.bool,
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
