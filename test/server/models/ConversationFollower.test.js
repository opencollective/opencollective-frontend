import { expect } from 'chai';
import { SequelizeUniqueConstraintError } from 'sequelize';
import models from '../../../server/models';
import { randEmail, newCollectiveWithHost } from '../../stores';

describe('server/models/ConversationFollower', () => {
  let collective, user, conversation;

  before(async () => {
    user = await models.User.createUserWithCollective({ email: randEmail(), name: 'ConversationFollowerTester' });
    collective = (await newCollectiveWithHost()).collective;
    conversation = await models.Conversation.create({
      CreatedByUserId: user.id,
      CollectiveId: collective.id,
      FromCollectiveId: user.collective.id,
      title: 'A valid update title',
      summary: 'A <b>valid</b> update title',
    });
  });

  it('Cannot have two followers for the same user/conversation pair', async () => {
    const follower = await models.ConversationFollower.create({ UserId: user.id, ConversationId: conversation.id });
    expect(follower).to.exist;
    expect(models.ConversationFollower.create({ UserId: user.id, ConversationId: conversation.id })).to.be.rejectedWith(
      SequelizeUniqueConstraintError,
    );
  });
});

describe('Follow/Unfollow', () => {
  let collective, user, conversation;

  before(async () => {
    user = await models.User.createUserWithCollective({ email: randEmail(), name: 'ConversationFollowerTester' });
    collective = (await newCollectiveWithHost()).collective;
    conversation = await models.Conversation.create({
      CreatedByUserId: user.id,
      CollectiveId: collective.id,
      FromCollectiveId: user.collective.id,
      title: 'A valid update title',
      summary: 'A <b>valid</b> update title',
    });
  });

  it('Default to not following', async () => {
    expect(await models.ConversationFollower.isFollowing(user.id, conversation.id)).to.eq(false);
  });

  it('Follow', async () => {
    const following = await models.ConversationFollower.follow(user.id, conversation.id);
    expect(following).to.exist;
    expect(following.isActive).to.eq(true);
    expect(following.UserId).to.eq(user.id);
    expect(following.ConversationId).to.eq(conversation.id);
    expect(await models.ConversationFollower.isFollowing(user.id, conversation.id)).to.eq(true);
  });

  it('Unfollow', async () => {
    await models.ConversationFollower.unfollow(user.id, conversation.id);
    expect(await models.ConversationFollower.isFollowing(user.id, conversation.id)).to.eq(false);
  });
});
