import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';
import sinon from 'sinon';

import * as utils from './utils';
import models from '../server/models';
import roles from '../server/constants/roles';
import paymentsLib from '../server/lib/payments';

let host, user1, user2, collective1, event1, ticket1;
let sandbox, createPaymentStub;

const stringify = (json) => {
  return JSON.stringify(json, null, '>>>>').replace(/\n>>>>+"([^"]+)"/g,'$1').replace(/\n|>>>>+/g,'')
}

describe('Mutation Tests', () => {

  /* SETUP
    collective1: 2 events
      event1: 1 free ticket, 1 paid ticket
  */

  before(() => {
    sandbox = sinon.sandbox.create();
    createPaymentStub = sandbox.stub(paymentsLib, 'createPayment',
      () => {
        // assumes payment goes through and marks Order as confirmedAt
        return models.Order.findAll()
        .map(order => order.update({ processedAt: new Date() }))
      });
  });

  after(() => sandbox.restore());

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user1 = u));
  beforeEach(() => models.User.create(utils.data('host1')).tap(u => host = u));

  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));
  beforeEach(() => models.Collective.create(utils.data('collective1')).tap(g => collective1 = g));
  beforeEach(() => collective1.addUserWithRole(host, roles.HOST));
  beforeEach(() => collective1.addUserWithRole(user1, roles.ADMIN));

  beforeEach('create stripe account', (done) => {
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then((account) => host.setStripeAccount(account))
    .tap(() => done())
    .catch(done);
  });

  beforeEach('create an event collective', () => models.Collective.create(
    Object.assign(utils.data('event1'), { CreatedByUserId: user1.id, CollectiveId: collective1.id }))
    .tap(e => event1 = e));

  describe('createCollective tests', () => {

    describe('creates an event collective', () => {

      const getEventData = (collective) => {
        return {
          "slug": "meetup-3",
          "name": "BrusselsTogether Meetup 3",
          "type": "EVENT",
          "longDescription": "Hello Brussels!\n\nAccording to the UN, by 2050 66% of the world’s population will be urban dwellers, which will profoundly affect the role of modern city-states on Earth.\n\nToday, citizens are already anticipating this futurist trend by creating numerous initiatives inside their local communities and outside of politics.\n\nIf you want to be part of the change, please come have a look to our monthly events! You will have the opportunity to meet real actors of change and question them about their purpose. \n\nWe also offer the opportunity for anyone interested to come before the audience and share their ideas in 60 seconds at the end of the event.\n\nSee more about #BrusselsTogether radical way of thinking below.\n\nhttps://brusselstogether.org/\n\nGet your ticket below and get a free drink thanks to our sponsor! 🍻🎉\n\n**Schedule**\n\n7 pm - Doors open\n\n7:30 pm - Introduction to #BrusselsTogether\n\n7:40 pm - Co-Labs, Citizen Lab of Social Innovations\n\n7:55 pm - BeCode.org, growing today’s talented youth into tomorrow’s best developers.\n\n8:10 pm - OURB, A city building network\n\n8:30 pm - How do YOU make Brussels better \nPitch your idea in 60 seconds or less\n","location": {"name": "Brass'Art Digitaal Cafe","address":"Place communale de Molenbeek 28"},
          "startsAt": "Wed Apr 05 2017 10:00:00 GMT-0700 (PDT)",
          "endsAt": "Wed Apr 05 2017 12:00:00 GMT-0700 (PDT)",
          "timezone": "Europe/Brussels",
          "ParentCollectiveId":collective.id,
          "tiers": [
            {"name":"free ticket","description":"Free ticket","amount":0},
            {"name":"sponsor","description":"Sponsor the drinks. Pretty sure everyone will love you.","amount":15000}
          ]
        };
      };

      it("fails if not authenticated", async () => {

        const event = stringify(getEventData(collective1));

        const query = `
        mutation createCollective {
          createCollective(collective: ${event}) {
            id,
            slug,
            tiers {
              id,
              name,
              amount
            }
          }
        }
        `;
        const req = {
          remoteUser: null
        };
        const result = await graphql(schema, query, null, req);
        expect(result.errors).to.have.length(1);
        expect(result.errors[0].message).to.equal("You need to be logged in to create a collective");
      });


      it("fails if authenticated but cannot edit collective", async () => {

        const event = getEventData(collective1);

        const query = `
        mutation createCollective {
          createCollective(collective: ${stringify(event)}) {
            id,
            slug,
            tiers {
              id,
              name,
              amount
            }
          }
        }
        `;
        const req = {
          remoteUser: user2
        };
        const result = await graphql(schema, query, null, req);
        expect(result.errors).to.have.length(1);
        expect(result.errors[0].message).to.equal("You must be logged in as a member of the scouts collective to create an event");
      });

      it("creates an event with multiple tiers", async () => {

        const event = getEventData(collective1);

        const query = `
        mutation createCollective {
          createCollective(collective: ${stringify(event)}) {
            id,
            slug,
            tiers {
              id,
              name,
              amount
            }
          }
        }
        `;
        const result = await graphql(schema, query, null, { remoteUser: user1 });
        const createdEvent = result.data.createCollective;
        expect(createdEvent.slug).to.equal(`scouts/events/${event.slug}`);
        expect(createdEvent.tiers.length).to.equal(event.tiers.length);

        event.id = createdEvent.id;
        event.slug = 'newslug';
        event.tiers = createdEvent.tiers;

        // We remove the first tier
        event.tiers.shift();

        // We update the second (now only) tier
        event.tiers[0].amount = 123;

        const updateQuery = `
        mutation editCollective {
          editCollective(collective: ${stringify(event)}) {
            id,
            slug,
            tiers {
              id,
              name,
              amount
            }
          }
        }
        `;

        const r2 = await graphql(schema, updateQuery, null, {});
        expect(r2.errors).to.have.length(1);
        expect(r2.errors[0].message).to.equal("You need to be logged in to edit a collective");

        const r3 = await graphql(schema, updateQuery, null, { remoteUser: user2 });
        expect(r3.errors).to.have.length(1);
        expect(r3.errors[0].message).to.equal("You must be logged in as an admin of the scouts collective to edit this event collective");

        const r4 = await graphql(schema, updateQuery, null, { remoteUser: user1 });
        const updatedEvent = r4.data.editCollective;
        expect(updatedEvent.slug).to.equal(`${collective1.slug}/events/${event.slug}`);
        expect(updatedEvent.tiers.length).to.equal(event.tiers.length);
        expect(updatedEvent.tiers[0].amount).to.equal(event.tiers[0].amount);

      })
    })

    describe('edit tiers', () => {

      it('fails if not authenticated', async () => {
        const query = `
        mutation editTiers {
          editTiers(collectiveSlug: "${collective1.slug}", tiers: [{ name: "backer", type: "TIER", amount: 10000, interval: "month" }, { name: "sponsor", type: "TIER", amount: 500000, interval: "year" }]) {
            id,
            name,
            type,
            amount,
            interval
          }
        }
        `;
        const result = await graphql(schema, query, null, { });
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal("You need to be logged in to edit tiers");
      });

      it('fails if not authenticated as host or member of collective', async () => {
        const query = `
        mutation editTiers {
          editTiers(collectiveSlug: "${collective1.slug}", tiers: [{ name: "backer", type: "TIER", amount: 10000, interval: "month" }, { name: "sponsor", type: "TIER", amount: 500000, interval: "year" }]) {
            id,
            name,
            type,
            amount,
            interval
          }
        }
        `;
        const result = await graphql(schema, query, null, { remoteUser: user2 });
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal("You need to be logged in as a core contributor or as a host of the scouts collective");
      });

      it('add new tiers and update existing', async () => {
        const query = `
        mutation editTiers {
          editTiers(collectiveSlug: "${collective1.slug}", tiers: [{ name: "backer", type: "TIER", amount: 10000, interval: "month" }, { name: "sponsor", type: "TIER", amount: 500000, interval: "year" }]) {
            id,
            name,
            type,
            amount,
            interval
          }
        }
        `;
        const result = await graphql(schema, query, null, { remoteUser: user1 });
        const tiers = result.data.editTiers;
        expect(tiers).to.have.length(2);
        tiers.sort((a, b) => a.id - b.id)
        expect(tiers[0].interval).to.equal('month');
        expect(tiers[1].interval).to.equal('year');
        tiers[0].goal = 20000;
        tiers[1].amount = 100000;
        tiers.push({name: "free ticket", type: "TICKET", amount: 0});
        const updateQuery = `
        mutation editTiers {
          editTiers(collectiveSlug: "${collective1.slug}", tiers: ${stringify(tiers)}) {
            id,
            name,
            amount,
            type,
            goal
          }
        }
        `;
        const result2 = await graphql(schema, updateQuery, null, { remoteUser: user1 });
        const updatedTiers = result2.data.editTiers;
        updatedTiers.sort((a, b) => a.id - b.id);
        expect(updatedTiers).to.have.length(3);
        expect(updatedTiers[0].goal).to.equal(tiers[0].goal);
        expect(updatedTiers[1].amount).to.equal(tiers[1].amount);
      })
    })
  })

  describe('delete Collective', () => {
    it('fails to delete a collective if not logged in', async () => {
      const query = `
      mutation deleteCollective {
        deleteCollective(id: ${event1.id}) {
          id,
          name
        }
      }`;
      const result = await graphql(schema, query, null, { });
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal("You need to be logged in to delete a collective");
      return models.Collective.findById(event1.id).then(event => {
        expect(event).to.not.be.null;
      })
    });
    it('fails to delete a collective if logged in as another user', async () => {
      const query = `
      mutation deleteCollective {
        deleteCollective(id: ${event1.id}) {
          id,
          name
        }
      }`;
      const result = await graphql(schema, query, null, { remoteUser: user2 });
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal("You need to be logged in as a core contributor or as a host to edit this collective");
      return models.Collective.findById(event1.id).then(event => {
        expect(event).to.not.be.null;
      })
    });
    it('deletes a collective', async () => {
      const query = `
      mutation deleteCollective {
        deleteCollective(id: ${event1.id}) {
          id,
          name
        }
      }`;
      await graphql(schema, query, null, { remoteUser: user1 });
      return models.Collective.findById(event1.id).then(event => {
        expect(event).to.be.null;
      })
    });
  });

  describe('createOrder tests', () => {

    beforeEach(() => models.Tier.create(
      Object.assign(utils.data('ticket1'), { CollectiveId: event1.id }))
      .tap(t => ticket1 = t));

    beforeEach(() => models.Tier.create(
      Object.assign(utils.data('ticket2'), { CollectiveId: event1.id })));

    describe('throws an error', () => {

      it('when missing all required fields', async () => {
        const query = `
          mutation createOrder {
            createOrder(order: {}) {
              id,
              collective {
                id
              }
              tier {
                id,
                name,
                description
              }
            }
          }
        `;
        const context = { remoteUser: null };
        const result = await graphql(schema, query, null, context)
        expect(result.errors.length).to.equal(1);
        expect(result.errors[0].message).to.contain('collective');
        expect(result.errors[0].message).to.contain('user');
      });

      describe('when collective/tier doesn\'t exist', () => {

        it('when collective doesn\'t exist', async () => {
          const query = `
            mutation createOrder {
              createOrder(order: { user: { email: "${user1.email}" }, collective: { slug: "notfound" }, tier: { id: 1 }, quantity:1 }) {
                id,
                collective {
                  id
                }
                tier {
                  id,
                  name,
                  description
                }
              }
            }
          `;
          const context = { remoteUser: null };
          const result = await graphql(schema, query, null, context)
          expect(result.errors.length).to.equal(1);
          expect(result.errors[0].message).to.equal('No collective found with slug notfound');
        });

        it('when tier doesn\'t exist', async () => {
          const query = `
            mutation createOrder {
              createOrder(order: { user: { email: "user@email.com" }, collective: { slug: "${event1.slug}" }, tier: {id: 1002}, quantity:1 }) {
                id,
                collective {
                  id
                }
                tier {
                  id,
                  name,
                  description
                }
              }
            }
          `;
          const context = { remoteUser: null };
          const result = await graphql(schema, query, null, context)
          expect(result.errors.length).to.equal(1);
          expect(result.errors[0].message).to.equal(`No tier found with tier id: 1002 for collective slug ${event1.slug}`);
        });
      });

      describe('after checking ticket quantity', () => {
        it('and if not enough are available', async () => {
          const query = `
            mutation createOrder {
              createOrder(order: { user: { email: "user@email.com" }, collective: { slug: "${event1.slug}" }, tier: { id: 1 }, quantity:101 }) {
                id,
                collective {
                  id
                }
                tier {
                  id,
                  name,
                  description
                }
              }
            }
          `;
          const context = { remoteUser: null };
          const result = await graphql(schema, query, null, context)
          expect(result.errors[0].message).to.equal(`No more tickets left for ${ticket1.name}`);
        });
      });

      describe('when no payment method', () => {
        it('and it\'s a paid ticket', async () => {
           const query = `
            mutation createOrder {
              createOrder(order: { user: { email: "user@email.com" }, collective: { slug: "${event1.slug}" }, tier: { id: 2 }, quantity:2 }) {
                id,
                collective {
                  id
                }
                tier {
                  id,
                  name,
                  description
                }
              }
            }
          `;
          const context = { remoteUser: null };
          const result = await graphql(schema, query, null, context)
          expect(result.errors[0].message).to.equal('This tier requires a payment method');
        });
      });
    });

    describe('members', () => {

      it('creates a new member with an existing user', async () => {
        const query = `
          mutation createMember {
            createMember(
              user: { email: "${user2.email}" },
              collective: { slug: "${event1.slug}" },
              role: "FOLLOWER"
            ) {
              id,
              role,
              user {
                id,
                email
              },
              collective {
                id,
                slug
              }
            }
          }
        `;
        const context = { remoteUser: null };
        const result = await graphql(schema, query, null, context)

        expect(result).to.deep.equal({
          data: {
            "createMember": {
              "id": 3,
              "role": "FOLLOWER",
              "user": {
                "email": null, // note: since the logged in user cannot edit the collective, it cannot get back the email address of an order
                "id": 3
              },
              "collective": {
                "id": 2,
                "slug": "jan-meetup"
              }
            }
          }
        });
      });

      it('removes a member', async () => {
        const query = `
          mutation removeMember {
            removeMember(
              user: { id: 1 },
              collective: { slug: "${event1.slug}" },
              role: "FOLLOWER"
            ) { id }
          }
        `;

        const error1 = await graphql(schema, query, null, {});
        expect(error1.errors[0].message).to.equal('You need to be logged in to remove a member');

        const error2 = await graphql(schema, query, null, { remoteUser: { id: 2 } });
        expect(error2.errors[0].message).to.equal('You need to be logged in as this user or as a core contributor or as a host of the jan-meetup collective');
        
        const error3 = await graphql(schema, query, null, { remoteUser: { id: 1 } });
        expect(error3.errors[0].message).to.equal('Member not found');
        
        await models.Member.create({
          UserId: 1,
          CollectiveId: event1.id,
          role: 'FOLLOWER'
        });

        const membersBefore = await models.Member.count();
        await graphql(schema, query, null, { remoteUser: { id: 1 } })
        const membersAfter = await models.Member.count();
        expect(membersBefore - membersAfter).to.equal(1);
      })
    });

    describe('creates an order', () => {

      describe('in a free ticket', () => {

        it('from an existing user', async () => {
          const query = `
            mutation createOrder {
              createOrder(order: { user: { email: "${user2.email}" }, collective: { slug: "${event1.slug}" }, tier: { id: 1 }, quantity:2 }) {
                id,
                user {
                  id,
                  email
                },
                tier {
                  id,
                  name,
                  description,
                  maxQuantity,
                  availableQuantity
                },
                collective {
                  id,
                  slug
                },
                collective {
                  id,
                  slug
                }
              }
            }
          `;
          const context = { remoteUser: null };
          const result = await graphql(schema, query, null, context)
          expect(result.data).to.deep.equal({
            "createOrder": {
              "collective": {
                "id": 2,
                "slug": "jan-meetup"
              },
              "id": 1,
              "tier": {
                "availableQuantity": 8,
                "description": "free tickets for all",
                "id": 1,
                "maxQuantity": 10,
                "name": "Free ticket"
              },
              "user": {
                "email": null,
                "id": 3
              }
            }
          });
        });

        it('from a new user', async () => {
          const query = `
            mutation createOrder {
              createOrder(
                order: {
                  user: { email: "newuser@email.com" },
                  collective: { slug: "${event1.slug}" },
                  tier: { id: 1 },
                  quantity: 2
                }
              ) {
                id,
                user {
                  id,
                  email
                },
                tier {
                  id,
                  name,
                  description,
                  maxQuantity,
                  availableQuantity
                }
              }
            }
        `;
        const context = { remoteUser: null };
        const result = await graphql(schema, query, null, context)
        expect(result).to.deep.equal({
          data: {
            "createOrder": {
              "id": 1,
              "tier": {
                "availableQuantity": 8,
                "description": "free tickets for all",
                "id": 1,
                "maxQuantity": 10,
                "name": "Free ticket"
              },
              "user": {
                "email": null,
                "id": 4
              }
            }
          }
        });
        });
      });

      describe('in a paid ticket', () => {

        it('from an existing user', async () => {
          const query = `
            mutation createOrder {
              createOrder(order: {
                user: {
                  email: "${user2.email}",
                  paymentMethod: {
                    token: "tok_stripe",
                    service: "stripe",
                    expMonth: 11,
                    expYear: 2020,
                    identifier: "4242"
                  }
                },
                collective: { slug: "${event1.slug}" },
                tier: { id: 2 }, quantity:2
              }) {
                id,
                user {
                  id,
                  email
                },
                tier {
                  id,
                  name,
                  description,
                  maxQuantity,
                  availableQuantity
                },
                collective {
                  id,
                  slug
                }
              }
            }
          `;
          const context = { remoteUser: null };
          const result = await graphql(schema, query, null, context);
          expect(result.data).to.deep.equal({
            "createOrder": {
              "id": 1,
              "tier": {
                "availableQuantity": 98,
                "description": "$20 ticket",
                "id": 2,
                "maxQuantity": 100,
                "name": "paid ticket"
              },
              "user": {
                "email": null,
                "id": 3
              },
              "collective": {
                "id": 2,
                "slug": "jan-meetup"
              }
            }
          });
          const createPaymentArgument = createPaymentStub.firstCall.args[0];
          expect(createPaymentStub.callCount).to.equal(1);
          createPaymentStub.reset();
          expect(createPaymentArgument.order.id).to.equal(1);
          expect(createPaymentArgument.order.TierId).to.equal(2);
          expect(createPaymentArgument.order.CollectiveId).to.equal(2);
          expect(createPaymentArgument.order.UserId).to.equal(3);
          expect(createPaymentArgument.payment.amount).to.equal(4000);
          expect(createPaymentArgument.payment.currency).to.equal('USD');
          expect(createPaymentArgument.payment.description).to.equal('January meetup - paid ticket');
          expect(createPaymentArgument.payment.paymentMethod.token).to.equal('tok_stripe');
        });

        it('from an existing user', async () => {
          const query = `
            mutation createOrder {
              createOrder(order: {
                user: {
                  email: "newuser@email.com",
                  paymentMethod: {
                    token: "tok_stripe",
                    expMonth: 11,
                    expYear: 2020,
                    identifier: "4242"
                  }
                },
                collective: { slug: "${event1.slug}" },
                tier: { id: 2 }, quantity: 2
              }) {
                id,
                user {
                  id,
                  email
                },
                tier {
                  id,
                  name,
                  description,
                  maxQuantity,
                  availableQuantity
                },
                collective {
                  id,
                  slug
                }
              }
            }
          `;
          const context = { remoteUser: null };
          const result = await graphql(schema, query, null, context);
          const createPaymentArgument = createPaymentStub.firstCall.args[0];
          expect(result).to.deep.equal({
            data: {
              "createOrder": {
                "id": 1,
                "tier": {
                  "availableQuantity": 98,
                  "description": "$20 ticket",
                  "id": 2,
                  "maxQuantity": 100,
                  "name": "paid ticket"
                },
                "user": {
                  "email": null,
                  "id": 4
                },
                "collective": {
                  "id": 2,
                  "slug": "jan-meetup"
                }
              }
            }
          });

          expect(createPaymentStub.callCount).to.equal(1);
          expect(createPaymentArgument.order.id).to.equal(1);
          expect(createPaymentArgument.order.TierId).to.equal(2);
          expect(createPaymentArgument.order.CollectiveId).to.equal(2);
          expect(createPaymentArgument.order.UserId).to.equal(4);
          expect(createPaymentArgument.payment.amount).to.equal(4000);
          expect(createPaymentArgument.payment.currency).to.equal('USD');
          expect(createPaymentArgument.payment.description).to.equal('January meetup - paid ticket');
          expect(createPaymentArgument.payment.paymentMethod.token).to.equal('tok_stripe');
        });
      });
    });
  });
});