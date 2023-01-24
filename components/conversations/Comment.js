import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import InlineEditField from '../InlineEditField';
import LinkCollective from '../LinkCollective';
import RichTextEditor from '../RichTextEditor';
import { P } from '../Text';

import CommentActions from './CommentActions';
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
  withoutActions,
  maxCommentHeight,
  isConversationRoot,
  onDelete,
  reactions,
  canReply,
}) => {
  const [isEditing, setEditing] = React.useState(false);
  const hasActions = !withoutActions && !isEditing && (canEdit || canDelete);
  const hasReactionsPicker = canReply && !withoutActions;

  return (
    <Container width="100%" data-cy="comment">
      <Flex mb={3} justifyContent="space-between">
        <Flex>
          <Box mr={3}>
            <LinkCollective collective={comment.fromAccount}>
              <Avatar collective={comment.fromAccount} radius={40} />
            </LinkCollective>
          </Box>
          <Flex flexDirection="column">
            <LinkCollective collective={comment.fromAccount}>
              <P color="black.800" fontWeight="500" truncateOverflow>
                {comment.fromAccount.name}
              </P>
            </LinkCollective>
            <P fontSize="12px" color="black.600" truncateOverflow title={comment.createdAt}>
              <FormattedMessage
                id="Comment.PostedOn"
                defaultMessage="Posted on {createdAt, date, long}"
                values={{ createdAt: new Date(comment.createdAt) }}
              />
            </P>
          </Flex>
        </Flex>
        {hasActions && (
          <CommentActions
            comment={comment}
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
                defaultValue={comment.html}
                onChange={e => setValue(e.target.value)}
                fontSize="13px"
                autoFocus
                setUploading={setUploading}
              />
            )
          }
        </InlineEditField>
        {(reactions || hasReactionsPicker) && (
          <Flex mt={3} flexWrap="wrap" data-cy="comment-reactions">
            {reactions && <CommentReactions reactions={reactions} />}
            {hasReactionsPicker && <EmojiReactionPicker comment={comment} reactions={reactions} />}
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
