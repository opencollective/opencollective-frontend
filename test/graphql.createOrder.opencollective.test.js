import { expect } from 'chai';

/* Support code */
import models from '../server/models';
import * as libpayments from '../server/lib/payments';

/* Test tools */
import * as utils from './utils';
import * as store from './stores';

/* What's being tested */
import prepaid from '../server/paymentProviders/opencollective/prepaid';

describe('graphql.createOrder.opencollective', () => {
  describe('prepaid', () => {
    describe('#getBalance', () => {
      before(utils.resetTestDB);

      it('should error if payment method is not a prepaid', async () => {
        expect(prepaid.getBalance({ service: 'opencollective', type: 'virtualcard' })).to.be.eventually.rejectedWith(
          Error,
          'Expected opencollective.prepaid but got opencollective.virtualcard',
        );
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
          currency: 'USD',
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
          },
        });

        // When the above order is executed
        await libpayments.executeOrder(user, order);

        // Then the payment method should have the initial balance
        // minus what was already spent.
        expect(await prepaid.getBalance(order.paymentMethod)).to.deep.equal({
          amount: 8000,
          currency: 'USD',
        });
      }); /* End of "should return initial balance of payment method minus credit already spent" */
    }); /* End of "#getBalance" */

    describe('#processOrder', () => {
      let user, user2, userCollective, hostCollective, collective;

      beforeEach(async () => {
        await utils.resetTestDB();
        ({ user, userCollective } = await store.newUser('new user'));
        // for some obscure reason, it doesn't work to copy paste previous line for user2
        user2 = await models.User.createUserWithCollective({ email: store.randEmail(), name: 'new user 2' });
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
          },
        });

        // When the above order is executed; Then the transaction
        // should be unsuccessful.
        await expect(libpayments.executeOrder(user, order)).to.be.eventually.rejectedWith(
          Error,
          'Prepaid payment method must have a value for `data.HostCollectiveId`',
        );
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
              uuid: pm.uuid,
            },
          });
        } catch (e) {
          expect(e).to.exist;
          expect(e.message).to.equal(
            "You don't have enough permissions to use this payment method (you need to be an admin of the collective that owns this payment method)",
          );
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
          },
        });

        // When the above order is executed; Then the transaction
        // should be unsuccessful.
        await expect(libpayments.executeOrder(user, order)).to.be.eventually.rejectedWith(
          Error,
          'Prepaid method can only be used in collectives from the same host',
        );
      }); /* End of "should fail if from collective and collective are from different hosts" */

      it('should fail to place an order if there is not enough balance', () => {
        // not implemented
      }); /* End of "should fail to place an order if there is not enough balance" */
    }); /* End of "#processOrder" */
  }); /* End of "prepaid" */
}); /* End of "grahpql.createOrder.opencollective" */
