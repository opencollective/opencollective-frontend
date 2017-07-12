import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';

import * as utils from './utils';
import models from '../server/models';

const stringify = (json) => {
  return JSON.stringify(json, null, '>>>>').replace(/\n>>>>+"([^"]+)"/g,'$1').replace(/\n|>>>>+/g,'')
}

describe('Query Tests', () => {
  let user1, user2, group1, group2, tier1;

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user1 = u));
  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

  beforeEach(() => models.Group.create(utils.data('group1')).tap(g => group1 = g));

  beforeEach(() => models.Group.create(utils.data('group2')).tap(g => group2 = g));

  beforeEach(() => group1.createTier(utils.data('ticket1')).tap(t => tier1 = t));

  beforeEach(() => group1.addUserWithRole(user1, 'BACKER'));
  beforeEach(() => group2.addUserWithRole(user1, 'MEMBER'));

  describe('graphql.user.test.js', () => {

    describe('logged in user', () => {

      const LoggedInUserQuery = `
        query LoggedInUser {
          LoggedInUser {
            id,
            firstName,
            lastName,
            collectives {
              slug,
              role
            }
          }
        }
      `;

      it('returns all collectives with role', async () => {
        const context = { remoteUser: user1 };
        const result = await graphql(schema, LoggedInUserQuery, null, context);
        const data = result.data.LoggedInUser;
        expect(data.collectives.length).to.equal(2);
        expect(data.collectives[0].role).to.equal('BACKER');
        expect(data.collectives[1].role).to.equal('MEMBER');
      })

      it("doesn't return anything if not logged in", async () => {
        const context = {};
        const result = await graphql(schema, LoggedInUserQuery, null, context);
        const data = result.data.LoggedInUser;
        expect(data).to.be.null;
      })
    });

    describe('cards', () => {

      const generateResponse = (user) => {
        return {
          description: "test response",
          user: {
            email: user1.email,
            card: {
              service: 'stripe',
              identifier: '4242',
              expMonth: 1,
              expYear: 2021,
              funding: 'credit',
              brand: 'Visa',
              country: 'US',
              token: 'card_1AejcADjPFcHOcTmBJRASiOV'
            }
          },
          collective: { slug: group1.slug },
          tier: { id: tier1.id }
        }
      }

      it("adds a credit card to the user", async () => {
        const query = `
        mutation createResponse {
          createResponse(response: ${stringify(generateResponse(user1))}) {
            user {
              id,
              email,
              cards {
                brand,
                identifier
              }
            }
          }
        }`;

        const result = await graphql(schema, query, null, {});
        expect(result.errors).to.not.exist;
        const cards = await models.Card.findAll({where: { UserId: user1.id }});
        expect(cards).to.have.length(1);
        expect(cards[0].identifier).to.equal('4242');
      });

      it("doesn't get the credit cards of the user if not logged in as that user", async () => {
        const createResponseQuery = `
        mutation createResponse {
          createResponse(response: ${stringify(generateResponse(user1))}) {
            description
          }
        }`;

        await graphql(schema, createResponseQuery, null, {});

        const query = `
          query Tier {
            Tier(id: ${tier1.id}) {
              name,
              responses {
                id,
                description,
                user {
                  id,
                  name,
                  cards {
                    identifier,
                    brand
                  }
                }
              }
            }
          }
        `;
        const result = await graphql(schema, query, null, {});
        const responses = result.data.Tier.responses;
        expect(responses).to.have.length(1);
        expect(responses[0].user.cards).to.have.length(0);
      });

      it("gets the credit cards of the user if logged in as that user", async () => {
          const createResponseQuery = `
          mutation createResponse {
            createResponse(response: ${stringify(generateResponse(user1))}) {
              description
            }
          }`;

          await graphql(schema, createResponseQuery, null, {});

          const query = `
            query Tier {
              Tier(id: ${tier1.id}) {
                name,
                responses {
                  id,
                  description,
                  user {
                    id,
                    name,
                    cards {
                      identifier,
                      brand
                    }
                  }
                }
              }
            }
          `;
          const result = await graphql(schema, query, null, { remoteUser: user1 });
          const responses = result.data.Tier.responses;
          expect(responses).to.have.length(1);
          expect(responses[0].user.cards).to.have.length(1);
          expect(responses[0].user.cards[0].identifier).to.equal('4242');
        });
      });
    });
  });
