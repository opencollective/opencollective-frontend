import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';

import * as utils from './utils';
import models from '../server/models';
import roles from '../server/constants/roles';
import emailLib from '../server/lib/email';
import twitterLib from '../server/lib/twitter';

let host, user1, user2, collective1, event1, update1;
let sandbox, sendEmailSpy, sendTweetSpy;

describe('graphql.updates.test', () => {
  /* SETUP
     - collective1: host, user1 as admin
       - event1: user1 as admin
     - user2
  */

  before(() => {
    sandbox = sinon.createSandbox();
    sendEmailSpy = sandbox.spy(emailLib, 'sendMessage');
    sendTweetSpy = sandbox.spy(twitterLib, 'tweetStatus');
  });

  after(() => sandbox.restore());

  before(() => utils.resetTestDB());

  before(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user1 = u)));
  before(() => models.User.createUserWithCollective(utils.data('host1')).tap(u => (host = u)));

  before(() => models.User.createUserWithCollective(utils.data('user2')).tap(u => (user2 = u)));
  before(() => models.Collective.create(utils.data('collective1')).tap(g => (collective1 = g)));
  before(() => collective1.addUserWithRole(host, roles.HOST));
  before(() => collective1.addUserWithRole(user1, roles.ADMIN));

  before(() => {
    return models.Update.create({
      CollectiveId: collective1.id,
      FromCollectiveId: user1.CollectiveId,
      CreatedByUserId: user1.id,
      title: 'first update & "love"',
      html: 'long text for the update #1 <a href="https://google.com">here is a link</a>',
    }).then(u => (update1 = u));
  });

  before('create an event collective', () =>
    models.Collective.create(
      Object.assign(utils.data('event1'), {
        CreatedByUserId: user1.id,
        ParentCollectiveId: collective1.id,
      }),
    ).tap(e => (event1 = e)),
  );
  before(() => event1.addUserWithRole(user1, roles.ADMIN));

  let update;
  before(() => {
    update = {
      title: 'Monthly update 2',
      html: 'This is the update',
      collective: {
        id: collective1.id,
      },
    };
  });

  describe('create an update', () => {
    const createUpdateQuery = `
    mutation createUpdate($update: UpdateInputType!) {
      createUpdate(update: $update) {
        id
        slug
        publishedAt
      }
    }
    `;

    it('fails if not authenticated', async () => {
      const result = await utils.graphqlQuery(createUpdateQuery, { update });
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].message).to.equal('You must be logged in to create an update');
    });

    it('fails if authenticated but cannot edit collective', async () => {
      const result = await utils.graphqlQuery(createUpdateQuery, { update }, user2);
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].message).to.equal("You don't have sufficient permissions to create an update");
    });

    it('creates an update', async () => {
      const result = await utils.graphqlQuery(createUpdateQuery, { update }, user1);
      result.errors && console.error(result.errors[0]);
      const createdUpdate = result.data.createUpdate;
      expect(createdUpdate.slug).to.equal('monthly-update-2');
      expect(createdUpdate.publishedAt).to.be.null;
    });
  });

  describe('publish an update', () => {
    const publishUpdateQuery = `
    mutation publishUpdate($id: Int!) {
      publishUpdate(id: $id) {
        id
        slug
        publishedAt
      }
    }
    `;

    it('fails if not authenticated', async () => {
      const result = await utils.graphqlQuery(publishUpdateQuery, {
        id: update1.id,
      });
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('You must be logged in to publish this update');
    });

    it('fails if not authenticated as admin of collective', async () => {
      const result = await utils.graphqlQuery(publishUpdateQuery, { id: update1.id }, user2);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal("You don't have sufficient permissions to publish this update");
    });

    describe('publishes an update', async () => {
      let result, user3;

      before(async () => {
        await collective1.addUserWithRole(user2, roles.BACKER);
        user3 = await models.User.createUserWithCollective(utils.data('user3'));
        const org = await models.Collective.create({
          name: 'facebook',
          type: 'ORGANIZATION',
        });
        org.addUserWithRole(user3, roles.ADMIN);
        await models.Member.create({
          CollectiveId: collective1.id,
          MemberCollectiveId: org.id,
          role: roles.BACKER,
          CreatedByUserId: user1.id,
        });
        await models.ConnectedAccount.create({
          CollectiveId: collective1.id,
          service: 'twitter',
          settings: { updatePublished: { active: true } },
        });
        result = await utils.graphqlQuery(publishUpdateQuery, { id: update1.id }, user1);
      });

      beforeEach(() => {
        sendEmailSpy.resetHistory();
      });

      it('published the update successfully', async () => {
        expect(result.errors).to.not.exist;
        expect(result.data.publishUpdate.slug).to.equal('first-update-and-love');
        expect(result.data.publishUpdate.publishedAt).to.not.be.null;
      });

      it('sends the update to all users including admins of sponsor org', async () => {
        await utils.waitForCondition(() => sendEmailSpy.callCount > 1);
        expect(sendEmailSpy.callCount).to.equal(3);
        expect(sendEmailSpy.args[0][0]).to.equal(user1.email);
        expect(sendEmailSpy.args[0][1]).to.equal('first update & "love"');
        expect(sendEmailSpy.args[1][0]).to.equal(user2.email);
        expect(sendEmailSpy.args[1][1]).to.equal('first update & "love"');
        expect(sendEmailSpy.args[2][0]).to.equal(user3.email);
        expect(sendEmailSpy.args[2][1]).to.equal('first update & "love"');
      });

      it('sends a tweet', async () => {
        expect(sendTweetSpy.callCount).to.equal(1);
        expect(sendTweetSpy.firstCall.args[1]).to.equal('Latest update from the collective: first update & "love"');
        expect(sendTweetSpy.firstCall.args[2]).to.contain('/scouts/updates/first-update-and-love');
      });
    });

    it('unpublishes an update successfully', async () => {
      await models.Update.update({ publishedAt: new Date() }, { where: { id: update1.id } });
      const result = await utils.graphqlQuery(
        publishUpdateQuery.replace(/publish\(/g, 'unpublish('),
        { id: update1.id },
        user1,
      );
      expect(result.errors).to.not.exist;
      expect(result.data.publishUpdate.slug).to.equal('first-update-and-love');
      expect(result.data.publishUpdate.publishedAt).to.not.be.null;
      await models.Update.update({ publishedAt: null }, { where: { id: update1.id } });
    });
  });

  describe('edit an update', () => {
    const editUpdateQuery = `
    mutation editUpdate($update: UpdateAttributesInputType!) {
      editUpdate(update: $update) {
        id
        slug
        publishedAt
      }
    }
    `;

    it('fails if not authenticated', async () => {
      const result = await utils.graphqlQuery(editUpdateQuery, {
        update: { id: update1.id },
      });
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('You must be logged in to edit this update');
    });

    it('fails if not authenticated as admin of collective', async () => {
      const result = await utils.graphqlQuery(editUpdateQuery, { update: { id: update1.id } }, user2);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal("You don't have sufficient permissions to edit this update");
    });

    it('edits an update successfully and changes the slug if not published', async () => {
      await models.Update.update({ publishedAt: null }, { where: { id: update1.id } });
      const result = await utils.graphqlQuery(
        editUpdateQuery,
        { update: { id: update1.id, title: 'new title' } },
        user1,
      );
      expect(result.errors).to.not.exist;
      expect(result.data.editUpdate.slug).to.equal('new-title');
    });

    it("edits an update successfully and doesn't change the slug if published", async () => {
      await models.Update.update(
        { slug: 'first-update-and-love', publishedAt: new Date() },
        { where: { id: update1.id } },
      );
      const result = await utils.graphqlQuery(
        editUpdateQuery,
        { update: { id: update1.id, title: 'new title' } },
        user1,
      );
      expect(result.errors).to.not.exist;
      expect(result.data.editUpdate.slug).to.equal('first-update-and-love');
      await models.Update.update({ publishedAt: null }, { where: { id: update1.id } });
    });

    it('fails if update title is not set', async () => {
      const result = await utils.graphqlQuery(editUpdateQuery, { update: { id: update1.id, title: '' } }, user1);
      expect(result.errors[0].message).to.equal('Validation error: Validation len on title failed');
    });
  });
  describe('delete Update', () => {
    const deleteUpdateQuery = `
      mutation deleteUpdate($id: Int!) {
        deleteUpdate(id: $id) {
          id,
          slug
        }
      }`;

    it('fails to delete an update if not logged in', async () => {
      const result = await utils.graphqlQuery(deleteUpdateQuery, {
        id: update1.id,
      });
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('You must be logged in to delete this update');
      return models.Update.findByPk(update1.id).then(updateFound => {
        expect(updateFound).to.not.be.null;
      });
    });

    it('fails to delete an update if logged in as another user', async () => {
      const result = await utils.graphqlQuery(deleteUpdateQuery, { id: update1.id }, user2);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal("You don't have sufficient permissions to delete this update");
      return models.Update.findByPk(update1.id).then(updateFound => {
        expect(updateFound).to.not.be.null;
      });
    });

    it('deletes an update', async () => {
      const res = await utils.graphqlQuery(deleteUpdateQuery, { id: update1.id }, user1);
      res.errors && console.error(res.errors[0]);
      expect(res.errors).to.not.exist;
      return models.Update.findByPk(update1.id).then(updateFound => {
        expect(updateFound).to.be.null;
      });
    });
  });

  describe('query updates', () => {
    const allUpdatesQuery = `
    query allUpdates($CollectiveId: Int!, $limit: Int, $offset: Int) {
      allUpdates(CollectiveId: $CollectiveId, limit: $limit, offset: $offset) {
        id
        slug
        title
        publishedAt
      }
    }
    `;

    before(() => {
      return models.Update.destroy({ where: {}, truncate: true }).then(() =>
        models.Update.createMany(
          [
            {
              title: 'draft update 1',
              createdAt: new Date('2018-01-11'),
              publishedAt: null,
            },
            { title: 'update 1', publishedAt: new Date('2018-01-01') },
            { title: 'update 2', publishedAt: new Date('2018-01-02') },
            { title: 'update 3', publishedAt: new Date('2018-01-03') },
            { title: 'update 4', publishedAt: new Date('2018-01-04') },
            { title: 'update 5', publishedAt: new Date('2018-01-05') },
            { title: 'update 6', publishedAt: new Date('2018-01-06') },
            { title: 'update 7', publishedAt: new Date('2018-01-07') },
            { title: 'update 8', publishedAt: new Date('2018-01-08') },
            { title: 'update 9', publishedAt: new Date('2018-01-09') },
            { title: 'update 10', publishedAt: new Date('2018-01-10') },
          ],
          { CreatedByUserId: user1.id, CollectiveId: collective1.id },
        ),
      );
    });

    it('get all the updates that are published', async () => {
      const result = await utils.graphqlQuery(allUpdatesQuery, {
        CollectiveId: collective1.id,
        limit: 5,
        offset: 2,
      });
      const updates = result.data.allUpdates;
      expect(result.errors).to.not.exist;
      expect(updates).to.have.length(5);
      expect(updates[0].slug).to.equal('update-8');
    });

    it('get all the updates that are published and unpublished if admin', async () => {
      const result = await utils.graphqlQuery(
        allUpdatesQuery,
        { CollectiveId: collective1.id, limit: 5, offset: 0 },
        user1,
      );
      const updates = result.data.allUpdates;
      expect(result.errors).to.not.exist;
      expect(updates).to.have.length(5);
      expect(updates[0].slug).to.equal('draft-update-1');
    });
  });
});
