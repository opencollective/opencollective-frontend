import app from '../server/index';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import * as utils from '../test/utils';
import models from '../server/models';

const userData = utils.data('user1');

describe('auth.routes.test.js', () => {

  let application;

  beforeEach(() => utils.cleanAllDb().tap(a => application = a));

  beforeEach(() => models.User.create(userData));

  describe('#authenticate', () => {

    it('fails authenticate if no password', (done) => {
      request(app)
        .post('/authenticate')
        .send({
          api_key: application.api_key,
          username: userData.username
        })
        .expect(400)
        .end(e => {
          expect(e).to.not.exist;
          done();
        });
    });

    it('fails authenticate if bad application', (done) => {
      request(app)
        .post('/authenticate')
        .send({
          api_key: 'bla',
          username: userData.username,
          password: userData.password
        })
        .expect(401)
        .end(e => {
          expect(e).to.not.exist;
          done();
        });
    });

    it('fails authenticate if bad password', (done) => {
      request(app)
        .post('/authenticate')
        .send({
          api_key: application.api_key,
          username: userData.username,
          password: 'bad'
        })
        .expect(400)
        .end(e => {
          expect(e).to.not.exist;
          done();
        });
    });

    it('successfully authenticate with username', (done) => {
      request(app)
        .post('/authenticate')
        .send({
          api_key: application.api_key,
          username: userData.username,
          password: userData.password
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('access_token');
          expect(res.body).to.have.property('refresh_token');
          const data = jwt.decode(res.body.access_token);
          expect(data).to.have.property('iat');
          expect(data).to.have.property('exp');
          expect(data).to.have.property('aud');
          expect(data).to.have.property('iss');
          expect(data).to.have.property('sub');
          done();
        });
    });

    it('successfully authenticate with email (case insensitive)', (done) => {
      request(app)
        .post('/authenticate')
        .send({
          api_key: application.api_key,
          email: userData.email.toUpperCase(),
          password: userData.password
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('access_token');
          expect(res.body).to.have.property('refresh_token');
          done();
        });
    });

  });

});
