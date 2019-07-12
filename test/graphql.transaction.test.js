/**
 * Note: to update the snapshots run:
 * TZ=UTC CHAI_JEST_SNAPSHOT_UPDATE_ALL=true npx mocha test/graphql.transaction.test.js
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';

import * as utils from './utils';
import * as store from './stores';

describe('graphql.transaction.test.js', () => {
  before(async () => {
    await utils.resetTestDB();
    // Given a host
    const { hostCollective } = await store.newHost('wwcode', 'USD', 5);
    // Given a collective
    const { collective } = await store.newCollectiveInHost('wwcodeaustin', 'USD', hostCollective, null, {
      isActive: true,
    });
    // And given the host has a stripe account
    await store.stripeConnectedAccount(hostCollective.id);
    // And given that we have 5 users making one purchase each
    const userNames = ['Craft Work', 'Geoff Frey', 'Holly Day', 'Max Point', 'Praxent'];
    // Not using Promise.all because I want the entries to be created
    // in sequence, not in parallel since stripeOneTimeDonation can't
    // patch the same object more than once at a time.
    for (let i = 0; i < userNames.length; i++) {
      const { user } = await store.newUser(userNames[i]);
      await store.stripeOneTimeDonation({
        remoteUser: user,
        collective,
        currency: 'USD',
        amount: 1000 * (i + 1),
        createdAt: new Date(2018, i, i, 0, 0, i),
      });
      await store.stripeOneTimeDonation({
        remoteUser: user,
        collective,
        currency: 'USD',
        amount: 1000 * (i + 1),
        createdAt: new Date(2017, i, i, 0, 0, i),
      });
    }
  });

  describe('return collective.transactions', () => {
    it('when given a collective slug (case insensitive)', async () => {
      const limit = 40;
      const query = `
        query Collective($slug: String, $limit: Int) {
          Collective(slug: $slug) {
            id,
            slug
            transactions(limit: $limit) {
              id
              type
              createdByUser {
                id
                firstName
                email
              },
              host {
                id
                slug
              },
              ... on Expense {
                attachment
              }
              ... on Order {
                paymentMethod {
                  id
                  name
                },
                subscription {
                  id
                  interval
                }
              }
            }
          }
        }
      `;
      const result = await utils.graphqlQuery(query, {
        slug: 'WWCodeAustin',
        limit,
      });
      expect(result.data.Collective).to.exist;
      expect(result.data.Collective.transactions).to.have.length(10);
      expect(result).to.matchSnapshot();
    });
  });

  describe('return transactions', () => {
    it('returns one transaction by id', async () => {
      const query = `
        query Transaction($id: Int) {
          Transaction(id: $id) {
            id
            type
            createdByUser {
              id
              firstName
              email
            },
            host {
              id
              slug
            },
            ... on Expense {
              attachment
            }
            ... on Order {
              paymentMethod {
                id
                name
              },
              subscription {
                id
                interval
              }
            }
          }
        }
      `;
      const result = await utils.graphqlQuery(query, { id: 2 });
      expect(result).to.matchSnapshot();
    });

    it('returns one transaction by uuid', async () => {
      const query = `
        query Transaction($uuid: String) {
          Transaction(uuid: $uuid) {
            id
            type
            createdByUser {
              id
              firstName
              email
            },
            host {
              id
              slug
            },
            ... on Expense {
              attachment
            }
            ... on Order {
              paymentMethod {
                id
                name
              },
              subscription {
                id
                interval
              }
            }
          }
        }
      `;
      const transaction = await models.Transaction.findOne();
      const result = await utils.graphqlQuery(query, {
        uuid: transaction.uuid,
      });
      expect(result).to.matchSnapshot();
    });

    it('with filter on type', async () => {
      const limit = 100;
      const query = `
        query allTransactions($CollectiveId: Int!, $limit: Int, $offset: Int, $type: String) {
          allTransactions(CollectiveId: $CollectiveId, limit: $limit, offset: $offset, type: $type) {
            id
            type
          }
        }
      `;
      const result = await utils.graphqlQuery(query, {
        CollectiveId: 3,
        limit,
        type: 'CREDIT',
      });
      expect(result.data.allTransactions).to.have.length(10);
      expect(result).to.matchSnapshot();
    });

    it('with dateFrom', async () => {
      // Given the followin query
      const query = `
        query allTransactions($CollectiveId: Int!, $limit: Int, $offset: Int, $type: String, $dateFrom: String $dateTo: String) {
          allTransactions(CollectiveId: $CollectiveId, limit: $limit, offset: $offset, type: $type, dateFrom: $dateFrom, dateTo: $dateTo) {
            id
            createdAt
          }
        }
      `;

      // When the query is executed with the parameter `dateFrom`
      const result = await utils.graphqlQuery(query, {
        CollectiveId: 3,
        dateFrom: '2017-10-01',
      });
      expect(result.data.allTransactions).to.have.length(5);
      expect(result).to.matchSnapshot();
    });

    it('with dateTo', async () => {
      // Given the followin query
      const query = `
        query allTransactions($CollectiveId: Int!, $limit: Int, $offset: Int, $type: String, $dateFrom: String $dateTo: String) {
          allTransactions(CollectiveId: $CollectiveId, limit: $limit, offset: $offset, type: $type, dateFrom: $dateFrom, dateTo: $dateTo) {
            id
            createdAt
          }
        }
      `;

      // When the query is executed with the parameter `dateTo`
      const result = await utils.graphqlQuery(query, {
        CollectiveId: 3,
        dateTo: '2017-10-01',
      });
      expect(result.data.allTransactions).to.have.length(5);
      expect(result).to.matchSnapshot();
    });

    it('with pagination', async () => {
      const limit = 20;
      const offset = 0;
      const query = `
        query allTransactions($CollectiveId: Int!, $limit: Int, $offset: Int) {
          allTransactions(CollectiveId: $CollectiveId, limit: $limit, offset: $offset) {
            id
            type
            createdByUser {
              id
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
              id
              slug
            },
            ... on Expense {
              attachment
            }
            ... on Order {
              paymentMethod {
                id
                name
              },
              subscription {
                id
                interval
              }
            }
          }
        }
      `;
      const result = await utils.graphqlQuery(query, {
        CollectiveId: 3,
        limit,
        offset,
      });
      expect(result).to.matchSnapshot();
    });

    describe('`transactions` query', () => {
      const limit = 5;
      const offset = 5;

      it('default returns list of transactions with pagination data', async () => {
        const query = `
          query transactions {
            transactions {
              limit
              offset
              total
              transactions {
                id
                type
                createdByUser {
                  id
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
                  id
                  slug
                },
                ... on Expense {
                  attachment
                }
                ... on Order {
                  paymentMethod {
                    id
                    name
                  },
                  subscription {
                    id
                    interval
                  }
                }
              }
            }
          }
        `;

        const result = await utils.graphqlQuery(query);
        expect(result).to.matchSnapshot();
      });

      it('accepts pagination arguments: limit & offset', async () => {
        const query = `
          query transactions($limit: Int!, $offset: Int!) {
            transactions(limit: $limit, offset: $offset) {
              limit
              offset
              total
              transactions {
                id
                type
                createdByUser {
                  id
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
                  id
                  slug
                },
                ... on Expense {
                  attachment
                }
                ... on Order {
                  paymentMethod {
                    id
                    name
                  },
                  subscription {
                    id
                    interval
                  }
                }
              }
            }
          }
        `;

        const result = await utils.graphqlQuery(query, { limit, offset });
        expect(result.data.transactions.limit).to.equal(limit);
        expect(result.data.transactions.offset).to.equal(offset);
        expect(result.data.transactions.total).to.equal(20);
        expect(result.data.transactions.transactions).to.have.length(5);
        expect(result).to.matchSnapshot();
      });

      it('accepts type argument to filter transactions by type', async () => {
        const query = `
          query transactions($limit: Int!) {
            transactions(limit: $limit, type: CREDIT) {
              limit
              offset
              total
              transactions {
                id
                type
                createdByUser {
                  id
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
                  id
                  slug
                },
                ... on Expense {
                  attachment
                }
                ... on Order {
                  paymentMethod {
                    id
                    name
                  },
                  subscription {
                    id
                    interval
                  }
                }
              }
            }
          }
        `;

        const result = await utils.graphqlQuery(query, { limit });
        expect(result).to.matchSnapshot();
      });

      it('accepts orderBy argument to order transactions', async () => {
        const query = `
          query transactions($limit: Int!) {
            transactions(limit: $limit, type: CREDIT, orderBy: { field: CREATED_AT, direction: ASC }) {
              limit
              offset
              total
              transactions {
                id
                type
                createdAt
                createdByUser {
                  id
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
                  id
                  slug
                },
                ... on Expense {
                  attachment
                }
                ... on Order {
                  paymentMethod {
                    id
                    name
                  },
                  subscription {
                    id
                    interval
                  }
                }
              }
            }
          }
        `;

        const result = await utils.graphqlQuery(query, { limit });
        expect(result.data.transactions.limit).to.equal(5);
        expect(result.data.transactions.offset).to.equal(0);
        expect(result.data.transactions.total).to.equal(10);
        expect(result.data.transactions.transactions).to.have.length(5);
        expect(result).to.matchSnapshot();
      });
    });
  });
});
