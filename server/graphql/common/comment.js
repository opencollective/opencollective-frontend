import { pick } from 'lodash';
import models from '../../models';
import * as errors from '../errors';
import { mustBeLoggedInTo } from '../../lib/auth';
import { strip_tags } from '../../lib/utils';

/**
 * Return the collective ID for the given comment based on it's association (conversation,
 * expense or update).
 */
const getCollectiveIdForCommentEntity = async commentValues => {
  if (commentValues.ExpenseId) {
    const expense = await models.Expense.findByPk(commentValues.ExpenseId);
    return expense && expense.CollectiveId;
  } else if (commentValues.ConversationId) {
    const conversation = await models.Conversation.findByPk(commentValues.ConversationId);
    return conversation && conversation.CollectiveId;
  } else if (commentValues.UpdateId) {
    const update = await models.Update.findByPk(commentValues.UpdateId);
    return update && update.CollectiveId;
  }
};

/**
 *  Edits a comment
 * @param {object} comment - comment to edit
 * @param {object} remoteUser - logged user
 */
async function editComment(commentData, remoteUser) {
  mustBeLoggedInTo(remoteUser, 'edit this comment');

  const comment = await models.Comment.findByPk(commentData.id);
  if (!comment) {
    throw new errors.NotFound({ message: `This comment does not exist or has been deleted.` });
  }

  // Check permissions
  if (remoteUser.id !== comment.CreatedByUserId && !remoteUser.isAdmin(comment.CollectiveId)) {
    throw new errors.Unauthorized({
      message: 'You must be the author or an admin of this collective to edit this comment',
    });
  }

  // Prepare args and update
  const editableAttributes = ['markdown', 'html'];
  return await comment.update(pick(commentData, editableAttributes));
}

/**
 *  Deletes a comment
 * @param {number} id - comment identifier
 * @param {object} remoteUser - logged user
 */
async function deleteComment(id, remoteUser) {
  mustBeLoggedInTo(remoteUser, 'delete this comment');
  const comment = await models.Comment.findByPk(id);
  if (!comment) {
    throw new errors.NotFound({ message: `This comment does not exist or has been deleted.` });
  }

  // Check permissions
  if (remoteUser.id !== comment.CreatedByUserId && !remoteUser.isAdmin(comment.CollectiveId)) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in as a core contributor or as a host to delete this comment',
    });
  }

  return comment.destroy();
}

async function createCommentResolver(_, { comment: commentData }, { remoteUser }) {
  mustBeLoggedInTo(remoteUser, 'create a comment');

  if (!commentData.markdown && !commentData.html) {
    throw new errors.ValidationFailed({
      message: 'comment.markdown or comment.html required',
    });
  }

  const { ConversationId, ExpenseId, UpdateId, markdown, html } = commentData;

  // Ensure at least (and only) one entity to comment is specified
  if ([ConversationId, ExpenseId, UpdateId].filter(Boolean).length !== 1) {
    throw new errors.ValidationFailed({ message: 'You must specify one entity to comment' });
  }

  // Load entity and its collective id
  const CollectiveId = await getCollectiveIdForCommentEntity(commentData);
  if (!CollectiveId) {
    throw new errors.ValidationFailed({
      message: "The item you're trying to comment doesn't exist or has been deleted.",
    });
  }

  // Create comment
  const comment = await models.Comment.create({
    CollectiveId,
    ExpenseId,
    UpdateId,
    ConversationId,
    html, // HTML is sanitized at the model level, no need to do it here
    markdown, // DEPRECATED - sanitized at the model level, no need to do it here
    CreatedByUserId: remoteUser.id,
    FromCollectiveId: remoteUser.CollectiveId,
  });

  if (ConversationId) {
    models.ConversationFollower.follow(remoteUser.id, ConversationId);
  }

  return comment;
}

function collectiveResolver({ CollectiveId }, _, { loaders }) {
  return loaders.Collective.byId.load(CollectiveId);
}

function fromCollectiveResolver({ FromCollectiveId }, _, { loaders }) {
  return loaders.Collective.byId.load(FromCollectiveId);
}

/**
 * Returns a resolver function that strip tags from the object prop.
 * @param {string} prop - prop to look in the object of the resolver first argument.
 */
const getStripTagsResolver = prop => obj => strip_tags(obj[prop] || '');

export {
  editComment,
  deleteComment,
  createCommentResolver,
  collectiveResolver,
  fromCollectiveResolver,
  getStripTagsResolver,
};
