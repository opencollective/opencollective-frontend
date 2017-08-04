import {expect} from 'chai';
import models from '../server/models';
import * as utils from '../test/utils';

const {
  Transaction,
  Collective,
  User
} = models;

describe('Collective model', () => {

  let collective = {}, opensourceCollective, user1, user2, host;

  const collectiveData = {
    slug: 'tipbox',
    name: 'tipbox',
    currency: 'USD',
    tags: ['#brusselstogether'],
    tiers: [
      { 
        name: 'backer',
        range: [2, 100],
        interval: 'monthly'
      },
      { 
        name: 'sponsor',
        range: [100, 100000],
        interval: 'yearly'
      }
    ]
  };

  const users = [{
    username: 'xdamman',
    email: 'xdamman@opencollective.com'
  },{
    username: 'piamancini',
    email: 'pia@opencollective.com'
  }];

  const transactions = [{
    createdAt: new Date('2016-06-14'),
    amount: -1000,
    netAmountInCollectiveCurrency: -1000,
    currency: 'USD',
    type: 'expense',
    description: 'pizza',
    tags: ['food'],
    CreatedByUserId: 1,
    FromCollectiveId: 1
  },{
    createdAt: new Date('2016-07-14'),
    amount: -15000,
    netAmountInCollectiveCurrency: -15000,
    currency: 'USD',
    type: 'expense',
    description: 'stickers',
    tags: ['marketing'],
    CreatedByUserId: 1,
    FromCollectiveId: 1
  },{
    createdAt: new Date('2016-06-15'),
    amount: 25000,
    amountInTxnCurrency: 25000,
    netAmountInCollectiveCurrency: 22500,
    currency: 'USD',
    type: 'donation',
    CreatedByUserId: 1,
    FromCollectiveId: 1
  },{
    createdAt: new Date('2016-07-16'),
    amount: 50000,
    amountInTxnCurrency: 50000,
    netAmountInCollectiveCurrency: 45000,
    currency: 'USD',
    type: 'donation',
    CreatedByUserId: 1,
    FromCollectiveId: 1
  },
  {
    createdAt: new Date('2016-08-18'),
    amount: 500,
    amountInTxnCurrency: 50000,
    netAmountInCollectiveCurrency: 45000,
    currency: 'USD',
    type: 'donation',
    CreatedByUserId: 2,
    FromCollectiveId: 2
  }];


  before(() => utils.resetTestDB());

  before(() => User.createUserWithCollective(users[0])
    .tap(u => user1 = u)
    .then(() => User.createUserWithCollective(users[1]))
    .tap(u => user2 = u)
    .then(() => User.createUserWithCollective(utils.data('host1')))
    .tap(u => host = u)
    .then(() => Collective.create(collectiveData))
    .then(g => collective = g)
    .then(() => Collective.create({
      slug: 'webpack',
      tags: ['open source'],
      isActive: true
    }))
    .then(g => opensourceCollective = g)
    .then(() => collective.addUserWithRole(user1, 'BACKER'))
    .then(() => Transaction.createMany([transactions[2]], { ToCollectiveId: opensourceCollective.id, HostCollectiveId: host.CollectiveId }))
    .then(() => Transaction.createMany(transactions, { ToCollectiveId: collective.id, HostCollectiveId: host.CollectiveId })));

  it('creates a unique slug', () => {
    return Collective
      .create({slug: 'piamancini'})
      .tap(collective => {
        expect(collective.slug).to.equal('piamancini')
      })
      .then(() => Collective.create({ name: 'XavierDamman'}))
      .then(collective => {
        expect(collective.slug).to.equal('xavierdamman')
      })
      .then(() => Collective.create({ name: 'piamancini2' }))
      .then(() => Collective.create({ twitterHandle: '@piamancini'}))
      .then(collective => {
        expect(collective.slug).to.equal('piamancini1')
        expect(collective.twitterHandle).to.equal('piamancini')
      })
      .then(() => Collective.create({ name: 'XavierDamman' }))
      .then(collective => {
        expect(collective.slug).to.equal('xavierdamman1')
      })
      .then(() => Collective.create({ name: 'hélène & les g.arçons' }))
      .then(collective => {
        expect(collective.slug).to.equal('helene-and-les-garcons');
      })
  })

  it('computes the balance ', () =>
    collective.getBalance().then(balance => {
      let sum = 0;
      transactions.map(t => sum += t.netAmountInCollectiveCurrency);
      expect(balance).to.equal(sum);
    }));

  it('computes the balance until a certain month', (done) => {
    const until = new Date('2016-07-01');
    collective.getBalance(until).then(balance => {
      let sum = 0;
      transactions.map(t => {
        if (t.createdAt < until)
          sum += t.netAmountInCollectiveCurrency
      });
      expect(balance).to.equal(sum);
      done();
    })
  });

  it('computes the number of backers', () => collective.getBackersCount()
    .then(count => {
      expect(count).to.equal(users.length);
    }));

  it('computes the number of backers until a certain month', (done) => {
    const until = new Date('2016-07-01');
    collective.getBackersCount(until).then(count => {
      const backers = {};
      transactions.map(t => {
        if (t.amount > 0 && t.createdAt < until)
          backers[t.CreatedByUserId] = t.amount;
      });
      expect(count).to.equal(Object.keys(backers).length);
      done();
    })
  });

  it('gets all the expenses', (done) => {
    let totalExpenses = 0;
    transactions.map(t => {
      if (t.netAmountInCollectiveCurrency < 0)
        totalExpenses++;
    });

    collective.getExpenses()
      .then(expenses => {
        expect(expenses.length).to.equal(totalExpenses);
        done();
      })
      .catch(e => {
        console.error('error', e, e.stack);
      });
  });

  it('gets all the expenses in a given month', (done) => {
    const startDate = new Date('2016-06-01');
    const endDate = new Date('2016-07-01');

    let totalExpenses = 0;

    transactions.map(t => {
      if (t.netAmountInCollectiveCurrency < 0 && t.createdAt > startDate && t.createdAt < endDate)
        totalExpenses++;
    });

    collective.getExpenses(null, startDate, endDate)
      .then(expenses => {
        expect(expenses.length).to.equal(totalExpenses);
        done();
      })
      .catch(e => {
        console.error('error', e, e.stack);
      });
  });

  it('get the related collectives', (done) => {
    Collective.createMany(utils.data('relatedCollectives'))
    .then(() => collective.getRelatedCollectives(3, 0))
    .then(relatedCollectives => {
      expect(relatedCollectives).to.have.length(3);
      done();
    })
  });

  describe("backers", () => {

    it('gets the top backers', () => {
      return Collective.getTopBackers()
        .then(backers => {
          backers = backers.map(g => g.dataValues);
          expect(backers.length).to.equal(2);
          expect(backers[0].totalDonations).to.equal(100000);
          expect(backers[0]).to.have.property('website');
        });
    });

    it('gets the top backers in a given month', () => {
      return Collective.getTopBackers(new Date('2016-06-01'), new Date('2016-07-01'))
        .then(backers => {
          backers = backers.map(g => g.dataValues);
          expect(backers.length).to.equal(1);
          expect(backers[0].totalDonations).to.equal(50000);
        });
    });

    it('gets the top backers in open source', () => {
      return Collective.getTopBackers(new Date('2016-06-01'), new Date('2016-07-01'), ['open source'])
        .then(backers => {
          backers = backers.map(g => g.dataValues);
          expect(backers.length).to.equal(1);
          expect(backers[0].totalDonations).to.equal(25000);
        });
    });

    it('gets the latest donations of a user collective', () => {
      return Collective.findOne({where: { type: 'USER' }}).then(userCollective => {
        return userCollective.getLatestDonations(new Date('2016-06-01'), new Date('2016-08-01'))
          .then(donations => {
            expect(donations.length).to.equal(5);
          })
      });
    });

    it('gets the latest donations of a user collective to open source', () => {
      return Collective.findOne({where: { type: 'USER' }}).then(userCollective => {
        return userCollective.getLatestDonations(new Date('2016-06-01'), new Date('2016-08-01'), ['open source'])
          .then(donations => {
            expect(donations.length).to.equal(1);
            expect(donations[0]).to.have.property("amount");
            expect(donations[0]).to.have.property("currency");
            expect(donations[0]).to.have.property("toCollective");
            expect(donations[0].toCollective).to.have.property("name");
          })
      });
    });
    
  })

  describe("tiers", () => {

    before('adding backer tier', () => models.Tier.create({ ...utils.data('tier1'), CollectiveId: collective.id })); // adding backer tier
    before('adding sponsor tier', () => models.Tier.create({ ...utils.data('tier2'), CollectiveId: collective.id })); // adding sponsor tier
    before('adding user as backer', () => collective.addUserWithRole(user2, 'BACKER'))
    before('creating order for backer tier', () => models.Order.create({
      CreatedByUserId: user1.id,
      FromCollectiveId: user1.CollectiveId,
      ToCollectiveId: collective.id,
      TierId: 1
    }));

    before('creating order for sponsor tier', () => models.Order.create({
      CreatedByUserId: user2.id,
      FromCollectiveId: user2.CollectiveId,
      ToCollectiveId: collective.id,
      TierId: 2
    }));

    it('get the tiers with users', (done) => {

      collective.getTiersWithUsers()
        .then(tiers => {
          expect(tiers).to.have.length(2);
          expect(tiers[0].users).to.have.length(1);
          const backer = tiers[0].users[0];
          expect(parseInt(backer.totalDonations, 10)).to.equal(transactions[2].amountInTxnCurrency + transactions[3].amountInTxnCurrency);
          expect(new Date(backer.firstDonation).getTime()).to.equal(new Date(transactions[2].createdAt).getTime());
          expect(new Date(backer.lastDonation).getTime()).to.equal(new Date(transactions[3].createdAt).getTime());
          done();
        });
    });
  });
});