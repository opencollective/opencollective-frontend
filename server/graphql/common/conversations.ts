import { pick } from 'lodash';
import { Unauthorized, FeatureNotSupportedForCollective, NotFound, FeatureNotAllowedForUser } from '../errors';
import models from '../../models';
import hasFeature from '../../lib/allowed-features';
import { canUseFeature } from '../../lib/user-permissions';
import FEATURE from '../../constants/feature';

/** Params given to create a new conversation */
interface CreateConversationParams {
  title: string;
  html: string;
  CollectiveId: number;
  tags?: string[] | null;
}

/**
 * Create a conversation started by the given `remoteUser`.
 *
 * @returns the conversation
 */
export const createConversation = async (remoteUser, params: CreateConversationParams) => {
  // For now any authenticated user can create a conversation to any collective
  if (!remoteUser) {
    throw new Unauthorized();
  } else if (!canUseFeature(remoteUser, FEATURE.CONVERSATIONS)) {
    throw new FeatureNotAllowedForUser();
  }

  const { CollectiveId, title, html, tags } = params;

  // Collective must exist and be of type `COLLECTIVE`
  const collective = await models.Collective.findByPk(CollectiveId);
  if (!collective) {
    throw new Error("This Collective doesn't exist or has been deleted");
  } else if (!hasFeature(collective, FEATURE.CONVERSATIONS)) {
    throw new FeatureNotSupportedForCollective();
  }

  return models.Conversation.createWithComment(remoteUser, collective, title, html, tags);
};

interface EditConversationParams {
  id: number;
  title: string;
}

/**
 * Edit a conversation started by the given `remoteUser`.
 *
 * @returns the conversation
 */
export const editConversation = async (remoteUser, params: EditConversationParams) => {
  if (!remoteUser) {
    throw new Unauthorized();
  } else if (!canUseFeature(remoteUser, FEATURE.CONVERSATIONS)) {
    throw new FeatureNotAllowedForUser();
  }

  // Collective must exist and use be author or collective admin
  const conversation = await models.Conversation.findByPk(params.id);
  if (!conversation) {
    throw new NotFound();
  } else if (!remoteUser.isAdmin(conversation.FromCollectiveId) && !remoteUser.isAdmin(conversation.CollectiveId)) {
    throw new Unauthorized();
  }

  return conversation.update(pick(params, ['title', 'tags']));
};
