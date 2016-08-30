/**
 * Dependencies.
 */
const app = require('../server/index');
const expect = require('chai').expect;
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

  beforeEach(() => User = app.get('models').User);

  beforeEach(() => utils.cleanAllDb().tap(a => application = a));

  /**
   * Create a user.
   */
  describe('#create', () => {

    it('succeeds without email', () =>
      User
        .create({ name: userData.name})
        .tap(user => expect(user).to.have.property('name', userData.name)));

    it('fails if invalid email', () =>
      User
        .create({ name: userData.name, email: 'johndoe'})
        .catch(err => expect(err).to.exist));

    it('successfully creates a user and lowercase email', () => {
      var email = 'john.Doe@doe.com';
      return User
        .create({ name: userData.name, email: userData.email})
        .tap(user => {
          expect(user).to.have.property('name', userData.name);
          expect(user).to.have.property('email', userData.email.toLowerCase());
          expect(user).to.have.property('createdAt');
          expect(user).to.have.property('updatedAt');
        });
    });


    it('successfully creates a user with a password that is a number', () => {
      const email = 'john.doe@doe.com';

      return User
        .create({
          email: email,
          password: 123456
        })
        .tap(user => {
          expect(user).to.have.property('email', email);
          expect(user).to.have.property('createdAt');
          expect(user).to.have.property('password_hash');
          expect(user).to.have.property('updatedAt');
        });
    });

    it('successfully creates a user with a password that is a string', () => {
      const email = 'john.doe@doe.com';

      return User
        .create({
          email: email,
          password: '123456'
        })
        .tap(user => {
          expect(user).to.have.property('email', email);
          expect(user).to.have.property('createdAt');
          expect(user).to.have.property('password_hash');
          expect(user).to.have.property('updatedAt');
        });
    });

  });

  /**
   * Get a user.
   */
  describe('#get', () => {

    beforeEach(() => User.create(userData));


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
