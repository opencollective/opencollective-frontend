import {expect} from 'chai';
import app from '../index';

const utils = require('../test/utils.js')();

const models = app.get('models');
const Transaction = models.Transaction;
const Group = models.Group;
const User = models.User;

describe("Group model", () => {

  let group = {};

  const groupData = {
    slug: 'tipbox',
    name: 'tipbox',
    currency: 'USD'
  };

  const users = [{
    username: 'xdamman',
    email: 'xdamman@opencollective.com'
  },{
    username: 'piamancini',
    email: 'pia@opencollective.com'
  }];

  const transactions = [{
    createdAt: new Date("2016-06-14"),
    amount: -10,
    netAmountInGroupCurrency: -1000,
    currency: 'USD',
    type: 'expense',
    description: 'pizza',
    tags: ['food']
  },{
    createdAt: new Date("2016-07-14"),
    amount: -150,
    netAmountInGroupCurrency: -15000,
    currency: 'USD',
    type: 'expense',
    description: 'stickers',
    tags: ['marketing']
  },{
    createdAt: new Date("2016-06-15"),
    amount: 250,
    netAmountInGroupCurrency: 25000,
    currency: 'USD',
    type: 'donation',
    UserId: 1
  },{
    createdAt: new Date("2016-07-16"),
    amount: 500,
    netAmountInGroupCurrency: 50000,
    currency: 'USD',
    type: 'donation',
    UserId: 2
  }];

  
  before((done) => utils.cleanAllDb().tap(a => done()));

  before((done) => {
    Group.create(groupData)
      .tap(g => group = g)
      .tap(g => User.createMany(users))
      .tap((g) => Transaction.createMany(transactions, { GroupId: group.id }))
      .then(() => done())
      .catch(e => {
        console.error("Error in creating group", groupData, e, e.stack);
        done();
      });
  });

  it("computes the balance ", (done) => {
    group.getBalance().then(balance => {
      let sum = 0;
      transactions.map(t => sum += t.netAmountInGroupCurrency);
      expect(balance).to.equal(sum);
      done();
    })
  });
  
  it("computes the balance until a certain month", (done) => {
    const until = new Date("2016-07-01");
    group.getBalance(until).then(balance => {
      let sum = 0;
      transactions.map(t => {
        if(t.createdAt < until)
          sum += t.netAmountInGroupCurrency
      });
      expect(balance).to.equal(sum);
      done();
    })
  });

  it("computes the number of backers", (done) => {
    group.getBackersCount()
      .then(count => {
        expect(count).to.equal(users.length);
        done();
      })
  });

  it("computes the number of backers until a certain month", (done) => {
    const until = new Date("2016-07-01");
    group.getBackersCount(until).then(count => {
      let backers = {};
      transactions.map(t => {
        if(t.amount > 0 && t.createdAt < until)
          backers[t.UserId] = t.amount;
      });
      expect(count).to.equal(Object.keys(backers).length);
      done();
    })
  });

  it("gets all the expenses", (done) => {
    let totalExpenses = 0;
    transactions.map(t => {
      if(t.netAmountInGroupCurrency < 0)
        totalExpenses++;
    });

    group.getExpenses()
      .then(expenses => {
        expect(expenses.length).to.equal(totalExpenses);
        done();
      })
      .catch(e => { console.error("error", e, e.stack) });
  });

  it("gets all the expenses in a given month", (done) => {
    const startDate = new Date("2016-06-01");
    const endDate = new Date("2016-07-01");

    let totalExpenses = 0;
    
    transactions.map(t => {
      if(t.netAmountInGroupCurrency < 0 && t.createdAt > startDate && t.createdAt < endDate)
        totalExpenses++;
    });

    group.getExpenses(null, startDate, endDate)
      .then(expenses => {
        expect(expenses.length).to.equal(totalExpenses);
        done();
      })
      .catch(e => { console.error("error", e, e.stack) });
  });
});