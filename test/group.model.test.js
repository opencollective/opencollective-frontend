import {expect} from 'chai';
import models from '../server/models';
import * as utils from '../test/utils';

const {
  Transaction,
  Group,
  User
} = models;

describe('Group model', () => {

  let group = {};

  const groupData = {
    slug: 'tipbox',
    name: 'tipbox',
    currency: 'USD',
    tags: ['#brusselstogether']
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
    netAmountInGroupCurrency: -1000,
    currency: 'USD',
    type: 'expense',
    description: 'pizza',
    tags: ['food']
  },{
    createdAt: new Date('2016-07-14'),
    amount: -150,
    netAmountInGroupCurrency: -15000,
    currency: 'USD',
    type: 'expense',
    description: 'stickers',
    tags: ['marketing']
  },{
    createdAt: new Date('2016-06-15'),
    amount: 250,
    netAmountInGroupCurrency: 25000,
    currency: 'USD',
    type: 'donation',
    UserId: 1
  },{
    createdAt: new Date('2016-07-16'),
    amount: 500,
    netAmountInGroupCurrency: 50000,
    currency: 'USD',
    type: 'donation',
    UserId: 2
  }];


  before(() => utils.resetTestDB());

  before(() => Group.create(groupData)
    .tap(g => group = g)
    .tap(() => User.createMany(users))
    .tap(() => Transaction.createMany(transactions, { GroupId: group.id })));

  it('returns a default logo if no logo', () => {
    expect(group.logo).to.contain('/static/images/1px.png');
  });

  it('computes the balance ', () =>
    group.getBalance().then(balance => {
      let sum = 0;
      transactions.map(t => sum += t.netAmountInGroupCurrency);
      expect(balance).to.equal(sum);
    }));

  it('computes the balance until a certain month', (done) => {
    const until = new Date('2016-07-01');
    group.getBalance(until).then(balance => {
      let sum = 0;
      transactions.map(t => {
        if (t.createdAt < until)
          sum += t.netAmountInGroupCurrency
      });
      expect(balance).to.equal(sum);
      done();
    })
  });

  it('computes the number of backers', (done) => {
    group.getBackersCount()
      .then(count => {
        expect(count).to.equal(users.length);
        done();
      })
  });

  it('computes the number of backers until a certain month', (done) => {
    const until = new Date('2016-07-01');
    group.getBackersCount(until).then(count => {
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
      if (t.netAmountInGroupCurrency < 0)
        totalExpenses++;
    });

    group.getExpenses()
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
      if (t.netAmountInGroupCurrency < 0 && t.createdAt > startDate && t.createdAt < endDate)
        totalExpenses++;
    });

    group.getExpenses(null, startDate, endDate)
      .then(expenses => {
        expect(expenses.length).to.equal(totalExpenses);
        done();
      })
      .catch(e => {
        console.error('error', e, e.stack);
      });
  });

  it('get the related groups', (done) => {
    Group.createMany(utils.data('relatedGroups'))
    .then(() => group.getRelatedGroups(3, 0))
    .then(relatedGroups => {
      expect(relatedGroups).to.have.length(3);
      expect(relatedGroups[0].settings.style.hero).to.have.property('cover');
      done();
    })
  });
});
