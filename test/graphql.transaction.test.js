import { expect } from 'chai';
import { describe, it } from 'mocha';

import * as utils from './utils';

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
            slug
            transactions(limit: $limit) {
              id
              type
              createdByUser {
                id,
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
      const result = await utils.graphqlQuery(query, { slug: "WWCodeAustin", limit });
      expect(result).to.matchSnapshot();
    });
  });

  describe('return transactions', () => {

    it('returns one transaction ', async () => {
      const query = `
        query Transaction($id: Int!) {
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
      const result = await utils.graphqlQuery(query, { id: 7071 });
      expect(result).to.matchSnapshot();
    });

    it('with filter on type', async () => {
      const limit = 10;
      const offset = 5;
      const query = `
        query allTransactions($CollectiveId: Int!, $limit: Int, $offset: Int, $type: String) {
          allTransactions(CollectiveId: $CollectiveId, limit: $limit, offset: $offset, type: $type) {
            id
            type
          }
        }
      `;
      const result = await utils.graphqlQuery(query, { CollectiveId: 2, limit, offset, type: 'CREDIT' });
      expect(result).to.matchSnapshot();
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
      expect(result).to.matchSnapshot();
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
      expect(result).to.matchSnapshot();
    });

    it('with pagination', async () => {
      const limit = 20;
      const offset = 20;
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
      const result = await utils.graphqlQuery(query, { CollectiveId: 2, limit, offset });
      expect(result).to.matchSnapshot();
    });

    describe('`transactions` query', () => {
      const limit = 5;
      const offset = 10;

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
            transactions(limit: $limit, orderBy: { field: CREATED_AT, direction: ASC }) {
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
    });
  });
});
