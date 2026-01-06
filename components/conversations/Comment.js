import React from 'react';

import { CommentType } from '../../lib/graphql/types/v2/schema';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import InlineEditField from '../InlineEditField';
import RichTextEditor from '../RichTextEditor';

import CommentActions from './CommentActions';
import { CommentMetadata } from './CommentMetadata';
import EmojiReactionPicker from './EmojiReactionPicker';
import CommentReactions from './EmojiReactions';
import { editCommentMutation } from './graphql';
import SmallComment from './SmallComment';

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
  onReplyClick,
}) => {
  const [isEditing, setEditing] = React.useState(false);
  const hasActions = !isEditing;
  const anchorHash = `comment-${new Date(comment.createdAt).getTime()}`;
  const isPrivateNote = comment.type === CommentType.PRIVATE_NOTE;

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
            canReply={canReply}
            onDelete={onDelete}
            onEditClick={() => setEditing(true)}
            onReplyClick={() => {
              onReplyClick?.(comment);
            }}
          />
        )}
      </Flex>

      <Box position="relative" maxHeight={maxCommentHeight} css={{ overflowY: 'auto' }}>
        <InlineEditField
          mutation={editCommentMutation}
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
                toolbarBackgroundColor={isPrivateNote ? '#fffbeb' : '#ffffff'}
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

/**
 *
 * @param {import('./types').CommentPropsWithVariant} props
 */
export default function CommentComponent(props) {
  if (props.variant === 'small') {
    return <SmallComment {...props} />;
  }

  return <Comment {...props} />;
}
