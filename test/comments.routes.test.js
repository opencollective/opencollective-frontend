import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import models from '../server/models';
import activities from '../server/constants/activities';
import sinon from 'sinon';
import emailLib from '../server/lib/email';

const application = utils.data('application');

describe('comments.routes.test.js', () => {
  let host, member, user, collective, expense, sandbox;

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach('create host', () => models.User.create(utils.data('user1')).tap(u => host = u));
  beforeEach('create member', () => models.User.create(utils.data('user2')).tap(u => member = u));
  beforeEach('create user', () => models.User.create(utils.data('user3')).tap(u => user = u));

  beforeEach('create collective', () => models.Collective.create(utils.data('collective1')).tap(g => collective = g));

  beforeEach('add host to collective', () => collective.addUserWithRole(host, roles.HOST));
  beforeEach('add member to collective', () => collective.addUserWithRole(member, roles.ADMIN));
  beforeEach('create expense', () => models.Expense.create(Object.assign({}, utils.data('expense1'), { UserId: member.id, CollectiveId: collective.id, lastEditedById: member.id })).tap(e => expense = e));

  describe('#create', () => {

    it('creates a new comment for a logged in user', () => {
      return request(app)
        .post(`/collectives/${collective.id}/expenses/${expense.id}/comments?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({comment: utils.data('comments')[0] })
        .expect(200)
        .then(res => {
          const result = res.body.data;
          expect(result.comment.text).to.equal(utils.data('comments')[0].text);
          expect(result.comment.approvedAt).to.exist;
          expect(result.collective.name).to.equal(utils.data('collective1').name);
          expect(result.expense.description).to.equal(utils.data('expense1').description);
        });
    });

    it('creates a new comment and a new user, sends a confirmation email', () => {
      const spy = sandbox.spy(emailLib, 'send');
      return request(app)
        .post(`/collectives/${collective.id}/expenses/${expense.id}/comments?api_key=${application.api_key}`)
        .send({comment: utils.data('comments')[1], user: utils.data('user4') })
        .expect(200)
        .then(res => {
          const result = res.body.data;
          expect(result.comment.text).to.equal(utils.data('comments')[1].text);
          expect(result.user.email).to.equal(utils.data('user4').email);
          expect(result.expense.description).to.equal(utils.data('expense1').description);
          expect(spy.args[0][0]).to.equal('comment.approve');
          expect(spy.args[0][1]).to.equal(result.user.email);
        });
    });
  });

  it('fails to create a new comment if not logged in and no email provided', () => {
    return request(app)
      .post(`/collectives/${collective.id}/expenses/${expense.id}/comments?api_key=${application.api_key}`)
      .send({comment: utils.data('comments')[1], user: {} })
      .expect(400);
  });

  describe('#delete', () => {
    let comment;
    beforeEach(() => models.Comment.create(Object.assign({}, utils.data('comments')[0], { UserId: member.id, CollectiveId: collective.id, ExpenseId: expense.id })).tap(c => comment = c))

    it('deletes a comment if logged in as author', () => {
      return request(app)
        .delete(`/collectives/${collective.id}/expenses/${expense.id}/comments/${comment.id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${member.jwt()}`)
        .expect(200)
        .then(res => {
          expect(res.body.type).to.equal(activities.COLLECTIVE_COMMENT_DELETED);
        });
    });

    it('deletes a comment if logged in as host or admin (member)', () => {
      return request(app)
        .delete(`/collectives/${collective.id}/expenses/${expense.id}/comments/${comment.id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${host.jwt()}`)
        .expect(200)
        .then(res => {
          expect(res.body.type).to.equal(activities.COLLECTIVE_COMMENT_DELETED);
        });
    });

    it('fails if not logged in', () => {
      return request(app)
        .delete(`/collectives/${collective.id}/expenses/${expense.id}/comments/${comment.id}?api_key=${application.api_key}`)
        .expect(401);
    });

    it('fails to delete if not logged in as author or host or admin member', () => {
      return request(app)
        .delete(`/collectives/${collective.id}/expenses/${expense.id}/comments/${comment.id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(403);
    });

  });

  describe('#list', () => {
    beforeEach('create many comments', () => models.Comment.createMany(utils.data('comments'), { UserId: member.id, CollectiveId: collective.id, ExpenseId: expense.id, approvedAt: new Date }));
    beforeEach('create one non approved comment', () => models.Comment.create({ UserId: user.id, CollectiveId: collective.id, ExpenseId: expense.id, text: 'spam' }));

    it('gets the list of approved comments for a given expense', () => {
      return request(app)
        .get(`/collectives/${collective.id}/expenses/${expense.id}/comments?api_key=${application.api_key}`)
        .expect(200)
        .then(res => {
          const comments = res.body;
          expect(comments.length).to.equal(3);
        });
    });

  });
});