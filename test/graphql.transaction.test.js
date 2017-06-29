import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';
import models from '../server/models';

import * as utils from './utils';


describe('graphql.transaction.test.js', () => {
  /* SETUP
    group1: 2 events
      event1: 2 tiers
        tier1: 2 responses
        tier2: 1 response
      event2: 1 tier
        tier3: no response
    group2: 1 event
      event3: no tiers // event3 not declared above due to linting
    group3: no events
  */

  before(() => utils.loadDB("wwcode_test"));



  describe('return collective.transactions', () => {
    it('when given an event slug and collectiveSlug (case insensitive)', async () => {
      const limit = 40;
      const query = `
        query Collective {
          Collective(collectiveSlug: "wwcodeaustin") {
            id,
            slug,
            transactions(limit: ${limit}) {
              id,
              type,
              user {
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
              ... on Donation {
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
      const context = { remoteUser: null };
      const result = await graphql(schema, query, null, context);
      expect(result.errors).to.not.exist;
      const transactions = result.data.Collective.transactions;
      expect(transactions.length).to.equal(limit);
      const expense = transactions.find(t => t.type === 'EXPENSE');
      const donation = transactions.find(t => t.type === 'DONATION');
      expect(expense).to.have.property('attachment');
      expect(expense.attachment).to.equal(null); // can't see attachment if not logged in
      expect(donation).to.have.property('paymentMethod');
      expect(donation.user.id).to.equal(4720); // Lindsey user
      expect(donation.host.id).to.equal(3); // wwcode host
      expect(donation.user.email).to.equal(null); // can't see email if not logged in
      expect(donation.host.email).to.equal(null);
    });
  });

  describe('return transactions', () => {

    it('with pagination', async () => {
      const limit = 10;
      const offset = 5;
      const query = `
        query allTransactions {
          allTransactions(collectiveSlug: "wwcodeaustin", limit: ${limit}, offset: ${offset}) {
            id,
            type,
            user {
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
            ... on Donation {
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
      const context = { remoteUser: null };
      const result = await graphql(schema, query, null, context);
      expect(result.errors).to.not.exist;
      const transactions = result.data.allTransactions;
      expect(transactions.length).to.equal(limit);
      expect(transactions[0].id).to.equal(7661);
      const expense = transactions.find(t => t.type === 'EXPENSE');
      expect(expense.attachment).to.equal(null);
      return models.User.findOne({where: { id: expense.user.id } }).then(async (user) => {
        context.remoteUser = user;
        const result2 = await graphql(schema, query, null, context);
        const transactions2 = result2.data.allTransactions;
        expect(result.errors).to.not.exist;
        const expense2 = transactions2.find(t => t.type === 'EXPENSE');
        expect(expense2.attachment).to.equal('******');
      })
      
    });
  });
});
