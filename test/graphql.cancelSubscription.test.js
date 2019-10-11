import sinon from 'sinon';
import nodemailer from 'nodemailer';
import { assert, expect } from 'chai';
import config from 'config';
import * as utils from '../test/utils';
import models from '../server/models';

const ordersData = utils.data('orders');

const cancelSubscriptionQuery = `
mutation cancelSubscription($id: Int!) {
  cancelSubscription(id: $id) {
    id
    isSubscriptionActive
  }
}
`;

describe('graphql.cancelSubscriptions.test.js', () => {
  let collective, user, user2, paymentMethod, sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => sandbox.restore());

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user = u)));

  beforeEach(() => models.User.createUserWithCollective(utils.data('user2')).tap(u => (user2 = u)));

  beforeEach(() => models.Collective.create(utils.data('collective1')).tap(g => (collective = g)));

  beforeEach(() => collective.addHost(user.collective, user));

  // create stripe account
  beforeEach(() => {
    models.ConnectedAccount.create({
      service: 'stripe',
      token: 'sktest_123',
      CollectiveId: user.CollectiveId,
    });
  });

  // Create a paymentMethod.
  beforeEach(() => models.PaymentMethod.create(utils.data('paymentMethod2')).tap(c => (paymentMethod = c)));

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  /**
   * Cancel subscription
   */
  describe('#cancel', () => {
    const subscription = utils.data('subscription1');
    let order, nm;

    // create a fake nodemailer transport
    beforeEach(() => {
      config.mailgun = config.mailgun || {};
      config.mailgun.user = 'xxxxx';
      config.mailgun.password = 'password';

      nm = nodemailer.createTransport({
        name: 'testsend',
        service: 'Mailgun',
        sendMail(data, callback) {
          callback();
        },
        logger: false,
      });
      sinon.stub(nodemailer, 'createTransport').callsFake(() => nm);
    });

    // stub the transport
    beforeEach(() => sinon.stub(nm, 'sendMail').callsFake((object, cb) => cb(null, object)));

    afterEach(() => nm.sendMail.restore());

    afterEach(() => {
      config.mailgun.user = '';
      config.mailgun.password = '';
      nodemailer.createTransport.restore();
    });

    beforeEach(() => {
      return models.Subscription.create(subscription)
        .then(sub =>
          models.Order.create({
            ...ordersData[0],
            CreatedByUserId: user.id,
            FromCollectiveId: user.CollectiveId,
            CollectiveId: collective.id,
            PaymentMethodId: paymentMethod.id,
            SubscriptionId: sub.id,
          }),
        )
        .tap(d => (order = d))
        .catch();
    });

    it('fails if if no authorization provided', async () => {
      const res = await utils.graphqlQuery(cancelSubscriptionQuery, {
        id: order.id,
      });

      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal('You need to be logged in to cancel a subscription');
    });

    it('fails if the subscription does not exist', async () => {
      const res = await utils.graphqlQuery(cancelSubscriptionQuery, { id: 2 }, user);
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal('Subscription not found');
    });

    it("fails if user isn't an admin of the collective", async () => {
      const res = await utils.graphqlQuery(cancelSubscriptionQuery, { id: order.id }, user2);

      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal("You don't have permission to cancel this subscription");
    });

    it('fails if the subscription is already canceled', async () => {
      const order2 = await models.Subscription.create(
        Object.assign({}, subscription, {
          isActive: false,
          deactivatedAt: new Date(),
        }),
      ).then(sub =>
        models.Order.create({
          ...ordersData[0],
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          CollectiveId: collective.id,
          PaymentMethodId: paymentMethod.id,
          SubscriptionId: sub.id,
          status: 'CANCELLED',
        }),
      );

      const res = await utils.graphqlQuery(cancelSubscriptionQuery, { id: order2.id }, user);

      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal('Subscription already canceled');
    });

    it('succeeds in canceling the subscription', async () => {
      const res = await utils.graphqlQuery(cancelSubscriptionQuery, { id: order.id }, user);

      expect(res.errors).to.not.exist;

      const orders = await models.Order.findAll({
        include: [{ model: models.Subscription }],
      });

      // check that subscription is updated in database
      expect(orders[0].Subscription.isActive).to.equal(false);
      expect(orders[0].Subscription.deactivatedAt).to.not.equal(null);
      expect(orders[0].status).to.equal('CANCELLED');

      // check that activity is created
      const activity = await models.Activity.findOne({
        where: { type: 'subscription.canceled' },
      });

      assert.isDefined(activity);

      expect(activity.CollectiveId).to.be.equal(collective.id);
      expect(activity.UserId).to.be.equal(user.id);
      expect(activity.data.subscription.id).to.be.equal(order.SubscriptionId);
      expect(activity.data.collective.id).to.be.equal(collective.id);
      expect(activity.data.user.id).to.be.equal(user.id);

      // confirm that email went out
      const { subject, html, cc } = nm.sendMail.lastCall.args[0];

      expect(subject).to.contain('Subscription canceled to Scouts');
      expect(html).to.contain('month has been canceled');
      expect(cc).to.equal(`info@${collective.slug}.opencollective.com`);
    });
  });
});
