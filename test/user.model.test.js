import sinon from 'sinon';
import {expect} from 'chai';
import * as utils from '../test/utils';
import models from '../server/models';

const userData = utils.data('user1');

const { User } = models;

describe('user.models.test.js', () => {
  let sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();
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
      User
        .create({ firstName: userData.firstName})
        .tap(user => expect(user).to.have.property('firstName', userData.firstName)));

    it('fails if invalid email', () =>
      User
        .create({ firstName: userData.firstName, email: 'johndoe'})
        .catch(err => expect(err).to.exist));

    it('fails if no email is given', () => {
      User
        .create({ firstName: 'blah' })
        .catch(err => expect(err).to.exist);
    })

    it('successfully creates a user and lowercase email', () =>
      User
        .create({ firstName: userData.firstName, email: userData.email})
        .tap(user => {
          expect(user).to.have.property('firstName', userData.firstName);
          expect(user).to.have.property('email', userData.email.toLowerCase());
          expect(user).to.have.property('createdAt');
          expect(user).to.have.property('updatedAt');
        }));


    it('successfully creates a user with a password that is a number', () => {
      const email = 'john.doe@doe.com';

      return User
        .create({
          email,
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
          email,
          password: '123456'
        })
        .tap(user => {
          expect(user).to.have.property('email', email);
          expect(user).to.have.property('createdAt');
          expect(user).to.have.property('password_hash');
          expect(user).to.have.property('updatedAt');
        });
    });

    it('creates a user and subscribes it to user.yearlyreport and user.monthlyreport', () => {
      return User
        .create({email: 'xdamman+opencollective@gmail.com'})
        .tap(() => {
          return new Promise(resolve => {
            setTimeout(resolve, 10);
          })
        })
        .then(user => models.Notification.findAll({ UserId: user.id, channel: "email" }).then(notifications => {
          expect(notifications.length).to.equal(2);
          expect(notifications[0].type).to.equal('user.yearlyreport');
          expect(notifications[1].type).to.equal('user.monthlyreport');
        }))
    })
    
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
        done();
      });
    });

  });

  describe('#getName', () => {
    const userForNameTesting = {email: 'userforNameTesting@email.com' };

    it('returns null when neither firstName or lastName', () => {
      User.create(Object.assign({}, userForNameTesting))
      .then(user => {
        expect(user.name).to.equal(null);
      })
    });

    it('returns firstName when only firstName is present and no lastName', () => {
      User.create(Object.assign({}, userForNameTesting, { firstName: 'aditi' }))
      .then(user => {
        expect(user.name).to.equal('aditi');
      })
    });

    it('returns lastName when no firstName and only lastName', () => {
      User.create(Object.assign({}, userForNameTesting, { lastName: 'patel' }))
      .then(user => {
        expect(user.name).to.equal('patel');
      })
    });

    it('returns full name when both firstName and lastName are present', () => {
      User.create(Object.assign({}, userForNameTesting, { firstName: 'aditi', lastName: 'patel' }))
      .then(user => {
        expect(user.name).to.equal('aditi patel');
      })
    }); 
  })

  describe('class methods', () => {

    beforeEach(() => utils.resetTestDB());
    beforeEach(() => User.createUserWithCollective(utils.data('user1')));

    it('creates a new user collective and generates a unique slug', () => {
      const email = 'xavier.damman@email.com';
      return User.createUserWithCollective({ email })
        .then(user => {
          expect(user.email).to.equal(email);
          expect(user.collective.slug).to.equal('xavierdamman');
          expect(user.collective.type).to.equal('USER');
          return User.createUserWithCollective({ firstName: 'Xavier', lastName: 'Damman', email: 'xavierdamman+test@mail.com' });
        })
        .then(user2 => {
          expect(user2.collective.slug).to.equal('xavier-damman');
          expect(user2.collective.name).to.equal('Xavier Damman');        
          expect(user2.firstName).to.equal('Xavier');
          expect(user2.lastName).to.equal('Damman');
          expect(user2.name).to.equal('Xavier Damman');
        })
    });

  });

});
