import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';
import constants from '../server/constants/activities';
import models from '../server/models';
import roles from '../server/constants/roles';
import Promise from 'bluebird';
import sinon from 'sinon';
import emailLib from '../server/lib/email';

const application = utils.data('application');
const notificationData = { type: constants.COLLECTIVE_TRANSACTION_CREATED };

const { User, Collective, Notification, Tier, Order } = models;

describe('notification.model.test.js', () => {
  let host, collective, hostAdmin, sandbox, emailSendMessageSpy;

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
  });

  afterEach(() => sandbox.restore());

  beforeEach(() => {
    const promises = [
      Collective.create({ name: 'host', type: 'ORGANIZATION' }),
      Collective.create({ name: 'webpack', type: 'COLLECTIVE' }),
      User.createUserWithCollective({
        name: 'host admin',
        email: 'admin@host.com',
      }),
    ];
    return Promise.all(promises).then(results => {
      host = results[0];
      collective = results[1];
      hostAdmin = results[2];
      return Promise.all([collective.addHost(host), host.addUserWithRole(hostAdmin, 'ADMIN')]);
    });
  });

  it(`disables notification for the ${notificationData.type} email`, () =>
    request(app)
      .post(`/groups/${collective.id}/activities/${notificationData.type}/unsubscribe`)
      .set('Authorization', `Bearer ${hostAdmin.jwt()}`)
      .send({ api_key: application.api_key })
      .expect(200)
      .then(() =>
        Notification.findAndCountAll({
          where: {
            UserId: hostAdmin.id,
            CollectiveId: collective.id,
            type: notificationData.type,
            active: true,
          },
        }),
      )
      .tap(res => expect(res.count).to.equal(0)));

  describe('getSubscribers', () => {
    let users;
    beforeEach(() =>
      Promise.map([utils.data('user3'), utils.data('user4')], user => models.User.createUserWithCollective(user)).then(
        result => (users = result),
      ),
    );

    it('getSubscribers to the backers mailinglist', async () => {
      await Promise.map(users, user => collective.addUserWithRole(user, 'BACKER'));
      const subscribers = await Notification.getSubscribersUsers(collective.slug, 'backers');
      expect(subscribers.length).to.equal(2);

      await subscribers[0].unsubscribe(collective.id, 'mailinglist.backers');
      const subscribers2 = await Notification.getSubscribers(collective.slug, 'backers');
      expect(subscribers2.length).to.equal(1);
    });

    it('getSubscribers to an event', async () => {
      const eventData = utils.data('event1');
      const tierData = utils.data('tier1');
      const event = await Collective.create({
        ...eventData,
        ParentCollectiveId: collective.id,
      });
      const tier = Tier.create({
        ...tierData,
        CollectiveId: event.id,
      });
      await Promise.map(users, user => {
        return Order.create({
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          CollectiveId: collective.id,
          TierId: tier.id,
        });
      });
      await Promise.map(users, user =>
        models.Member.create({
          CreatedByUserId: user.id,
          MemberCollectiveId: user.CollectiveId,
          CollectiveId: event.id,
          TierId: tier.id,
          role: roles.FOLLOWER,
        }),
      );

      const subscribers = await Notification.getSubscribers(event.slug, event.slug);
      expect(subscribers.length).to.equal(2);

      await users[0].unsubscribe(event.id, `mailinglist.${event.slug}`);
      const subscribers2 = await Notification.getSubscribers(event.slug, event.slug);
      expect(subscribers2.length).to.equal(1);
    });
  });

  describe('notifySubscribers', () => {
    let user, expense;
    beforeEach(async () => {
      user = await models.User.createUserWithCollective({
        name: 'Xavier',
        email: 'xavier@gmail.com',
      });
      expense = await models.Expense.create({
        lastEditedById: user.id,
        incurredAt: new Date(),
        description: 'pizza',
        UserId: user.id,
        CollectiveId: collective.id,
        amount: 10000,
        currency: 'USD',
      });

      await models.Transaction.createDoubleEntry({
        CreatedByUserId: user.id,
        ExpenseId: expense.id,
        amount: expense.amount,
        currency: expense.currency,
        type: 'DEBIT',
        CollectiveId: collective.id,
        FromCollectiveId: user.collective.id,
      });

      await expense.createActivity('collective.expense.paid');
      emailSendMessageSpy.resetHistory();
    });

    it('notifies the author of the expense and the admin of host when expense is paid', async () => {
      // host admin pays the expense
      await expense.setPaid(hostAdmin.id);
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 1);
      expect(emailSendMessageSpy.callCount).to.equal(2);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(user.email);
      expect(emailSendMessageSpy.secondCall.args[0]).to.equal(hostAdmin.email);
    });

    it("doesn't notify admin of host if unsubscribed", async () => {
      await models.Notification.create({
        CollectiveId: host.id,
        UserId: hostAdmin.id,
        type: 'collective.expense.paid.for.host',
        active: false,
        channel: 'email',
      });

      // host admin pays the expense
      await expense.setPaid(hostAdmin.id);
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0, {
        delay: 500,
      });
      expect(emailSendMessageSpy.callCount).to.equal(1);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(user.email);
    });
  });
});
