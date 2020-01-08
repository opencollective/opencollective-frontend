import * as errors from '../../errors';
import { get } from 'lodash';
import * as common from '../../common/comment';

function require(args, path) {
  if (!get(args, path)) {
    throw new errors.ValidationFailed({ message: `${path} required` });
  }
}

async function editComment(_, { comment }, { remoteUser }) {
  require(comment, 'id');
  return common.editComment(comment, remoteUser);
}

async function deleteComment(_, { id }, { remoteUser }) {
  return common.deleteComment(id, remoteUser);
}

/**
 * Doing this so that I don't have to import the common module
 * directly where the comment mutations are used.
 */
const createComment = common.createCommentResolver;

export { createComment, deleteComment, editComment };
