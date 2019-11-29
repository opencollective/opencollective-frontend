import { GraphQLNonNull, GraphQLString } from 'graphql';
import { Comment } from '../object/Comment';
import { CommentEdit } from '../input/CommentEdit';
import { CommentCreate } from '../input/CommentCreate';
import { editComment, deleteComment, createCommentResolver } from '../../common/comment';
import { getDecodedId, idDecode, IDENTIFIER_TYPES } from '../identifiers';

const commentMutations = {
  editComment: {
    type: Comment,
    args: {
      comment: {
        type: new GraphQLNonNull(CommentEdit),
      },
    },
    resolve(_, { comment }, { remoteUser }) {
      const commentToEdit = { ...comment, id: getDecodedId(comment.id) };
      return editComment(commentToEdit, remoteUser);
    },
  },
  deleteComment: {
    type: Comment,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLString),
      },
    },
    resolve(_, { id }, { remoteUser }) {
      const decodedId = getDecodedId(id);
      return deleteComment(decodedId, remoteUser);
    },
  },
  createComment: {
    type: Comment,
    args: {
      comment: {
        type: new GraphQLNonNull(CommentCreate),
      },
    },
    resolve: (entity, args, req) => {
      if (args.comment.ConversationId) {
        args.comment.ConversationId = parseInt(idDecode(args.comment.ConversationId, IDENTIFIER_TYPES.CONVERSATION));
      }

      return createCommentResolver(entity, args, req);
    },
  },
};

export default commentMutations;
