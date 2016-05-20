/**
 * Dependencies.
 */
const app = require('../index');
const expect = require('chai').expect;
const request = require('supertest');
const utils = require('../test/utils.js')();

/**
 * Variable.
 */
var userData = utils.data('user1');

/**
 * Tests.
 */
describe('user.models.test.js', () => {

  var application;
  var User;

  beforeEach(() => {
    User = app.get('models').User;
  })

  beforeEach((done) => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  /**
   * Create a user.
   */
  describe('#create', () => {

    it('succeeds without email', (done) => {
      User
        .create({ name: userData.name})
        .done((err, user) => {
          expect(err).to.not.exist;
          expect(user).to.have.property('name', userData.name);
          done();
        });

    });

    it('fails if invalid email', (done) => {
      User
        .create({ name: userData.name, email: 'johndoe'})
        .done((err, user) => {
          expect(err).to.exist;
          done();
        });

    });

    it('successfully creates a user and lowercase email', (done) => {
      var email = 'john.Doe@doe.com';
      User
        .create({ name: userData.name, email: userData.email})
        .done((err, user) => {
          expect(err).to.not.exist;
          expect(user).to.have.property('name', userData.name);
          expect(user).to.have.property('email', userData.email.toLowerCase());
          expect(user).to.have.property('createdAt');
          expect(user).to.have.property('updatedAt');
          done();
        });

    });


    it('successfully creates a user with a password that is a number', (done) => {
      const email = 'john.doe@doe.com';

      User
        .create({
          email: email,
          password: 123456
        })
        .done((err, user) => {
          expect(err).to.not.exist;
          expect(user).to.have.property('email', email);
          expect(user).to.have.property('createdAt');
          expect(user).to.have.property('password_hash');
          expect(user).to.have.property('updatedAt');
          done();
        });
    });

    it('successfully creates a user with a password that is a string', (done) => {
      const email = 'john.doe@doe.com';

      User
        .create({
          email: email,
          password: '123456'
        })
        .done((err, user) => {
          expect(err).to.not.exist;
          expect(user).to.have.property('email', email);
          expect(user).to.have.property('createdAt');
          expect(user).to.have.property('password_hash');
          expect(user).to.have.property('updatedAt');
          done();
        });
    });

  });

  /**
   * Get a user.
   */
  describe('#get', () => {

    beforeEach((done) => {
      User
        .create(userData)
        .done(done);
    });


    it('successfully get a user, user.info and user.public return correct information', (done) => {
      User.findOne({}).then((user) => {
        expect(user.info).to.have.property('email');
        expect(user.info).to.have.property('paypalEmail');
        expect(user.public).to.not.have.property('email');
        expect(user.public).to.not.have.property('paypalEmail');
        expect(user.public).to.have.property('website');
        expect(user.public).to.have.property('twitterHandle');
        expect(user.public.twitterHandle).to.equal(userData.twitterHandle);
        done();
      });
    });

  });

});
