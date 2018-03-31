import models from '../../models';
import * as errors from '../errors';
import { mustBeLoggedInTo } from '../../lib/auth';
import { get } from 'lodash';
import { strip_tags } from '../../lib/utils';

function require(args, path) {
  if (!get(args, path)) throw new errors.ValidationFailed({ message: `${path} required` });
}

export async function createComment(_, args, req) {
  require(args, 'comment.markdown');
  mustBeLoggedInTo(req.remoteUser, "create a comment");
  const {
    comment: {
      CollectiveId,
      ExpenseId,
      UpdateId
    }
  } = args;
  const commentData = {
    markdown: strip_tags(args.comment.markdown),
    CollectiveId,
    ExpenseId,
    UpdateId,
    CreatedByUserId: req.remoteUser.id,
    FromCollectiveId: req.remoteUser.CollectiveId
  };
  console.log(">>> create comment: ", commentData);
  const comment = await models.Comment.create(commentData);

  return comment;
}

async function fetchComment(id) {
  const comment = await models.Comment.findById(id);
  if (!comment) throw new errors.NotFound({ message: `Comment with id ${id} not found` });
  return comment;
}

export async function editComment(_, args, req) {
  require(args, 'comment.id');  
  const comment = await fetchComment(args.comment.id);
  return await comment.edit(req.remoteUser, args.comment);
}

export async function deleteComment(_, args, req) {
  const comment = await fetchComment(args.id);
  return await comment.delete(req.remoteUser);
}