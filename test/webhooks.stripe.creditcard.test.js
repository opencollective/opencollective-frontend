import _ from 'lodash';
import request from 'supertest';
import sinon from 'sinon';

import app from '../server/index';
import originalStripeMock from './mocks/stripe';
import { appStripe } from '../server/paymentProviders/stripe/gateway';

describe('webhooks.stripe.creditcard.test.js', () => {
  describe('when it receives a subscription that does not match with our plan', () => {
    let sandbox;

    beforeEach(() => {
      const stripeMock = _.cloneDeep(originalStripeMock);
      stripeMock.webhook_payment_succeeded.data.object.lines.data[0].plan.id = 'some-foreign-plan-type';

      sandbox = sinon.createSandbox();
      sandbox.stub(appStripe.events, 'retrieve').callsFake(() => Promise.resolve(stripeMock.webhook_payment_succeeded));
    });

    afterEach(() => sandbox.restore());

    it('Should just return 200 and dont really do anything', async () => {
      await request(app)
        .post('/webhooks/stripe')
        .send({ data: 'webhookPayload' })
        .expect(200);
    });
  });

  describe('when it receives a subscription', () => {
    let sandbox;

    beforeEach(() => {
      const stripeMock = _.cloneDeep(originalStripeMock);
      sandbox = sinon.createSandbox();
      sandbox.stub(appStripe.events, 'retrieve').callsFake(() => Promise.resolve(stripeMock.webhook_payment_succeeded));
    });

    afterEach(() => sandbox.restore());

    it('Should error out', async () => {
      await request(app)
        .post('/webhooks/stripe')
        .send({ data: 'webhookPayload' })
        .expect(400);
    });
  });
});
