import {expect} from 'chai';
import request from 'supertest';
import _ from 'lodash';
import sinon from 'sinon';
import app from '../server/index';
import originalStripeMock from './mocks/stripe';
import { appStripe } from '../server/paymentProviders/stripe/gateway';

import creditcard from '../server/paymentProviders/stripe/creditcard';
import bitcoin from '../server/paymentProviders/stripe/bitcoin';


describe('webhooks.stripe.test.js', () => {
  let sandbox;

  it('returns 200 if the event is not livemode in production', (done) => {
    const stripeMock = _.cloneDeep(originalStripeMock);
    const webhookEvent = stripeMock.webhook_payment_succeeded;

    const event = _.extend({}, webhookEvent, {
      livemode: false
    });

    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    request(app)
      .post('/webhooks/stripe')
      .send(event)
      .expect(200)
      .end((err) => {
        expect(err).to.not.exist;
        process.env.NODE_ENV = env;
        done();
      });
  });

  describe('Webhook events: ', () => {

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(creditcard, 'webhook', () => {
        return Promise.resolve();
      })
      sandbox.stub(bitcoin, 'webhook', () => {
        return Promise.resolve();
      })

    });

    afterEach(() => {
      sandbox.restore();
    })

    it('returns an error if the event does not exist', (done) => {
      const stripeMock = _.cloneDeep(originalStripeMock);

      stripeMock.event_payment_succeeded = {
        error: {
          type: 'invalid_request_error',
          message: 'No such event',
          param: 'id',
          requestId: 'req_7Y8TeQytYKcs1k'
        }
      };

      sandbox.stub(appStripe.events, "retrieve", () => Promise.resolve(stripeMock.event_payment_succeeded));

      request(app)
        .post('/webhooks/stripe')
        .send({
          id: 123
        })
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'Event not found'
          }
        })
        .end(done);
    });

    it('lets `invoice.payment_succeeded through`', (done) => {
      const stripeMock = _.cloneDeep(originalStripeMock);

      sandbox.stub(appStripe.events, "retrieve", () => Promise.resolve(stripeMock.event_payment_succeeded));
      request(app)
        .post('/webhooks/stripe')
        .send(stripeMock.webhook_payment_succeeded)
        .expect(200)
        .end(done);
    });

    it('lets `source.chargeable through`', (done) => {
      const stripeMock = _.cloneDeep(originalStripeMock);

      sandbox.stub(appStripe.events, "retrieve", () => Promise.resolve(stripeMock.event_source_chargeable));
      request(app)
        .post('/webhooks/stripe')
        .send(stripeMock.webhook_source_chargeable)
        .expect(200)
        .end(done);
    });

    it('returns an error if the event is not `invoice.payment_succeeded` or `source.chargeable`', (done) => {
      const stripeMock = _.cloneDeep(originalStripeMock);
      stripeMock.event_payment_succeeded.type = 'application_fee.created';

      sandbox.stub(appStripe.events, "retrieve", () => Promise.resolve(stripeMock.event_payment_succeeded));

      request(app)
        .post('/webhooks/stripe')
        .send(stripeMock.webhook_payment_succeeded)
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'Wrong event type received'
          }
        })
        .end(done);
    });
  });
});
