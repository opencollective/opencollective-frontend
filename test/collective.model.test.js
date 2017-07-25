import {expect} from 'chai';
import models from '../server/models';
import * as utils from '../test/utils';

const {
  Transaction,
  Collective,
  User
} = models;

describe('Collective model', () => {

  let collective = {};

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
    amount: -10,
    netAmountInCollectiveCurrency: -1000,
    currency: 'USD',
    type: 'expense',
    description: 'pizza',
    tags: ['food'],
    UserId: 1
  },{
    createdAt: new Date('2016-07-14'),
    amount: -150,
    netAmountInCollectiveCurrency: -15000,
    currency: 'USD',
    type: 'expense',
    description: 'stickers',
    tags: ['marketing'],
    UserId: 1
  },{
    createdAt: new Date('2016-06-15'),
    amount: 250,
    amountInTxnCurrency: 25000,
    netAmountInCollectiveCurrency: 22500,
    currency: 'USD',
    type: 'donation',
    UserId: 1
  },{
    createdAt: new Date('2016-07-16'),
    amount: 500,
    amountInTxnCurrency: 50000,
    netAmountInCollectiveCurrency: 45000,
    currency: 'USD',
    type: 'donation',
    UserId: 1
  },
  {
    createdAt: new Date('2016-08-18'),
    amount: 500,
    amountInTxnCurrency: 50000,
    netAmountInCollectiveCurrency: 45000,
    currency: 'USD',
    type: 'donation',
    UserId: 2
  }];


  before(() => utils.resetTestDB());

  before(() => Collective.create(collectiveData)
    .then(g => collective = g)
    .then(() => User.createMany(users))
    .then(() => collective.addUserWithRole({ id: 1 }, 'BACKER'))
    .then(() => Transaction.createMany(transactions, { CollectiveId: collective.id, HostId: 1 })));


  it('creates a unique slug', () => {
    return Collective
      .create({slug: 'xdamman'})
      .tap(collective => {
        expect(collective.slug).to.equal('xdamman')
      })
      .then(() => Collective.create({ name: 'Xavier Damman'}))
      .then(collective => {
        expect(collective.slug).to.equal('xavierdamman')
      })
      .then(() => Collective.create({ name: 'xdamman2' }))
      .then(() => Collective.create({ twitterHandle: '@xdamman'}))
      .then(collective => {
        expect(collective.slug).to.equal('xdamman1')
        expect(collective.twitterHandle).to.equal('xdamman')
      })
      .then(() => Collective.create({ name: ' Xavier Damman' }))
      .then(collective => {
        expect(collective.slug).to.equal('xavierdamman1')
      })
      .then(() => Collective.create({ 'slug': 'hélène & les g.arçons' }))
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

  it('computes the number of backers', (done) => {
    collective.getBackersCount()
      .then(count => {
        expect(count).to.equal(users.length);
        done();
      })
  });

  it('computes the number of backers until a certain month', (done) => {
    const until = new Date('2016-07-01');
    collective.getBackersCount(until).then(count => {
      const backers = {};
      transactions.map(t => {
        if (t.amount > 0 && t.createdAt < until)
          backers[t.UserId] = t.amount;
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
      expect(relatedCollectives[0].settings.style.hero).to.have.property('cover');
      done();
    })
  });

  describe("tiers", () => {

    before(() => models.Tier.create({...utils.data('tier1'), CollectiveId: 1})); // adding backer tier
    before(() => models.Tier.create({...utils.data('tier2'), CollectiveId: 1})); // adding sponsor tier

    before(() => models.Order.create({
      UserId: 1,
      CollectiveId: 1,
      TierId: 1
    }));

    before(() => models.Order.create({
      UserId: 2,
      CollectiveId: 1,
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