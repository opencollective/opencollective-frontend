import sinon from 'sinon';
import config from 'config';
import { expect } from 'chai';
import { URL } from 'url';

import models from '../server/models';
import * as auth from '../server/lib/auth';

import * as utils from './utils';
import { randEmail } from './stores';

const userData = utils.data('user1');

const { User } = models;

describe('user.models.test.js', () => {
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => sandbox.restore());

  // Create a stub for clearbit
  beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

  beforeEach(() => utils.resetTestDB());

  afterEach(() => utils.clearbitStubAfterEach(sandbox));

  /**
   * Create a user.
   */
  describe('#create', () => {
    it('succeeds without email', () =>
      User.create({ firstName: userData.firstName }).tap(user =>
        expect(user).to.have.property('firstName', userData.firstName),
      ));

    it('fails if invalid email', () =>
      User.create({ firstName: userData.firstName, email: 'johndoe' }).catch(err => expect(err).to.exist));

    it('fails if no email is given', () => {
      User.create({ firstName: 'blah' }).catch(err => expect(err).to.exist);
    });

    it('successfully creates a user and lowercase email', () =>
      User.create({ firstName: userData.firstName, email: userData.email }).tap(user => {
        expect(user).to.have.property('firstName', userData.firstName);
        expect(user).to.have.property('email', userData.email.toLowerCase());
        expect(user).to.have.property('createdAt');
        expect(user).to.have.property('updatedAt');
      }));

    it('successfully creates a user with a password that is a number', () => {
      const email = 'john.doe@doe.com';

      return User.create({
        email,
        password: 123456,
      }).tap(user => {
        expect(user).to.have.property('email', email);
        expect(user).to.have.property('createdAt');
        expect(user).to.have.property('password_hash');
        expect(user).to.have.property('updatedAt');
      });
    });

    it('successfully creates a user with a password that is a string', () => {
      const email = 'john.doe@doe.com';

      return User.create({
        email,
        password: '123456',
      }).tap(user => {
        expect(user).to.have.property('email', email);
        expect(user).to.have.property('createdAt');
        expect(user).to.have.property('password_hash');
        expect(user).to.have.property('updatedAt');
      });
    });
  });

  describe('#createUserWithCollective', () => {
    it('uses "incognito" slug if name is not provided', () => {
      const userParams = { email: 'frank@zappa.com' };
      return User.createUserWithCollective(userParams).then(user => {
        expect(user.collective.slug.startsWith('incognito')).to.equal(true);
      });
    });

    it('uses "user" slug if name is not sluggifyable', () => {
      return User.createUserWithCollective({
        email: randEmail('user@domain.com'),
        firstName: '...',
        lastName: '?????',
      }).then(user => {
        expect(user.collective.slug.startsWith('user')).to.equal(true);
      });
    });

    it('knows how to deal with special characters', () => {
      return User.createUserWithCollective({
        email: randEmail('user@domain.com'),
        firstName: '很棒的用户',
        lastName: 'awesome',
      }).then(user => {
        expect(user.collective.slug).to.equal('hen3-bang4-de-yong4-hu4-awesome');
      });
    });
  });

  /**
   * Get a user.
   */
  describe('#get', () => {
    beforeEach(() => User.create(userData));

    it('successfully get a user, user.info and user.public return correct information', done => {
      User.findOne({}).then(user => {
        expect(user.info).to.have.property('email');
        expect(user.info).to.have.property('paypalEmail');
        expect(user.public).to.not.have.property('email');
        expect(user.public).to.not.have.property('paypalEmail');
        done();
      });
    });
  });

  describe('#jwt', () => {
    // Ensure the date will start at 0 instead of starting at epoch so
    // date related things can be tested
    let clock;
    beforeEach(() => (clock = sinon.useFakeTimers()));
    afterEach(() => clock.restore());

    it('should generate valid JWTokens with user data', async () => {
      // Given a user instance
      const user = await User.create({
        email: 'foo@oc.com',
        password: '123456',
      });

      // When the token is generated
      const token = user.jwt();

      // Then the token should be valid
      const decoded = auth.verifyJwt(token);

      // And then the decoded token should contain the user data
      expect(Number(decoded.sub)).to.equal(user.id);

      // And then the default expiration of the token should have a
      // short life time
      expect(decoded.exp).to.equal(auth.TOKEN_EXPIRATION_LOGIN);
    });
  });

  describe('#generateLoginLink', () => {
    it('contains the right base URL from config and the right query parameter', async () => {
      // Given a user instance with a mocked `jwt` method
      const user = await User.create({
        email: 'foo@oc.com',
        password: '123456',
      });
      const mockUser = sinon.stub(user, 'jwt').callsFake(() => 'foo');

      // When a login link is created
      const link = user.generateLoginLink('/path/to/redirect');

      // Then the link should contain the right url
      const parsedUrl = new URL(link);
      expect(`${parsedUrl.protocol}//${parsedUrl.host}`).to.equal(config.host.website);
      expect(parsedUrl.search).to.equal('?next=/path/to/redirect');
      expect(parsedUrl.pathname).to.equal('/signin/foo');

      // And Then restore the mock
      mockUser.restore();
    });
  });

  describe('#generateConnectedAccountVerifiedToken', () => {
    it('generates a valid token with right expiration time', async () => {
      // Given a user instance with a mocked `jwt` method
      const user = await User.create({
        email: 'foo@oc.com',
        password: '123456',
      });
      const mockUser = sinon.stub(user, 'jwt').callsFake((payload, expiration) => ({ payload, expiration }));

      // When an account verification link is created
      const output = user.generateConnectedAccountVerifiedToken(1, 'user');

      // Then the expiration time should match with a constant
      expect(output.expiration).to.equal(auth.TOKEN_EXPIRATION_CONNECTED_ACCOUNT);

      // And then restore the mocked object
      mockUser.restore();
    });
  });

  describe('class methods', () => {
    beforeEach(() => utils.resetTestDB());
    beforeEach(() => User.createUserWithCollective(utils.data('user1')));

    it('creates a new user collective and generates a unique slug', () => {
      const email = 'xavier.damman@email.com';
      return User.createUserWithCollective({
        email,
        firstName: 'Xavier',
        lastName: 'Damman',
      })
        .then(user => {
          expect(user.email).to.equal(email);
          expect(user.collective.slug).to.equal('xavier-damman');
          expect(user.collective.type).to.equal('USER');
          return User.createUserWithCollective({
            firstName: 'Xavier',
            lastName: 'Damman',
            email: 'xavierdamman+test@mail.com',
          });
        })
        .then(user2 => {
          expect(user2.collective.slug).to.equal('xavier-damman1');
          expect(user2.collective.name).to.equal('Xavier Damman');
          expect(user2.firstName).to.equal('Xavier');
          expect(user2.lastName).to.equal('Damman');
        });
    });
  });
});
