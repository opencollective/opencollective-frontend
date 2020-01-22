import { expect } from 'chai';
import request from 'supertest';
import _ from 'lodash';
import sinon from 'sinon';
import app from '../../../server/index';
import originalStripeMock from '../../mocks/stripe';
import stripe from '../../../server/lib/stripe';

describe('server/routes/webhooks.stripe', () => {
  let sandbox;

  it('returns 200 if the event is not livemode in production', done => {
    const stripeMock = _.cloneDeep(originalStripeMock);
    const webhookEvent = stripeMock.webhook_source_chargeable;

    const event = _.extend({}, webhookEvent, {
      livemode: false,
    });

    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    request(app)
      .post('/webhooks/stripe')
      .send(event)
      .expect(200)
      .end(err => {
        expect(err).to.not.exist;
        process.env.NODE_ENV = env;
        done();
      });
  });

  describe('Webhook events: ', () => {
    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('returns an error if the event does not exist', done => {
      const stripeMock = _.cloneDeep(originalStripeMock);

      stripeMock.event_payment_succeeded = {
        error: {
          type: 'invalid_request_error',
          message: 'No such event',
          param: 'id',
          requestId: 'req_7Y8TeQytYKcs1k',
        },
      };

      sandbox.stub(stripe.events, 'retrieve').callsFake(() => Promise.resolve(stripeMock.event_payment_succeeded));

      request(app)
        .post('/webhooks/stripe')
        .send({
          id: 123,
        })
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'Event not found',
          },
        })
        .end(done);
    });

    it('error out on `source.chargeable`', done => {
      const stripeMock = _.cloneDeep(originalStripeMock);

      sandbox.stub(stripe.events, 'retrieve').callsFake(() => Promise.resolve(stripeMock.event_source_chargeable));
      request(app)
        .post('/webhooks/stripe')
        .send(stripeMock.webhook_source_chargeable)
        .expect(400)
        .end(done);
    });

    it('returns an error if the event is `source.chargeable`', done => {
      const stripeMock = _.cloneDeep(originalStripeMock);
      stripeMock.event_source_chargeable.type = 'application_fee.created';

      sandbox.stub(stripe.events, 'retrieve').callsFake(() => Promise.resolve(stripeMock.event_source_chargeable));

      request(app)
        .post('/webhooks/stripe')
        .send(stripeMock.webhook_payment_succeeded)
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'Wrong event type received',
          },
        })
        .end(done);
    });
  });
});
