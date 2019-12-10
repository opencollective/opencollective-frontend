import { expect } from 'chai';
import models from '../../../server/models';
import { randEmail, newCollectiveWithHost } from '../../stores';

let collective, user, validCommentParams, validConversationParams;

before(async () => {
  user = await models.User.createUserWithCollective({ email: randEmail(), name: 'CommentTester' });
  collective = (await newCollectiveWithHost()).collective;
  validCommentParams = {
    CreatedByUserId: user.id,
    CollectiveId: collective.id,
    FromCollectiveId: user.collective.id,
    html: 'A <b>nice</b> comment',
  };
  validConversationParams = {
    CreatedByUserId: user.id,
    CollectiveId: collective.id,
    FromCollectiveId: user.collective.id,
    title: 'A valid update title',
    summary: 'A <b>valid</b> update title',
    tags: ['opensource', 'test'],
  };
});

describe('delete', () => {
  it('Deletes the conversation when the root comment gets destroyed', async () => {
    // Create a conversation thread
    const conversation = await models.Conversation.create(validConversationParams);
    const rootComment = await models.Comment.create({ ...validCommentParams, ConversationId: conversation.id });
    await conversation.update({ RootCommentId: rootComment.id });
    const comments = await Promise.all([
      models.Comment.create({ ...validCommentParams, ConversationId: conversation.id }),
      models.Comment.create({ ...validCommentParams, ConversationId: conversation.id }),
      models.Comment.create({ ...validCommentParams, ConversationId: conversation.id }),
    ]);

    // Destroy the root comment, make sure everything gets deleted
    await rootComment.destroy();

    await Promise.all(
      [conversation, rootComment, ...comments].map(async item => {
        const refreshedItem = await item.reload({ paranoid: false });
        expect(refreshedItem.deletedAt).to.exist;
      }),
    );
  });
});

describe('edit', () => {
  it('Edit the conversation summary the root comment gets edited', async () => {
    // Create a conversation thread
    const conversation = await models.Conversation.create(validConversationParams);
    const rootComment = await models.Comment.create({ ...validCommentParams, ConversationId: conversation.id });
    await conversation.update({ RootCommentId: rootComment.id });

    // Destroy the root comment, make sure everything gets deleted
    await rootComment.update({ html: 'Wow they <b>EDITED</b> me!!' });
    await conversation.reload();
    expect(conversation.summary).to.eq('Wow they <b>EDITED</b> me!!');
  });
});
