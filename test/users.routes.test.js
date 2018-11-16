/**
 * Dependencies.
 */
import _ from 'lodash';
import cheerio from 'cheerio';
import app from '../server/index';
import config from 'config';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import moment from 'moment';
import * as utils from '../test/utils';
import userlib from '../server/lib/userlib';
import sinon from 'sinon';
import Bluebird from 'bluebird';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import models from '../server/models';
import mock from './mocks/clearbit';
import * as auth from '../server/lib/auth.js';

/**
 * Variables.
 */
const application = utils.data('application');
const userData = utils.data('user1');

/**
 * Tests.
 */
describe('users.routes.test.js', () => {
  let nm;

  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    userlib.memory = {};
    sandbox.stub(userlib, 'getUserData').callsFake(email => {
      return new Bluebird(resolve => {
        if (email === 'xd@noreply.com') {
          return resolve(mock.person);
        } else {
          return resolve(null);
        }
      });
    });
  });

  afterEach(() => sandbox.restore());

  beforeEach(() => utils.resetTestDB());

  // create a fake nodemailer transport
  beforeEach(() => {
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

  describe('existence', () => {
    it('returns true', done => {
      models.User.create({ email: 'john@smith.com' }).then(() => {
        request(app)
          .get(`/users/exists?email=john@smith.com&api_key=${application.api_key}`)
          .end((e, res) => {
            expect(res.body.exists).to.be.true;
            done();
          });
      });
    });

    it('returns false', done => {
      request(app)
        .get(`/users/exists?email=john2@smith.com&api_key=${application.api_key}`)
        .end((e, res) => {
          expect(res.body.exists).to.be.false;
          done();
        });
    });
  });

  /**
   * Create.
   */
  describe('#create', () => {
    it('fails if no api_key', () =>
      request(app)
        .post('/users')
        .send({
          user: userData,
        })
        .expect(400));

    it('fails if invalid api_key', () =>
      request(app)
        .post('/users')
        .send({
          api_key: '*invalid_api_key*',
          user: userData,
        })
        .expect(401));

    it('fails if no user object', () =>
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
        })
        .expect(400));

    it('succeeds even without email', done => {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: _.omit(userData, 'email'),
        })
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('firstName', userData.firstName);
          done();
        });
    });

    it('fails if bad email', done => {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: _.extend({}, userData, { email: 'abcdefg' }),
        })
        .end((e, res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('validation_failed');
          done();
        });
    });

    it('successfully create a user', done => {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: userData,
        })
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('email', userData.email.toLowerCase());
          expect(res.body).to.not.have.property('_salt');
          expect(res.body).to.not.have.property('password');
          expect(res.body).to.not.have.property('password_hash');
          done();
        });
    });

    describe('duplicate', () => {
      beforeEach(() => models.User.createUserWithCollective(userData));

      it('fails to create a user with the same email', done => {
        request(app)
          .post('/users')
          .send({
            api_key: application.api_key,
            user: _.pick(userData, 'email'),
          })
          .end((e, res) => {
            expect(res.statusCode).to.equal(400);
            expect(res.body.error.type).to.equal('validation_failed');
            done();
          });
      });
    });
  });

  describe('#update paypal email', () => {
    let user;

    beforeEach(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user = u)));

    it('should update the paypal email', done => {
      const email = 'test+paypal@email.com';
      request(app)
        .put(`/users/${user.id}/paypalemail?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          paypalEmail: email,
        })
        .end((err, res) => {
          const { body } = res;
          expect(body.paypalEmail).to.equal(email);
          done();
        });
    });

    it('fails if the user is not logged in', () => {
      const email = 'test+paypal@email.com';
      return request(app)
        .put(`/users/${user.id}/paypalemail?api_key=${application.api_key}`)
        .send({
          paypalEmail: email,
        })
        .expect(401);
    });

    it('fails if the email is not valid', () =>
      request(app)
        .put(`/users/${user.id}/paypalemail?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          paypalEmail: 'abc',
        })
        .expect(400));
  });

  /**
   * Send a new link to the user to login
   */
  describe('#sendNewTokenByEmail', () => {
    let user;

    beforeEach(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user = u)));

    it('fails if there is no email', done => {
      request(app)
        .post('/users/new_login_token')
        .send({
          api_key: application.api_key,
        })
        .expect(400, {
          error: {
            code: 400,
            fields: {
              email: 'Required field email missing',
            },
            message: 'Missing required fields',
            type: 'missing_required',
          },
        })
        .end(done);
    });

    it('fails silently if the user does not exist', done => {
      const email = 'idonotexist@void.null';

      request(app)
        .post('/users/new_login_token')
        .send({
          email,
          api_key: application.api_key,
        })
        .expect(200)
        .end(done);
    });

    it('sends an email to the user with the new token', () =>
      request(app)
        .post('/users/new_login_token')
        .send({
          email: user.email,
          api_key: application.api_key,
        })
        .expect(200)
        .then(() => {
          const options = nm.sendMail.lastCall.args[0];
          const $ = cheerio.load(options.html);
          const href = $('a').attr('href');
          expect(href).to.contain(`${config.host.website}/signin/`);
          expect(options.to).to.equal('emailbcc+user1-at-opencollective.com@opencollective.com');
        }));
  });

  /**
   * Send a new link to the user for the subscription page
   */

  describe('#refreshTokenByEmail', () => {
    let user;

    beforeEach(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user = u)));

    it('fails if there is no auth', () =>
      request(app)
        .post(`/users/refresh_login_token?api_key=${application.api_key}`)
        .expect(401));

    it('fails if the user does not exist', done => {
      const fakeUser = { id: 12312312 };
      const expiredToken = jwt.sign({ user: fakeUser }, config.keys.opencollective.jwtSecret, {
        expiresIn: 100,
        subject: fakeUser.id,
        issuer: config.host.api,
        audience: application.id,
      });

      request(app)
        .post(`/users/refresh_login_token?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401, {
          error: {
            code: 401,
            message: 'Invalid payload',
            type: 'unauthorized',
          },
        })
        .end(done);
    });

    it('sends an email with the new valid token', () => {
      const expiredToken = jwt.sign({ user }, config.keys.opencollective.jwtSecret, {
        expiresIn: -1,
        subject: user.id,
        issuer: config.host.api,
        audience: application.id,
      });

      return request(app)
        .post(`/users/refresh_login_token?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(200)
        .toPromise()
        .then(() => {
          const options = nm.sendMail.lastCall.args[0];
          const $ = cheerio.load(options.html);
          const href = $('a').attr('href');
          expect(href).to.contain(`${config.host.website}/signin/`);
          expect(options.to).to.equal('emailbcc+user1-at-opencollective.com@opencollective.com');
        });
    });
  });

  /**
   * Receive a valid token & return a brand new token
   */
  describe('#updateToken', () => {
    const updateTokenUrl = `/users/update-token?api_key=${application.api_key}`;

    it('should fail if no token is provided', async () => {
      const response = await request(app).post(updateTokenUrl);
      expect(response.statusCode).to.equal(401);
    });
    it('should fail if expired token is provided', async () => {
      // Given a user and an authentication token
      const user = await models.User.create({ email: 'test@mctesterson.com' });
      const expiredToken = user.jwt({}, -1);

      // When the endpoint is hit with an expired token
      const response = await request(app)
        .post(updateTokenUrl)
        .set('Authorization', `Bearer ${expiredToken}`);

      // Then the API rejects the request
      expect(response.statusCode).to.equal(401);
    });
    it('should validate received token', async () => {
      // Given a user and an authentication token
      const user = await models.User.create({ email: 'test@mctesterson.com' });
      const currentToken = user.jwt();

      // When the endpoint is hit with a valid token
      const response = await request(app)
        .post(updateTokenUrl)
        .set('Authorization', `Bearer ${currentToken}`);

      // Then it responds with success
      expect(response.statusCode).to.equal(200);

      // And then the response also contains a valid token
      const parsedToken = auth.verifyJwt(response.body.token);
      expect(parsedToken).to.be.exist;

      // And then the token should have a long expiration
      expect(moment(parsedToken.exp).diff(parsedToken.iat)).to.equal(auth.TOKEN_EXPIRATION_SESSION);
    });
  });
});
