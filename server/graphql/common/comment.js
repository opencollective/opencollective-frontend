import models from '../../models';
import * as errors from '../errors';
import { mustBeLoggedInTo } from '../../lib/auth';
import { strip_tags } from '../../lib/utils';

/**
 * Fetch comment by id
 * @param {number} id - comment id
 */
async function fetchComment(id) {
  const comment = await models.Comment.findByPk(id);
  if (!comment) throw new errors.NotFound({ message: `Comment with id ${id} not found` });
  return comment;
}

/**
 *  Edits a comment
 * @param {object} comment - comment to edit
 * @param {object} remoteUser - logged user
 */
async function editComment(comment, remoteUser) {
  mustBeLoggedInTo(remoteUser, 'edit this comment');
  const toEditComment = await fetchComment(comment.id);
  return toEditComment.edit(remoteUser, comment);
}

/**
 *  Deletes a comment
 * @param {number} id - comment identifier
 * @param {object} remoteUser - logged user
 */
async function deleteComment(id, remoteUser) {
  mustBeLoggedInTo(remoteUser, 'delete this comment');
  const comment = await fetchComment(id);
  return await comment.delete(remoteUser);
}

async function createCommentResolver(_, { comment }, { remoteUser }) {
  mustBeLoggedInTo(remoteUser, 'create a comment');

  // Validate required fields
  if (!comment.markdown && !comment.html) {
    throw new errors.ValidationFailed({
      message: 'comment.markdown or comment.html required',
    });
  }

  const { ExpenseId, UpdateId, markdown, html } = comment;

  const expense = await models.Expense.findByPk(ExpenseId);
  if (!expense) throw new errors.NotFound({ message: `Expense with id ${ExpenseId} not found` });

  const commentData = {
    ExpenseId,
    UpdateId,
    CollectiveId: expense.CollectiveId,
    CreatedByUserId: remoteUser.id,
    FromCollectiveId: remoteUser.CollectiveId,
  };
  if (markdown) {
    commentData.markdown = strip_tags(markdown);
  }
  if (html) {
    commentData.html = strip_tags(html);
  }

  return models.Comment.create(commentData);
}

function collectiveResolver({ CollectiveId }, _, { loaders }) {
  return loaders.collective.findById.load(CollectiveId);
}

function fromCollectiveResolver({ FromCollectiveId }, _, { loaders }) {
  return loaders.collective.findById.load(FromCollectiveId);
}

/**
 * Returns a resolver function that strip tags from the object prop.
 * @param {string} prop - prop to look in the object of the resolver first argument.
 */
const getStripTagsResolver = prop => obj => strip_tags(obj[prop] || '');

export {
  editComment,
  deleteComment,
  fetchComment,
  createCommentResolver,
  collectiveResolver,
  fromCollectiveResolver,
  getStripTagsResolver,
};
