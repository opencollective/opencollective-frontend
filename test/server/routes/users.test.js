import config from 'config';
import moment from 'moment';
import nodemailer from 'nodemailer';
import request from 'supertest-as-promised';
import sinon from 'sinon';
import { expect } from 'chai';

import app from '../../../server/index';
import * as utils from '../../utils';
import models from '../../../server/models';
import * as auth from '../../../server/lib/auth.js';

/**
 * Variables.
 */
const application = utils.data('application');

/**
 * Tests.
 */
describe('server/routes/users', () => {
  let nm;

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
