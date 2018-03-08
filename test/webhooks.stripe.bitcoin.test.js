import {expect} from 'chai';
import Promise from 'bluebird';
import _ from 'lodash';
import sinon from 'sinon';
import app from '../server/index';
import activities from '../server/constants/activities';
import roles from '../server/constants/roles';
import * as utils from '../test/utils';
import models from '../server/models';
import originalStripeMock from './mocks/stripe';
import emailLib from '../server/lib/email';
import { appStripe } from '../server/paymentProviders/stripe/gateway';
import bitcoin from '../server/paymentProviders/stripe/bitcoin';
const userData = utils.data('user1');
const collectiveData = utils.data('collective1');

describe('webhooks.stripe.bitcoin.test.js', () => {

  const webhookEvent = originalStripeMock.webhook_source_chargeable;
  const fetchedEvent = originalStripeMock.event_source_chargeable;

  describe('Unknown source', () => {
    it('sends a 200 if source not found and non-production', () => {
      const e = _.cloneDeep(fetchedEvent);

      e.data.object.id = 'abc';

      return bitcoin.webhook(webhookEvent, e)
        .then(result => {
          expect(result).to.not.exist;
        })
        .catch(err => {
          expect(err).to.not.exist;
        })
    })

    it('sends a 400 if source not found and in proudctin', () => {
      const e = _.cloneDeep(fetchedEvent);

      e.data.object.id = 'abc';
      const env = app.get('env');
      process.env.NODE_ENV = 'production';
      console.log(process.env.NODE_ENV)

      return bitcoin.webhook(webhookEvent, e)
        .then(res => {
          process.env.NODE_ENV = env;
          expect(res).to.not.exist;
        })
        .catch(err => {
          process.env.NODE_ENV = env;
          expect(err.message).to.equal('Source not found');
        }); 

    })
  })

  describe('Known source', () => {

    let sandbox, stripeMock, user, host, collective, emailSendSpy

    const hostStripeAccount = {
      service: 'stripe',
      token: 'sk_test_XOFJ9lGbErcK5akcfdYM1D7j',
      username: 'acct_198T7jD8MNtzsDcg'
    };

    beforeEach(() => utils.resetTestDB());

    beforeEach(() => {
      // initNock();
      stripeMock = _.cloneDeep(originalStripeMock);
      sandbox = sinon.sandbox.create();
      sandbox.stub(appStripe.charges, "create", () => Promise.resolve(stripeMock.charges.succeeded));
      sandbox.stub(appStripe.balance, "retrieveTransaction", () => Promise.resolve(stripeMock.bitcoin.balanceTransaction));
      emailSendSpy = sandbox.spy(emailLib, 'send');
    });

    beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

    beforeEach(() => models.User.createUserWithCollective(userData).tap(u => user = u));
    beforeEach(() => models.User.createUserWithCollective({ email: 'host@opencollective.com'}).tap(u => {
      host = u;
      hostStripeAccount.CollectiveId = host.CollectiveId;
    }));

    // Create a collective.
    beforeEach('create a collective', () => models.Collective.create(collectiveData).then(c => collective = c));
    beforeEach('attach a host', () => models.Member.create({
      CreatedByUserId: host.id,
      MemberCollectiveId: host.CollectiveId,
      CollectiveId: collective.id,
      role: 'HOST'
    }));

    // create a stripe account
    beforeEach(() =>
      models.ConnectedAccount.create(hostStripeAccount));

    // now we make the order
    // Now we make the order using above beforeEach calls
    beforeEach('Make the order', () => {
      return models.Order
        .create({
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          CollectiveId: collective.id,
          totalAmount: 5000,
          currency: 'USD'
        })
        .then((order) => {
          order.currency
          return order.setPaymentMethod({ 
            token: 'src_1BaqqSDjPFcHOcTm4RAZ6yTY',
            type: 'bitcoin',
            service: 'stripe',
            customerId: 'cust_xxxx' })
        })
    });
    afterEach(() => sandbox.restore());

    it('processes order successfully', () => {
      let order;
      return bitcoin.webhook(webhookEvent, fetchedEvent)
        .then(() => {
          // activity is created
          return models.Activity.findOne({
            type: activities.WEBHOOK_STRIPE_RECEIVED
          })
          .then(activity => {
            expect(activity.data.event).to.deep.equal(fetchedEvent)
          })

          // order is found and processed
          .then(() => models.Order.findAll({
            include: [
            {model: models.PaymentMethod, as: 'paymentMethod'},
            {model: models.User, as: 'createdByUser'}
            ]
          }))
          .then(orders => {
            expect(orders.length).to.equal(1);
            order = orders[0];
            expect(order.paymentMethod.token).to.equal(fetchedEvent.data.object.id)
            expect(order.processedAt).to.not.equal(null)
          })

          // transactions are created
          .then(() => models.Transaction.findAll())
          .then(transactions => {
            expect(transactions.length).to.equal(2);
            expect(transactions[0].OrderId).to.equal(order.id)
            expect(transactions[1].paymentProcessorFeeInHostCurrency).to.equal(-(order.totalAmount*0.008))
            // TODO: write test case for $5 cap on stripe fees
          })

          // donor added as a backer
          .then(() => models.Member.findOne({
            where: {
              CollectiveId: order.CollectiveId,
              MemberCollectiveId: order.FromCollectiveId
            }
          }))
          .then(member => {
            expect(member).to.exist;
            expect(member.role).to.equal(roles.BACKER)
          })

          // thank you email is sent
          .then(() => {
            expect(emailSendSpy.callCount).to.equal(1);
            expect(emailSendSpy.firstCall.args[0]).to.equal('thankyou')
            expect(emailSendSpy.firstCall.args[1]).to.equal(order.createdByUser.email);            
          })

          // paymentMethod is updated
          .then(() => {
            expect(order.paymentMethod.archivedAt).to.not.equal(null);
          })
        })
    })
  })
})
