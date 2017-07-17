import sinon from 'sinon';
import {expect} from 'chai';
import * as utils from '../test/utils';
import models from '../server/models';

const userData = utils.data('user1');

const { User, Collective, Transaction } = models;

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

    it('fails if neither email or username is given', () => {
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

    it('creates a unique username', () => {
      return User
        .create({username: 'xdamman'})
        .tap(user => {
          expect(user.username).to.equal('xdamman')
        })
        .then(() => User.create({ email: 'xavier.damman@gmail.com'}))
        .then(user => {
          expect(user.username).to.equal('xavierdamman')
        })
        .then(() => User.create({email: 'xdamman2@gmail.com'}))
        .then(() => User.create({ twitterHandle: '@xdamman'}))
        .then(user => {
          expect(user.username).to.equal('xdamman1')
          expect(user.twitterHandle).to.equal('xdamman')
        })
        .then(() => User.create({ firstName: 'Xavier', lastName: 'Damman'}))
        .then(user => {
          expect(user.username).to.equal('xavierdamman1')
        })
        .then(() => User.create({'username': 'hélène & les g.arçons'}))
        .then(user => {
          expect(user.username).to.equal('helene-and-les-garcons');
        })
    })

    it('creates a valid username from an email', () => {
      return User
        .create({email: 'xdamman+opencollective@gmail.com'})
        .tap(user => {
          expect(user.username).to.equal('xdamman')
        })
    })

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
        expect(user.public).to.have.property('website');
        expect(user.public).to.have.property('twitterHandle');
        expect(user.public.twitterHandle).to.equal(userData.twitterHandle);
        expect(userData.website).to.be.undefined;
        expect(user.website).to.equal(`https://twitter.com/${userData.twitterHandle}`);
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

    const users = [ utils.data('user1'), utils.data('user2') ];
    const transactions = [{
      createdAt: new Date('2016-06-14'),
      amount: 10000,
      netAmountInCollectiveCurrency: 10000,
      currency: 'USD',
      type: 'donation',
      UserId: 1,
      CollectiveId: 1
    },{
      createdAt: new Date('2016-06-15'),
      amount: 15000,
      netAmountInCollectiveCurrency: 15000,
      currency: 'USD',
      type: 'donation',
      UserId: 1,
      CollectiveId: 2
    },{
      createdAt: new Date('2016-07-15'),
      amount: 25000,
      netAmountInCollectiveCurrency: 25000,
      currency: 'USD',
      type: 'donation',
      UserId: 2,
      CollectiveId: 1
    },{
      createdAt: new Date('2016-07-16'),
      amount: 50000,
      netAmountInCollectiveCurrency: 50000,
      currency: 'USD',
      type: 'donation',
      UserId: 2,
      CollectiveId: 2
    }];

    beforeEach(() => utils.resetTestDB());
    beforeEach(() => User.createMany(users));
    beforeEach(() => Collective.create(utils.data('collective1')));
    beforeEach(() => Collective.create(utils.data('collective2')));
    beforeEach(() => Transaction.createMany(transactions, { HostId: 1 }));

    it('gets the top backers', () => {
      return User.getTopBackers()
        .then(backers => {
          backers = backers.map(g => g.dataValues);
          expect(backers.length).to.equal(2);
          expect(backers[0].totalDonations).to.equal(75000);
          expect(backers[0]).to.have.property('firstName');
          expect(backers[0]).to.have.property('image');
          expect(backers[0]).to.have.property('website');
          expect(backers[0]).to.have.property('twitterHandle');
        });
    });

    it('gets the top backers in a given month', () => {
      return User.getTopBackers(new Date('2016-06-01'), new Date('2016-07-01'))
        .then(backers => {
          backers = backers.map(g => g.dataValues);
          expect(backers.length).to.equal(1);
          expect(backers[0].totalDonations).to.equal(25000);
        });
    });

    it('gets the top backers in open source', () => {
      return User.getTopBackers(new Date('2016-06-01'), new Date('2016-07-01'), ['open source'])
        .then(backers => {
          backers = backers.map(g => g.dataValues);
          expect(backers.length).to.equal(1);
          expect(backers[0].totalDonations).to.equal(10000);
        });
    });

    it('gets the latest donations of a user', () => {
      return User.findOne().then(user => {
        return user.getLatestDonations(new Date('2016-06-01'), new Date('2016-08-01'))
          .then(donations => {
            expect(donations.length).to.equal(2);
          })
      });
    });

    it('gets the latest donations of a user to open source', () => {
      return User.findOne().then(user => {
        return user.getLatestDonations(new Date('2016-06-01'), new Date('2016-08-01'), ['open source'])
          .then(donations => {
            expect(donations.length).to.equal(1);
            expect(donations[0]).to.have.property("amount");
            expect(donations[0]).to.have.property("currency");
            expect(donations[0]).to.have.property("Collective");
            expect(donations[0].Collective).to.have.property("name");
          })
      });
    });

  });

});
