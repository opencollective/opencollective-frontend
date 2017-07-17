/**
 * Dependencies.
 */
import _ from 'lodash';
import cheerio from 'cheerio';
import app from '../server/index';
import config from 'config';
import {expect} from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';
import {encrypt} from '../server/lib/utils';
import userlib from '../server/lib/userlib';
import sinon from 'sinon';
import Bluebird from 'bluebird';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import emailLib from '../server/lib/email';
import models from '../server/models';
import mock from './mocks/clearbit';

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
    sandbox = sinon.sandbox.create();
    userlib.memory = {};
    sandbox.stub(userlib, 'getUserData', (email) => {
      return new Bluebird((resolve) => {
        if (email === "xd@noreply.com") {
          return resolve(mock.person);
        } else {
          return resolve(null);
        }
      })
    })
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
          sendMail (data, callback) {
              callback();
          },
          logger: false
        });
    sinon.stub(nodemailer, 'createTransport', () => nm);
  });

  // stub the transport
  beforeEach(() => sinon.stub(nm, 'sendMail', (object, cb) => cb(null, object)));

  afterEach(() => nm.sendMail.restore());

  afterEach(() => {
    config.mailgun.user = '';
    config.mailgun.password = '';
    nodemailer.createTransport.restore();
  });

  /**
   * Create.
   */
  describe('#create', () => {

    it('fails if no api_key', () =>
      request(app)
        .post('/users')
        .send({
          user: userData
        })
        .expect(400)
    );

    it('fails if invalid api_key', () =>
      request(app)
        .post('/users')
        .send({
          api_key: '*invalid_api_key*',
          user: userData
        })
        .expect(401)
    );

    it('fails if no user object', () =>
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key
        })
        .expect(400)
    );

    it('succeeds even without email', (done) => {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: _.omit(userData, 'email')
        })
        .end((e,res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('firstName', userData.firstName);
          done();
        });
    });

    it('fails if bad email', (done) => {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: _.extend({}, userData, {email: 'abcdefg'})
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('validation_failed');
          done();
        });
    });

    it('removes the @ symbol in twitterHandle', (done) => {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: _.extend({}, userData, {twitterHandle: '@asood123'})
        })
        .expect(200)
        .end((e,res) => {
          expect(res.body.twitterHandle).to.equal('asood123');
          done();
        });
    });

    it('successfully create a user', (done) => {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: userData
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

    it('successfully create a user with just an email and auto prefills firstName, lastName, twitter, image', (done) => {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: { email: "xd@noreply.com" }
        })
        .end((e, res) => {
          expect(e).to.not.exist;
          // Creating the user returns before saving the response from clearbit
          setTimeout(() => {
            models.User
              .findById(parseInt(res.body.id))
              .then((user) => {
                expect(user.firstName).to.equal("Xavier");
                expect(user.lastName).to.equal("Damman");
                expect(user.twitterHandle).to.equal("xdamman");
                done();
              })
              .catch(done);
          }, 50);
        });
    });

    it('successfully creates a user with a referrer', (done) => {
      models.User.create(utils.data('user2'))
      .then((referrer) => {
        request(app)
          .post('/users')
          .send({
            api_key: application.api_key,
            user: { email: "xd@noreply.com", referrerId: referrer.id }
          })
          .end((e, res) => {
            expect(e).to.not.exist;
            models.User
              .findById(parseInt(res.body.id))
              .then((user) => {
                expect(user.referrerId).to.equal(referrer.id);
                done();
              })
              .catch(done);
          });
      });
    });

    describe('duplicate', () => {

      beforeEach(() => models.User.create(userData));

      it('fails to create a user with the same email', (done) => {
        request(app)
          .post('/users')
          .send({
            api_key: application.api_key,
            user: _.pick(userData, 'email')
          })
          .end((e,res) => {
            expect(res.statusCode).to.equal(400);
            expect(res.body.error.type).to.equal('validation_failed');
            done();
          });
      });

      it('fails to create a user with the same username', (done) => {
        const u = {
          email: 'newemail@email.com', username: userData.username
        }
        request(app)
          .post('/users')
          .send({
            api_key: application.api_key,
            user: u
          })
          .end((e,res) => {
            expect(res.statusCode).to.equal(400);
            expect(res.body.error.type).to.equal('validation_failed');
            done();
          });
      });

    });

  });

  /**
   * Get.
   */
  describe('#get()', () => {

    let user;
    let user2;

    // Create two users
    beforeEach(() => models.User.create(utils.data('user1')).tap(u => user = u));
    beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

    // Create a collective with two members
    beforeEach(() => models.Collective.create(utils.data('collective1'))
      .tap(g => g.addUserWithRole(user, 'MEMBER'))
      .tap(g => g.addUserWithRole(user2, 'MEMBER'))
    );

    it('successfully get a user\'s information', (done) => {
      request(app)
        .get(`/users/${user.id}?api_key=${application.api_key}`)
        .end((e, res) => {
          expect(e).to.not.exist;
          const u = res.body;
          expect(u.username).to.equal(utils.data('user1').username);
          expect(res.body).to.have.property('description', utils.data('user1').description);
          expect(res.body).to.have.property('longDescription', utils.data('user1').longDescription);
          expect(res.body).to.have.property('isOrganization', utils.data('user1').isOrganization);
          expect(u).to.not.have.property('email');
          done();
        });
    });

    it('successfully get a user\'s profile by its username', (done) => {

      request(app)
        .get(`/users/${user.username}?profile=true&api_key=${application.api_key}`)
        .end((e, res) => {
          expect(e).to.not.exist;
          const u = res.body;
          expect(u.username).to.equal(utils.data('user1').username);
          expect(u.collectives[0].name).to.equal(utils.data('collective1').name);
          expect(u.collectives[0].role).to.equal('MEMBER');
          expect(u.collectives[0].members).to.equal(2);
          done();
        });
    });

    it('successfully get a user\'s information when he is authenticated', (done) => {
      request(app)
        .get(`/users/${user.id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .end((e, res) => {
          expect(e).to.not.exist;
          const u = res.body;
          expect(u.username).to.equal(utils.data('user1').username);
          expect(u.email).to.equal(utils.data('user1').email.toLowerCase());
          done();
        });
    });

  });
  describe('#update user info', () => {
    let user;

    beforeEach(() => models.User.create(utils.data('user1')).tap(u => user = u));

    it('should update username, first name, last name and description if logged in', (done) => {
      request(app)
        .put(`/users/${user.id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          user: {
            firstName: "Xavier",
            lastName: "Damman",
            username: "xdamman2",
            description: "new description"
          }
        })
        .end((err, res) => {
          const { body } = res;
          expect(body.firstName).to.equal("Xavier");
          expect(body.username).to.equal("xdamman2");
          expect(body.description).to.equal("new description");
          done();
        });
    });

    it('should update name and automatially split it into firstName and lastName', (done) => {
      request(app)
        .put(`/users/${user.id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .send({
          user: {
            name: "Xavier Damman"
          }
        })
        .end((err, res) => {
          const { body } = res;
          expect(body.firstName).to.equal("Xavier");
          expect(body.lastName).to.equal("Damman");
          done();
        });
    });

    it('should fail to update username if already taken by a collective', (done) => {
      models.Collective.create(utils.data('collective1')).then(() => {
        request(app)
          .put(`/users/${user.id}?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user.jwt(application)}`)
          .send({
            user: {
              username: "scouts"
            }
          })
          .end((err, res) => {
            const { body } = res;
            expect(body.error.code).to.equal(400);
            expect(body.error.message).to.equal("username scouts is already taken");
            done();
          });
      });
    });
  });

  describe('#update paypal email', () => {
    let user;

    beforeEach(() => models.User.create(utils.data('user1')).tap(u => user = u));

    it('should update the paypal email', (done) => {
      const email = 'test+paypal@email.com';
      request(app)
        .put(`/users/${user.id}/paypalemail?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          paypalEmail: email
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
          paypalEmail: email
        })
        .expect(401);
    });

    it('fails if the email is not valid', () =>
      request(app)
        .put(`/users/${user.id}/paypalemail?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          paypalEmail: 'abc'
        })
        .expect(400));
  });

  describe('#update password', () => {
    let user;
    let user2;

    beforeEach(() => models.User.create(utils.data('user1')).tap(u => user = u));

    beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

    it('should update password', (done) => {
      const newPassword = 'aaa123';

      request(app)
        .put(`/users/${user.id}/password?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          password: newPassword,
          passwordConfirmation: newPassword
        })
        .end((err, res) => {
          const { body } = res;
          expect(body.success).to.equal(true);
          models.User.auth(user.email, newPassword, e => {
            expect(e).to.not.exist;
            done();
          });
        });
    });

    it('fails if the user is not logged in', () =>
      request(app)
        .put(`/users/${user.id}/password?api_key=${application.api_key}`)
        .expect(401));

    it('fails if wrong user is logged in', () =>
      request(app)
        .put(`/users/${user.id}/password?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user2.jwt()}`)
        .expect(403));

    it('fails if the passwords don\'t match', (done) => {
      const newPassword = 'aaa123';

      request(app)
        .put(`/users/${user.id}/password?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          password: newPassword,
          passwordConfirmation: `${newPassword}a`
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('bad_request');
          expect(res.body.error.message).to.equal('password and passwordConfirmation don\'t match');
          done();
        });
    });

  });

  describe('#update image', () => {
    let user;

    beforeEach(() => models.User.create(utils.data('user1')).tap(u => user = u));

    it('should update image', (done) => {
      const link = 'http://opencollective.com/assets/icon2.svg';
      request(app)
        .put(`/users/${user.id}/image?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          image: link
        })
        .end((err, res) => {
          const { body } = res;
          expect(body.image).to.equal(link);
          done();
        });
    });

    it('fails if the user is not logged in', () =>
      request(app)
        .put(`/users/${user.id}/image?api_key=${application.api_key}`)
        .send({
          image: 'http://opencollective.com/assets/icon2.svg'
        })
        .expect(401));

    it('fails if the image key is missing from the payload', () =>
      request(app)
        .put(`/users/${user.id}/image?api_key=${application.api_key}`)
        .send({})
        .expect(400));

  });

  /*
   * Update user (without authentication)
   */
  describe('#update user from public donation page', () => {
    let userWithInfo;
    let userWithoutAvatar;

    const newUser = {
      firstName: 'Aseem',
      lastName: 'Sood',
      twitterHandle: 'asood123',
      description: "engineer",
      isOrganization: false,
      website: 'opencollective.com'
    };

    beforeEach(() =>
      models.User.create({
        email: 'userwithinfo@example.com',
        firstName: 'Xavier',
        image: 'https://opencollective-production.s3-us-west-1.amazonaws.com/5c825534ad62223ae6a539f6a5076d3cjpeg_1699f6e0-917c-11e6-a567-3f53b7b5f95c.jpeg'
      })
      .tap(u => userWithInfo = u));

    beforeEach(() =>
      models.User.create({
        email: 'random1@gmail.com'
      })
      .tap(u => userWithoutAvatar = u));

    it('fails if the user already has a firstName and image set', done => {
      // only users with a recent donation can be edited
      models.Donation.create({
          UserId: userWithInfo.id,
          currency: 'USD',
          amount: 100
        })
        .then(() => {
          request(app)
            .put(`/users/${userWithInfo.id}`)
            .send({
              user: newUser,
              api_key: application.api_key
            })
            .end((e,res) => {
              expect(res.statusCode).to.equal(400);
              expect(res.body.error.type).to.equal('bad_request');
              expect(res.body.error.message).to.equal('Can\'t update user that already has provided their information');
              done();
            });
        });
    });

    it('successfully updates a user without an image', done => {
      // only users with a recent donation can be edited
      models.Donation.create({
          UserId: userWithoutAvatar.id,
          currency: 'USD',
          amount: 100
        })
        .then(() => {
          request(app)
            .put(`/users/${userWithoutAvatar.id}`)
            .send({
              user: newUser,
              api_key: application.api_key
            })
            .end((e, res) => {
              expect(e).to.not.exist;
              expect(res.body).to.have.property('id', userWithoutAvatar.id);
              expect(res.body).to.have.property('firstName', newUser.firstName);
              expect(res.body).to.have.property('lastName', newUser.lastName);
              expect(res.body).to.have.property('twitterHandle', newUser.twitterHandle);
              expect(res.body).to.have.property('website', newUser.website);
              done();
            });
        });
    });

  });

  describe('forgot password', () => {
    let user;

    beforeEach(() => models.User.create(userData).tap(u => user = u));

    beforeEach(() => sinon.spy(emailLib, 'send'));

    afterEach(() => emailLib.send.restore());

    it('fails if the email is missing', done => {
      request(app)
        .post('/users/password/forgot')
        .send({
          api_key: application.api_key
        })
        .expect(400, {
          error: {
            code: 400,
            fields: {
              email: 'Required field email missing'
            },
            message: 'Missing required fields',
            type: 'missing_required'
          }
        })
        .end(done);
    });

    it('fails if the user does not exist', done => {
      const email = 'idonotexist@void.null';

      request(app)
        .post('/users/password/forgot')
        .send({
          email,
          api_key: application.api_key
        })
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: `User with email ${email} doesn't exist`
          }
        })
        .end(done);

    });

    it('sends an email to the user with a reset url', () =>
      request(app)
        .post('/users/password/forgot')
        .send({
          email: user.email,
          api_key: application.api_key
        })
        .expect(200)
        .then(() => {
          expect(emailLib.send.lastCall.args[1]).to.equal(user.email);
        })
        .then(() => models.User.findById(user.id))
        .tap(u => {
          const today = (new Date()).toString().substring(0, 15);

          expect(u.resetPasswordTokenHash).to.be.ok;
          expect(u.resetPasswordSentAt.toString()).to.contain(today);
        }));
  });

  describe('reset password', () => {
    let user;
    let encId;

    beforeEach(() => sinon.spy(emailLib, 'send'));

    beforeEach(() => models.User.create(userData).tap(u => {
      user = u;
      encId = user.encryptId();
    }));

    beforeEach((done) => {
      request(app)
        .post('/users/password/forgot')
        .send({
          email: user.email,
          api_key: application.api_key
        })
        .expect(200)
        .end(done);
    });

    afterEach(() => emailLib.send.restore());


    it('fails if user is not found', done => {
      const encId = encrypt('1234');

      request(app)
        .post(`/users/password/reset/${encId}/abc'`)
        .send({
          api_key: application.api_key,
          password: 'a',
          passwordConfirmation: 'a'
        })
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'User with id 1234 not found'
          }
        })
        .end(done);
    });

    it('fails if the reset token is invalid', done => {
      const encId = user.encryptId();

      request(app)
        .post(`/users/password/reset/${encId}/abc'`)
        .send({
          api_key: application.api_key,
          password: 'a',
          passwordConfirmation: 'a'
        })
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'The reset token is invalid'
          }
        })
        .end(done);
    });

    it('fails if the reset passwords don\'t match', done => {
      const encId = user.encryptId();
      const $ = cheerio.load(nm.sendMail.lastCall.args[0].html);
      const token = $('a').data('token');

      request(app)
        .post(`/users/password/reset/${encId}/${token}`)
        .send({
          api_key: application.api_key,
          password: 'abc1234',
          passwordConfirmation: 'def5678'
        })
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: "password and passwordConfirmation don't match"
          }
        })
        .end(done);
    });

    it('fails if the reset token is too old', done => {
      const password = 'abc1234';
      const $ = cheerio.load(nm.sendMail.lastCall.args[0].html);
      const token = $('a').data('token');

      const d = new Date();
      d.setFullYear(d.getFullYear() - 1); // last year

      user.resetPasswordSentAt = d;

      user.save()
      .then(() => {
        request(app)
          .post(`/users/password/reset/${encId}/${token}`)
          .send({
            api_key: application.api_key,
            password,
            passwordConfirmation: password
          })
          .expect(400, {
            error: {
              code: 400,
              type: 'bad_request',
              message: 'The reset token has expired'
            }
          })
          .end(done);
      })
      .catch(done);

    });

    it('cleans up the token after reset', done => {
      const password = 'abc1234';
      const $ = cheerio.load(nm.sendMail.lastCall.args[0].html);
      const token = $('a').data('token');

      request(app)
        .post(`/users/password/reset/${encId}/${token}`)
        .send({
          api_key: application.api_key,
          password,
          passwordConfirmation: password
        })
        .expect(200)
        .end( e => {
          expect(e).to.not.exist;

          models.User.auth(user.email, password, (err) => {
            expect(err).to.not.exist;

            models.User.findById(user.id)
            .tap(u => {
              expect(u.resetPasswordTokenHash).to.be.equal(null);
              expect(u.resetPasswordSentAt).to.be.equal(null);
              done();
            })
            .catch(done);
          });

        });
    });

  });

   /**
   * Send a new link to the user to login
   */

  describe('#sendNewTokenByEmail', () => {

    let user;

    beforeEach(() => models.User.create(utils.data('user1')).tap((u => user = u)));

    it('fails if there is no email', (done) => {
      request(app)
        .post('/users/new_login_token')
        .send({
          api_key: application.api_key
        })
        .expect(400, {
          error: {
            code: 400,
            "fields": {
              "email": "Required field email missing"
            },
            message: "Missing required fields",
            type: 'missing_required'
          }
        })
        .end(done);
    });

    it('fails silently if the user does not exist', done => {
      const email = 'idonotexist@void.null';

      request(app)
        .post('/users/new_login_token')
        .send({
          email,
          api_key: application.api_key
        })
        .expect(200)
        .end(done);

    });

    it('sends an email to the user with the new token', () =>
      request(app)
        .post('/users/new_login_token')
        .send({
          email: user.email,
          api_key: application.api_key
        })
        .expect(200)
        .then(() => {
          const options = nm.sendMail.lastCall.args[0];
          const $ = cheerio.load(options.html);
          const href = $('a').attr('href');
          expect(href).to.contain(`${config.host.website}/login/`);
          expect(options.to).to.equal(user.email);
        }));
  });

  /**
   * Send a new link to the user for the subscription page
   */

  describe('#refreshTokenByEmail', () => {

    let user;

    beforeEach(() => models.User.create(utils.data('user1')).tap((u => user = u)));

    it('fails if there is no auth', () =>
      request(app)
        .post(`/users/refresh_login_token?api_key=${application.api_key}`)
        .expect(401));

    it('fails if the user does not exist', (done) => {
      const fakeUser = { id: 12312312 };
      const expiredToken = jwt.sign({ user: fakeUser }, config.keys.opencollective.secret, {
        expiresIn: 100,
        subject: fakeUser.id,
        issuer: config.host.api,
        audience: application.id
      });

      request(app)
        .post(`/users/refresh_login_token?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401, {
          error: {
            code: 401,
            message: "Invalid payload",
            type: 'unauthorized'
          }
        })
        .end(done);
    });

    it('sends an email with the new valid token', () => {
      const expiredToken = jwt.sign({ user }, config.keys.opencollective.secret, {
        expiresIn: -1,
        subject: user.id,
        issuer: config.host.api,
        audience: application.id
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
          expect(href).to.contain(`${config.host.website}/login/`);
          expect(options.to).to.equal(user.email);
        });
    });

  });

});
