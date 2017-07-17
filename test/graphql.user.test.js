import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';
import sinon from 'sinon';
import paymentsLib from '../server/lib/payments';

import * as utils from './utils';
import models from '../server/models';

const stringify = (json) => {
  return JSON.stringify(json, null, '>>>>').replace(/\n>>>>+"([^"]+)"/g,'$1').replace(/\n|>>>>+/g,'')
}

describe('Query Tests', () => {
  let user1, user2, host, collective1, collective2, tier1, ticket1, sandbox;


  before(() => sandbox = sinon.sandbox.create());

  before(() => {
    sandbox.stub(paymentsLib, 'createPayment', ({response}) => {
      return models.Response.update({ confirmedAt: new Date}, { where: { id: response.id }});
    });
  });

  after(() => sandbox.restore());

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user1 = u));
  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));
  beforeEach(() => models.User.create(utils.data('host1')).tap(u => host = u));

  beforeEach(() => models.Collective.create(utils.data('collective1')).tap(g => collective1 = g));

  beforeEach(() => models.Collective.create(utils.data('collective2')).tap(g => collective2 = g));

  beforeEach(() => collective1.createTier(utils.data('tier1')).tap(t => tier1 = t));
  beforeEach(() => collective1.createTier(utils.data('ticket1')).tap(t => ticket1 = t));

  beforeEach(() => collective1.addUserWithRole(user1, 'BACKER'));
  beforeEach(() => collective2.addUserWithRole(user1, 'MEMBER'));
  beforeEach(() => collective1.addUserWithRole(host, 'HOST'));

  beforeEach('create stripe account', (done) => {
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then((account) => host.setStripeAccount(account))
    .tap(() => done())
    .catch(done);
  });

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

    describe('payment methods', () => {

      const generateResponse = (user, tier = tier1) => {
        return {
          description: "test response",
          user: {
            email: user.email,
            paymentMethod: {
              service: 'stripe',
              identifier: '4242',
              expMonth: 1,
              expYear: 2021,
              funding: 'credit',
              brand: 'Visa',
              country: 'US',
              token: 'card_1AejcADjPFcHOcTmBJRASiOV',
              save: true
            }
          },
          collective: { slug: collective1.slug },
          tier: { id: tier.id }
        }
      }

      it("saves a payment method to the user", async () => {
        const query = `
        mutation createResponse {
          createResponse(response: ${stringify(generateResponse(user1))}) {
            user {
              id,
              email,
              paymentMethods {
                brand,
                identifier
              }
            }
          }
        }`;

        const result = await graphql(schema, query, null, {});
        expect(result.errors).to.not.exist;
        const paymentMethods = await models.PaymentMethod.findAll({where: { UserId: user1.id }});
        expect(paymentMethods).to.have.length(1);
        expect(paymentMethods[0].identifier).to.equal('4242');
      });


      it("does not save a payment method to the user", async () => {
        const response = generateResponse(user1);
        response.user.paymentMethod.save = false;
        const query = `
        mutation createResponse {
          createResponse(response: ${stringify(response)}) {
            user {
              id,
              email,
              paymentMethods {
                brand,
                identifier
              }
            }
          }
        }`;

        const result = await graphql(schema, query, null, {});
        expect(result.errors).to.not.exist;
        const paymentMethods = await models.PaymentMethod.findAll({where: { UserId: user1.id }});
        expect(paymentMethods).to.have.length(1);
        expect(paymentMethods[0].identifier).to.be.null;
      });
      
      it("doesn't get the payment method of the user if not logged in as that user", async () => {
        const createResponseQuery = `
        mutation createResponse {
          createResponse(response: ${stringify(generateResponse(user1, ticket1))}) {
            description
          }
        }`;

        await graphql(schema, createResponseQuery, null, {});

        const query = `
          query Tier {
            Tier(id: ${ticket1.id}) {
              id,
              name,
              responses {
                id,
                description,
                user {
                  id,
                  name,
                  paymentMethods {
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
        expect(responses[0].user.paymentMethods).to.have.length(0);
        const result2 = await graphql(schema, query, null, { remoteUser: user2 });
        const responses2 = result2.data.Tier.responses;
        expect(responses2).to.have.length(1);
        expect(responses2[0].user.paymentMethods).to.have.length(0);
      });

      it("gets the payment method of the user if logged in as that user", async () => {
        const response = generateResponse(user1);
        const createResponseQuery = `
        mutation createResponse {
          createResponse(response: ${stringify(response)}) {
            description
          }
        }`;

        await graphql(schema, createResponseQuery, null, {});

        await models.PaymentMethod.update({confirmedAt: new Date}, { where: { UserId: user1.id }});

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
                  paymentMethods {
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
        expect(responses[0].user.paymentMethods).to.have.length(1);
        expect(responses[0].user.paymentMethods[0].identifier).to.equal('4242');
      });
    });
  });
});
