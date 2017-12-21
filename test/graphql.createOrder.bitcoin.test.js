import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';
import * as utils from './utils';
import { cloneDeep } from 'lodash';
import nock from 'nock';
import sinon from 'sinon';
import initNock from './graphql.createOrder.bitcoin.nock';
import emailLib from '../server/lib/email';

const orderConst = {
  "quantity": 1,
  "interval": null,
  "totalAmount": 5700,
  "paymentMethod": {
    "service": "stripe",
    "type": "bitcoin",
    "currency": "USD",
    "token":"src_1BZPBpDjPFcHOcTmJJVwR107"
  },
  "collective": {
    "id": 28
  }
};

const createOrderQuery = `
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id
      createdByUser {
        id
      }
      paymentMethod {
        id
      }
      totalAmount
      fromCollective {
        id
        slug
        name
        website
      }
      collective {
        id
        slug
        currency
      }
      subscription {
        id
        amount
        interval
        isActive
        stripeSubscriptionId
      }
      processedAt
    }
  }
  `;

describe('graphql.createOrder.bitcoin.test', () => {

  describe("using opencollective_dvl db", () => {

    let sandbox, emailSendSpy;

    beforeEach(() => {
      initNock();
      sandbox = sinon.sandbox.create();
      emailSendSpy = sandbox.spy(emailLib, 'send');
      utils.clearbitStubBeforeEach(sandbox);
    });

    afterEach(() => {
      nock.cleanAll();
      sandbox.restore();
      utils.clearbitStubAfterEach(sandbox)
    });

    beforeEach(() => utils.loadDB('opencollective_dvl'));

    it('creates an order as new user', async () => {

      const order = cloneDeep(orderConst);
      order.user = {
        firstName: "John",
        lastName: "Smith",
        email: "jsmith@email.com"
      };

      const res = await utils.graphqlQuery(createOrderQuery, { order });
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      const collective = res.data.createOrder.collective;
      
      const paymentMethod = res.data.createOrder.paymentMethod;
      expect(paymentMethod.customerId).to.not.equal('cus_BykOG8ivma78f2');

      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: collective.id, amount: order.totalAmount }
      });
      expect(transaction).to.not.exist;

      // check that email went out
      expect(emailSendSpy.callCount).to.equal(1);
      expect(emailSendSpy.firstCall.args[0]).to.equal('processing');
      expect(emailSendSpy.firstCall.args[1]).to.equal(order.user.email);
    });

    it('creates an order as logged in user', async () => {

      const order = cloneDeep(orderConst)
      const xdamman = await models.User.findById(2);

      order.fromCollective = { id: xdamman.CollectiveId };

      const res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      const collective = res.data.createOrder.collective;

      const paymentMethod = res.data.createOrder.paymentMethod;
      expect(paymentMethod.customerId).to.not.equal('cus_BykOG8ivma78f2');

      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: collective.id, amount: order.totalAmount }
      });
      expect(transaction).to.not.exist;

      // check that email went out
      expect(emailSendSpy.callCount).to.equal(1);
      expect(emailSendSpy.firstCall.args[0]).to.equal('processing');
      expect(emailSendSpy.firstCall.args[1]).to.equal(xdamman.email);

    });

    it('creates an order as a new user for a new organization', async () => {

      const order = cloneDeep(orderConst);

      order.user = {
        firstName: "John",
        lastName: "Smith",
        email: "jsmith@email.com"
      };

      order.fromCollective = {
        name: "NewCo",
        website: "newco.com"
      };


      const res = await utils.graphqlQuery(createOrderQuery, { order });
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      const orderCreated = res.data.createOrder;
      const fromCollective = orderCreated.fromCollective;

      const paymentMethod = res.data.createOrder.paymentMethod;
      expect(paymentMethod.customerId).to.not.equal('cus_BykOG8ivma78f2');

      const transaction = await models.Transaction.findOne({ where: { OrderId: orderCreated.id }});
      expect(transaction).to.not.exist;

      expect(fromCollective.website).to.equal('http://newco.com'); // api should prepend http://

      // check that email went out
      expect(emailSendSpy.callCount).to.equal(1);
      expect(emailSendSpy.firstCall.args[0]).to.equal('processing');
      expect(emailSendSpy.firstCall.args[1]).to.equal(order.user.email);
    });

    it('creates an order as a logged in user for an existing organization', async () => {

      const order = cloneDeep(orderConst);
      const duc = await models.User.findById(65);
      const newco = await models.Collective.create({
        type: 'ORGANIZATION',
        name: "newco",
        CreatedByUserId: 8 // Aseem
      });

      order.fromCollective = { id: newco.id };

      // Should fail if not an admin or member of the organization
      let res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal("You don't have sufficient permissions to create an order on behalf of the newco organization");

      await models.Member.create({
        CollectiveId: newco.id,
        MemberCollectiveId: duc.CollectiveId,
        role: 'MEMBER',
        CreatedByUserId: duc.id
      });

      res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      const orderCreated = res.data.createOrder;
      const fromCollective = orderCreated.fromCollective;
      const collective = orderCreated.collective;

      expect(fromCollective.id).to.equal(newco.id);
      const paymentMethod = res.data.createOrder.paymentMethod;
      expect(paymentMethod.customerId).to.not.equal('cus_BykOG8ivma78f2');


      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: collective.id, amount: order.totalAmount }
      });
      expect(transaction).to.not.exist;

      // check that email went out
      expect(emailSendSpy.callCount).to.equal(1);
      expect(emailSendSpy.firstCall.args[0]).to.equal('processing');
      expect(emailSendSpy.firstCall.args[1]).to.equal(duc.email);

    });
  });
});
