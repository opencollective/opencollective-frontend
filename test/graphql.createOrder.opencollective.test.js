import { expect } from 'chai';

/* Support code */
import models from '../server/models';
import * as libpayments from '../server/lib/payments';

/* Test tools */
import * as utils from './utils';
import * as store from './features/support/stores';

/* What's being tested */
import giftcard from '../server/paymentProviders/opencollective/giftcard';
import prepaid from '../server/paymentProviders/opencollective/prepaid';


const createOrderQuery = `
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) { id }
  }
`;


describe('grahpql.createOrder.opencollective', () => {

  describe('prepaid', () => {

    describe('#getBalance', () => {

      before(utils.resetTestDB);

      it('should error if payment method is not a prepaid', async () => {
        expect(prepaid.getBalance({ service: 'opencollective', type: 'giftcard' }))
          .to.be.eventually.rejectedWith(Error, 'Expected opencollective.prepaid but got opencollective.giftcard');
      }); /* End of "should error if payment method is not a prepaid" */

      it('should return initial balance of payment method if nothing was spend on the card', async () => {
        const paymentMethod = await models.PaymentMethod.create({
          service: 'opencollective',
          type: 'prepaid',
          initialBalance: 10000,
          currency: 'USD',
        });
        expect(await prepaid.getBalance(paymentMethod)).to.deep.equal({
          amount: 10000,
          currency: 'USD'
        });
      }); /* End of "should return initial balance of payment method if nothing was spend on the card" */

      it('should return initial balance of payment method minus credit already spent', async () => {
        // Given a user & collective
        const { user, userCollective } = await store.newUser('new user');
        const { hostCollective, collective } = await store.newCollectiveWithHost('test', 'USD', 'USD', 0);

        // And given the following order with a payment method
        const { order } = await store.newOrder({
          from: userCollective,
          to: collective,
          amount: 2000,
          currency: 'USD',
          paymentMethodData: {
            customerId: 'new-user',
            service: 'opencollective',
            type: 'prepaid',
            initialBalance: 10000,
            currency: 'USD',
            data: { HostCollectiveId: hostCollective.id },
          }
        });

        // When the above order is executed
        await libpayments.executeOrder(user, order);

        // Then the payment method should have the initial balance
        // minus what was already spent.
        expect(await prepaid.getBalance(order.paymentMethod)).to.deep.equal({
          amount: 8000,
          currency: 'USD'
        });
      }); /* End of "should return initial balance of payment method minus credit already spent" */

    }); /* End of "#getBalance" */

    describe('#processOrder', () => {

      let user, user2, userCollective, hostCollective, collective;

      beforeEach(async () => {
        await utils.resetTestDB();
        ({ user, userCollective } = await store.newUser('new user'));
        // for some obscure reason, it doesn't work to copy paste previous line for user2
        user2 = await models.User.createUserWithCollective({ name: 'new user 2'});
        ({ hostCollective, collective } = await store.newCollectiveWithHost('test', 'USD', 'USD', 10));
      }); /* End of "beforeEach" */

      it('should fail if payment method does not have a host id', async () => {
        // Given the following order with a payment method
        const { order } = await store.newOrder({
          from: userCollective,
          to: collective,
          amount: 2000,
          currency: 'USD',
          paymentMethodData: {
            customerId: 'new-user',
            service: 'opencollective',
            type: 'prepaid',
            initialBalance: 10000,
            currency: 'USD',
          }
        });

        // When the above order is executed; Then the transaction
        // should be unsuccessful.
        await expect(libpayments.executeOrder(user, order)).to.be.eventually.rejectedWith(
          Error, 'Prepaid payment method must have a value for `data.HostCollectiveId`');
      }); /* End of "should fail if payment method does not have a host id" */

      it('should fail if payment method from someone else is used', async () => {
        const pmData = {
          CollectiveId: user2.CollectiveId,
          CreatedByUserId: user2.id,
          service: 'opencollective',
          type: 'prepaid',
          data: { HostCollectiveId: hostCollective.id },
          currency: 'USD',
          initialBalance: 10000,
        };
        const pm = await models.PaymentMethod.create(pmData);
        // store.newOrder uses Order.setPaymentMethod which should fail if the user cannot use the pm
        try {
          await store.newOrder({
            from: userCollective,
            to: collective,
            amount: 2000,
            currency: 'USD',
            paymentMethodData: {
              uuid: pm.uuid
            }
          });
        } catch (e) {
          expect(e).to.exist;
          expect(e.message).to.equal("You don't have enough permissions to use this payment method (you need to be an admin of the collective that owns this payment method)");
        }
      }); /* End of "should fail if payment method from someone else is used" */

      it('should fail if from collective and collective are from different hosts ', async () => {
        // Given the following order with a payment method
        const { order } = await store.newOrder({
          from: userCollective,
          to: collective,
          amount: 2000,
          currency: 'USD',
          paymentMethodData: {
            customerId: 'new-user',
            service: 'opencollective',
            type: 'prepaid',
            initialBalance: 10000,
            currency: 'USD',
            data: { HostCollectiveId: 2000 },
          }
        });

        // When the above order is executed; Then the transaction
        // should be unsuccessful.
        await expect(libpayments.executeOrder(user, order)).to.be.eventually.rejectedWith(
          Error, 'Prepaid method can only be used in collectives from the same host');
      }); /* End of "should fail if from collective and collective are from different hosts" */

      it('should fail to place an order if there is not enough balance', () => {
      }); /* End of "should fail to place an order if there is not enough balance" */

    }); /* End of "#processOrder" */

  }); /* End of "prepaid" */

  describe('giftcard', () => {

    describe('#getBalance', () => {

      it('should error if payment method is not a giftcard', async () => {
        expect(giftcard.getBalance({ service: 'opencollective', type: 'prepaid' }))
          .to.be.rejectedWith(Error, 'Expected opencollective.giftcard but got opencollective.prepaid');
      }); /* End of "should error if payment method is not a giftcard" */

      it('should return the monthlyLimitPerMember as amount', async () => {
        const paymentMethod = {
          monthlyLimitPerMember: 5000,
          currency: 'USD',
          service: 'opencollective',
          type: 'giftcard',
        };

        expect(await giftcard.getBalance(paymentMethod)).to.deep.equal({
          amount: 5000,
          currency: 'USD'
        });

      }); /* End of "should return the monthlyLimitPerMember as amount" */

    }); /* End of "#getBalance" */

    describe('#processOrder', async () => {

      beforeEach(utils.resetTestDB);

      let user, userCollective, collective, hostCollective, hostAdmin;

      beforeEach(async () => {
        // Given a user and an active collective
        ({ user, userCollective } = await store.newUser('user'));
        ({
          collective,
          hostCollective,
          hostAdmin,
        } = await store.newCollectiveWithHost('test', 'BRL', 'BRL', 5));
        await collective.update({ isActive: true });
      }); /* End of "beforeEach" */

      it('should error if the card does not have enough balance', async () => {
        // Given a giftcard with 30 BRL
        const [pm] = await giftcard.createGiftcards([{
          count: 1,
          expiryDate: new Date('2218-12-15 08:00:00'), // will break CI in 2218!!
        }], {
          name: 'test giftcard',
          currency: 'BRL',
          monthlyLimitPerMember: 3000,
          CollectiveId: userCollective.id,
          CreatedByUserId: hostAdmin.id,
        });

        // And given an order
        const order = {
          collective: { id: collective.id },
          fromCollective: { id: userCollective.id },
          paymentMethod: {
            service: 'opencollective',
            type: 'giftcard',
            uuid: pm.uuid,
            token: pm.token,
          },
          quantity: 1,
          totalAmount: 5000
        };

        const result = await utils.graphqlQuery(createOrderQuery, { order }, user);

        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal(
          'The total amount of this order (R$50) is higher than your monthly spending limit on this payment method (opencollective:giftcard) (R$30)');
      }); /* End of "should error if the card does not have enough balance" */

      it('should error if the card does not have enough balance', async () => {
        // Given a giftcard with 50 BRL
        const [pm] = await giftcard.createGiftcards([{
          count: 1,
          expiryDate: new Date('2218-12-15 08:00:00'), // will break CI in 2218!!
        }], {
          name: 'test giftcard',
          currency: 'BRL',
          monthlyLimitPerMember: 5000,
          CollectiveId: userCollective.id,
          data: { HostCollectiveId: hostCollective.id },
          CreatedByUserId: hostAdmin.id,
        });

        // And given an order
        const order = {
          collective: { id: collective.id },
          fromCollective: { id: userCollective.id },
          paymentMethod: {
            service: 'opencollective',
            type: 'giftcard',
            uuid: pm.uuid,
            token: pm.token,
          },
          quantity: 1,
          totalAmount: 5000
        };

        const result = await utils.graphqlQuery(createOrderQuery, { order }, user);
        result.errors && console.log(result.errors);
        expect(result.errors).to.not.exist;

        const transactions = await models.Transaction.findAll();
        expect(transactions.length).to.equal(4);

        const [tr1, tr2, tr3, tr4] = transactions;

        // Two first transactions are from host to user
        expect(tr1.FromCollectiveId).to.equal(userCollective.id);
        expect(tr1.CollectiveId).to.equal(hostCollective.id);
        expect(tr1.type).to.equal('DEBIT');
        expect(tr2.FromCollectiveId).to.equal(hostCollective.id);
        expect(tr2.CollectiveId).to.equal(userCollective.id);
        expect(tr2.type).to.equal('CREDIT');

        // Last two ones are from user to collective
        expect(tr3.FromCollectiveId).to.equal(collective.id);
        expect(tr3.CollectiveId).to.equal(userCollective.id);
        expect(tr3.type).to.equal('DEBIT');
        expect(tr4.FromCollectiveId).to.equal(userCollective.id);
        expect(tr4.CollectiveId).to.equal(collective.id);
        expect(tr4.type).to.equal('CREDIT');

        // Original payment method should be archived
        const originalPm = await models.PaymentMethod.findOne({ where: { token: pm.token } });
        expect(originalPm.archivedAt).to.not.be.null;

      }); /* End of "should error if the card does not have enough balance" */

    }); /* End of "#processOrder" */

  }); /* End of "giftcard" */

}); /* End of "grahpql.createOrder.opencollective" */
