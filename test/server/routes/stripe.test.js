import async from 'async';
import config from 'config';
import nock from 'nock';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { expect } from 'chai';

import * as utils from '../../utils';
import app from '../../../server/index';
import models from '../../../server/models';
import roles from '../../../server/constants/roles';

const application = utils.data('application');

describe('stripe.routes.test.js', () => {
  let host, user, collective;

  beforeEach(() => utils.resetTestDB());

  beforeEach('create a host', () => models.User.createUserWithCollective(utils.data('host1')).tap(u => (host = u)));
  beforeEach('create a user', () => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user = u)));
  beforeEach('create a collective', () =>
    models.Collective.create(utils.data('collective1')).tap(c => (collective = c)),
  );
  beforeEach('add host', () => collective.addHost(host.collective, host));
  beforeEach('add backer', () => collective.addUserWithRole(user, roles.BACKER));

  afterEach(() => {
    nock.cleanAll();
  });

  describe('authorize', () => {
    it('should return an error if the user is not logged in', done => {
      request(app)
        .get('/connected-accounts/stripe/oauthUrl?api_key=${application.api_key}')
        .expect(401)
        .end(done);
    });

    it('should fail if not logged in as an admin of the collective', done => {
      models.ConnectedAccount.create({
        service: 'stripe',
        CollectiveId: collective.id,
      }).then(() =>
        request(app)
          .get(`/connected-accounts/stripe/oauthUrl?api_key=${application.api_key}&CollectiveId=${collective.id}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .then(response => {
            const error = response.body.error;
            expect(error.code).to.equal(401);
            expect(error.type).to.equal('unauthorized');
            expect(error.message).to.equal('Please login as an admin of this collective to add a connected account');
            done();
          }),
      );
    });

    it('should redirect to stripe', done => {
      request(app)
        .get(`/connected-accounts/stripe/oauthUrl?api_key=${application.api_key}&CollectiveId=${collective.id}`)
        .set('Authorization', `Bearer ${host.jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.redirectUrl).to.contain('https://connect.stripe.com/oauth/authorize');
          expect(res.body.redirectUrl).to.contain('&state=');
          done();
        });
    });
  });

  describe('callback', () => {
    const stripeResponse = {
      access_token: 'sk_test_123',
      refresh_token: 'rt_123',
      token_type: 'bearer',
      stripe_publishable_key: 'pk_test_123',
      stripe_user_id: 'acct_123',
      scope: 'read_write',
    };

    const stripeResponseAccountInfo = {
      id: 'acct_198T7jD8MNtzsDcg',
      object: 'account',
      business_logo:
        'https://s3.amazonaws.com/stripe-uploads/acct_198T7jD8MNtzsDcgmerchant-icon-1496926780969-BrusselsTogetherHashLogo.png',
      business_name: '#BrusselsTogether',
      business_primary_color: '#fefeff',
      business_url: 'https://brusselstogether.org',
      charges_enabled: true,
      country: 'BE',
      currencies_supported: ['usd', 'eur', 'afn', 'all'],
      default_currency: 'eur',
      details_submitted: true,
      display_name: 'brusselstogether.org',
      email: 'whateveremail@gmail.com',
      managed: false,
      metadata: {},
      statement_descriptor: 'BRUSSELSTOGETHER.ORG',
      support_address: {
        city: null,
        country: 'BE',
        line1: null,
        line2: null,
        postal_code: null,
        state: null,
      },
      support_email: 'info@brusselstogether.org',
      support_phone: '+3200000000',
      support_url: '',
      timezone: 'Europe/Madrid',
      transfers_enabled: true,
      type: 'standard',
    };

    beforeEach(() => {
      nock('https://connect.stripe.com:443')
        .post('/oauth/token', {
          grant_type: 'authorization_code',
          client_id: config.stripe.clientId,
          client_secret: config.stripe.secret,
          code: 'abc',
        })
        .reply(200, () => stripeResponse);

      nock('https://api.stripe.com:443')
        .get('/v1/accounts/acct_123')
        .reply(200, () => stripeResponseAccountInfo);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should fail if the state is empty', done => {
      request(app)
        .get(`/connected-accounts/stripe/callback?api_key=${application.api_key}`)
        .expect(400)
        .end(done);
    });

    it('should fail if the state is not a valid JWT', done => {
      request(app)
        .get(`/connected-accounts/stripe/callback?api_key=${application.api_key}&state=123412312`)
        .expect(400)
        .end((err, res) => {
          expect(err).not.to.exist;
          expect(res.body.error.code).to.be.equal(400);
          expect(res.body.error.type).to.be.equal('bad_request');
          expect(res.body.error.message).to.contain('Invalid JWT');
          done();
        });
    });

    it('should set a stripeAccount', done => {
      const encodedJWT = jwt.sign(
        {
          CollectiveId: collective.id,
          CreatedByUserId: collective.CreatedByUserId,
        },
        config.keys.opencollective.jwtSecret,
        { expiresIn: '1h' },
      );
      async.auto(
        {
          request: cb => {
            request(app)
              .get(`/connected-accounts/stripe/callback?state=${encodedJWT}&code=abc&api_key=${application.api_key}`)
              .expect(302)
              .end(() => cb());
          },

          // This is veriyfing that a a connected account was properly created
          // and that the data in the database match Stripe's mocked data
          checkStripeAccount: [
            'request',
            (_, cb) => {
              return models.ConnectedAccount.findAndCountAll({})
                .then(res => {
                  expect(res.count).to.be.equal(1);
                  const account = res.rows[0];
                  expect(account).to.have.property('token', stripeResponse.access_token);
                  expect(account).to.have.property('refreshToken', stripeResponse.refresh_token);
                  expect(account).to.have.property('username', stripeResponse.stripe_user_id);
                  expect(account.data).to.have.property('tokenType', stripeResponse.token_type);
                  expect(account.data).to.have.property('publishableKey', stripeResponse.stripe_publishable_key);
                  expect(account.data).to.have.property('scope', stripeResponse.scope);
                  expect(account.data).to.have.property('account');
                  expect(account.data.account.default_currency).to.equal('eur');
                  cb(null, account);
                })
                .catch(cb);
            },
          ],

          // This is veriyfing that currency and timezone are updated
          // according to what can be found in Stripe's mocked data
          // the function doing that is in paymentProviders/stripe/index.js -> updateHost
          checkHost: [
            'checkStripeAccount',
            (results, cb) => {
              return models.Collective.findByPk(results.checkStripeAccount.CollectiveId)
                .then(collective => {
                  expect(collective.id).to.be.equal(collective.id);
                  expect(collective.currency).to.equal('EUR');
                  expect(collective.timezone).to.equal('Europe/Madrid');
                  cb();
                })
                .catch(cb);
            },
          ],

          // This is veriyfing that after connecting the Stripe's account
          // the opencollective paymentmethod is set to EUR, not USD (like the host)
          // but nowhere in the code base such behavior is found, DISABLING

          /*
          checkPaymentMethod: [
            'checkStripeAccount',
            (results, cb) => {
              return models.PaymentMethod.findOne({
                where: {
                  CollectiveId: results.checkStripeAccount.CollectiveId,
                },
              })
                .then(pm => {
                  expect(pm.service).to.equal('opencollective');
                  expect(pm.currency).to.equal('EUR');
                  cb();
                })
                .catch(cb);
            },
          ],
          */
        },
        done,
      );
    });
  });
});
