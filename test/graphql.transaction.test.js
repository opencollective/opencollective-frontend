import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';

import * as utils from './utils';

const showErrors = (graphqlResult) => {
  if (!graphqlResult || !graphqlResult.errors) return;
  const { message, path } = graphqlResult.errors[0];
  console.log("GraphQL error in path", path);
  console.error(message.split('\n').filter(line => !line.match(/node_modules/)).join('\n'));
}

describe('graphql.transaction.test.js', () => {
  /* SETUP
    collective1: 2 events
      event1: 2 tiers
        tier1: 2 orders
        tier2: 1 order
      event2: 1 tier
        tier3: no order
    collective2: 1 event
      event3: no tiers // event3 not declared above due to linting
    collective3: no events
  */

  before(() => utils.loadDB("wwcode_test"));

  describe('return collective.transactions', () => {
    it('when given a collective slug (case insensitive)', async () => {
      const limit = 40;
      const query = `
        query Collective($slug: String!, $limit: Int) {
          Collective(slug: $slug) {
            id,
            slug,
            transactions(limit: $limit) {
              id,
              type,
              createdByUser {
                id,
                firstName,
                email
              },
              host {
                id,
                firstName
                email
              },
              ... on Expense {
                attachment
              }
              ... on Order {
                paymentMethod {
                  id,
                  name
                },
                subscription {
                  id,
                  interval
                }
              }
            }
          }
        }
      `;
      const result = await utils.graphqlQuery(query, { slug: "WWCodeAustin", limit });
      showErrors(result);
      result.errors && console.error(result.errors[0]);
      expect(result.errors).to.not.exist;
      const transactions = result.data.Collective.transactions;
      expect(transactions.length).to.equal(limit);
      const expense = transactions.find(t => t.type === 'DEBIT');
      const order = transactions.find(t => t.type === 'CREDIT');
      expect(expense).to.have.property('attachment');
      expect(expense.attachment).to.equal(null); // can't see attachment if not logged in
      expect(order).to.have.property('paymentMethod');
      expect(order.createdByUser.id).to.equal(4348); // Nicole user
      expect(order.host.id).to.equal(9804); // wwcode host collective
      expect(order.createdByUser.email).to.equal(null); // can't see email if not logged in
      expect(order.host.email).to.equal(null);
    });
  });

  describe('return transactions', () => {

    it('returns one transaction ', async () => {
      const query = `
        query Transaction($id: Int!) {
          Transaction(id: $id) {
            id,
            type,
            createdByUser {
              id,
              firstName,
              email
            },
            host {
              id,
              firstName
              email
            },
            ... on Expense {
              attachment
            }
            ... on Order {
              paymentMethod {
                id,
                name
              },
              subscription {
                id,
                interval
              }
            }
          }
        }
      `;
      const result = await utils.graphqlQuery(query, { id: 7071 });
      result.errors && console.error(result.errors[0]);
      expect(result.errors).to.not.exist;
      const transaction = result.data.Transaction;
      expect(transaction.id).to.equal(7071);
      expect(transaction.attachment).to.equal(null);
    });

    it('with filter on type', async () => {
      const limit = 10;
      const offset = 5;
      const query = `
        query allTransactions($CollectiveId: Int!, $limit: Int, $offset: Int, $type: String) {
          allTransactions(CollectiveId: $CollectiveId, limit: $limit, offset: $offset, type: $type) {
            id,
            type
          }
        }
      `;
      const result = await utils.graphqlQuery(query, { CollectiveId: 2, limit, offset, type: 'CREDIT' });
      result.errors && console.log(result.errors);
      expect(result.errors).to.not.exist;
      const transactions = result.data.allTransactions;
      expect(transactions.length).to.equal(limit);
      transactions.map(t => {
        expect(t.type).to.equal('CREDIT');
      });
    });

    it('with dateFrom', async () => {
      // Given the followin query
      const query = `
        query allTransactions($CollectiveId: Int!, $limit: Int, $offset: Int, $type: String, $dateFrom: String $dateTo: String) {
          allTransactions(CollectiveId: $CollectiveId, limit: $limit, offset: $offset, type: $type, dateFrom: $dateFrom, dateTo: $dateTo) {
            id,
          }
        }
      `;

      // When the query is executed with the parameter `dateFrom`
      const result = await utils.graphqlQuery(query, {
        CollectiveId: 2,
        dateFrom: '2017-10-01',
      });

      // Then the result should contain no errors
      expect(result.errors).to.not.exist;

      // TODO: If the database rows change, this test will likely fail
      // And then the results should only include the rows with
      // `createdAt` after `dateFrom`.
      expect(result.data.allTransactions.length).to.equal(5);
    });

    it('with dateTo', async () => {
      // Given the followin query
      const query = `
        query allTransactions($CollectiveId: Int!, $limit: Int, $offset: Int, $type: String, $dateFrom: String $dateTo: String) {
          allTransactions(CollectiveId: $CollectiveId, limit: $limit, offset: $offset, type: $type, dateFrom: $dateFrom, dateTo: $dateTo) {
            id,
          }
        }
      `;

      // When the query is executed with the parameter `dateFrom`
      const result = await utils.graphqlQuery(query, {
        CollectiveId: 2,
        dateTo: '2017-10-01',
      });

      // Then the result should contain no errors
      expect(result.errors).to.not.exist;

      // TODO: If the database rows change, this test will likely fail
      // And then there should bring all the rows created before `2017-10-01`
      expect(result.data.allTransactions.length).to.equal(78);
    });

    it('with pagination', async () => {
      const limit = 20;
      const offset = 20;
      const query = `
        query allTransactions($CollectiveId: Int!, $limit: Int, $offset: Int) {
          allTransactions(CollectiveId: $CollectiveId, limit: $limit, offset: $offset) {
            id,
            type,
            createdByUser {
              id,
              firstName
              lastName
              email
            },
            fromCollective {
              id
              slug
            }
            collective {
              id
              slug
            }
            host {
              id,
              name
              email
            },
            ... on Expense {
              attachment
            }
            ... on Order {
              paymentMethod {
                id,
                name
              },
              subscription {
                id,
                interval
              }
            }
          }
        }
      `;
      const result = await utils.graphqlQuery(query, { CollectiveId: 2, limit, offset });
      result.errors && console.error(result.errors[0]);
      expect(result.errors).to.not.exist;
      const transactions = result.data.allTransactions;
      expect(transactions.length).to.equal(limit);
      expect(transactions[0].id).to.equal(9595);
      const expense = transactions.find(t => t.type === 'DEBIT');
      expect(expense.attachment).to.equal(null);
      return models.User.findOne({ where: { id: expense.createdByUser.id } }).then(async (user) => {
        const result2 = await utils.graphqlQuery(query, { CollectiveId: 2 }, user);
        result2.errors && console.error(result2.errors[0]);
        const transactions2 = result2.data.allTransactions;
        expect(result.errors).to.not.exist;
        const expense2 = transactions2.find(t => t.type === 'DEBIT');
        expect(expense2.attachment).to.equal('******');
      })
      
    });
  });
});
