import { expect } from 'chai';
import models from '../../../server/models';
import { randEmail, newCollectiveWithHost } from '../../stores';
import { SequelizeValidationError } from 'sequelize';

describe('server/models/Conversation', () => {
  let collective, user, validConversationParams;

  before(async () => {
    user = await models.User.createUserWithCollective({ email: randEmail(), name: 'ConversationsTester' });
    collective = (await newCollectiveWithHost()).collective;
    validConversationParams = {
      CreatedByUserId: user.id,
      CollectiveId: collective.id,
      FromCollectiveId: user.collective.id,
      title: 'A valid update title',
      summary: 'A <b>valid</b> update title',
      tags: ['opensource', 'test'],
    };
  });

  describe('summary', () => {
    it('Must be set', () => {
      expect(models.Conversation.create({ ...validConversationParams, summary: '' })).to.be.rejectedWith(
        SequelizeValidationError,
        'Conversation.summary cannot be null',
      );
    });

    it('Formats the given content', async () => {
      const conversation = await models.Conversation.create({
        ...validConversationParams,
        summary: `<div>
        <br/><strong>Foobar: </strong>
        <br/>
        Hello
        <ul>
          <li>World!</li>
        </ul>
        <br/>
        </div>`,
      });

      expect(conversation.summary).to.eq('<strong>Foobar: </strong> Hello World!');
    });
  });

  describe('tags', () => {
    it('cleans them', async () => {
      const conversation = await models.Conversation.create({
        ...validConversationParams,
        tags: ['  SUPER    SAFE   ', '', '          ', 'OPENSOURCE'],
      });

      expect(conversation.tags).to.have.members(['SUPER SAFE', 'OPENSOURCE']);
    });

    it('rejects tags longer than 30 characters', () => {
      expect(
        models.Conversation.create({
          ...validConversationParams,
          tags: ['TOOOOOOOOOOOOOOOOOOOOO LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONG'],
        }),
      ).to.be.rejectedWith(
        SequelizeValidationError,
        'Validation error: Tag TOOOOOOOOOOOOOOOOOOOOO LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONG is too long, must me shorter than 32 characters',
      );
    });

    it('normalizes to uppercase', async () => {
      const conversation = await models.Conversation.create({ ...validConversationParams, tags: ['changeCase'] });
      expect(conversation.tags).to.have.members(['CHANGECASE']);
    });

    it('de-deplucates', async () => {
      const conversation = await models.Conversation.create({
        ...validConversationParams,
        tags: ['I', 'repeat', 'Repeat', 'MYSELF'],
      });

      expect(conversation.tags.length).to.eq(3);
      expect(conversation.tags).to.have.members(['I', 'REPEAT', 'MYSELF']);
    });
  });
});
