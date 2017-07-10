import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';
import request from 'supertest';
import sinon from 'sinon';

import app from '../server/index';
import * as utils from './utils';
import models from '../server/models';
import roles from '../server/constants/roles';
import paymentsLib from '../server/lib/payments';


const application = utils.data('application');

let user1, user2, group1, event1, tier1;
let sandbox, createPaymentStub;

const stringify = (json) => {
  return JSON.stringify(json, null, '>>>>').replace(/\n>>>>+"([^"]+)"/g,'$1').replace(/\n|>>>>+/g,'')
}

describe('Mutation Tests', () => {

  /* SETUP
    group1: 2 events
      event1: 1 free tier, 1 paid tier
  */

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  beforeEach(() => {
    createPaymentStub = sandbox.stub(paymentsLib, 'createPayment',
      () => {
        // assumes payment goes through and marks Response as confirmedAt
        return models.Response.findAll()
        .map(response => response.update({ confirmedAt: new Date() }))
      });
  });

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user1 = u));

  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

  beforeEach('create group with user as first member', (done) => {
    request(app)
    .post('/groups')
    .send({
      api_key: application.api_key,
      group: Object.assign({}, utils.data('group1'), { users: [{ email: user1.email, role: roles.HOST}]})
    })
    .expect(200)
    .end((e, res) => {
      expect(e).to.not.exist;
      models.Group
        .findById(parseInt(res.body.id))
        .then((g) => {
          group1 = g;
          done();
        })
    })
  });

  beforeEach('create stripe account', (done) => {
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then((account) => user1.setStripeAccount(account))
    .tap(() => done())
    .catch(done);
  });

  beforeEach('create an event', () => models.Event.create(
    Object.assign(utils.data('event1'), { createdByUserId: user1.id, GroupId: group1.id }))
    .tap(e => event1 = e));


  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  describe('createEvent tests', () => {

    describe('creates an event', () => {

      const getEventData = (group) => {
        return {"slug":"meetup-3","name":"BrusselsTogether Meetup 3","description":"Hello Brussels!\n\nAccording to the UN, by 2050 66% of the world’s population will be urban dwellers, which will profoundly affect the role of modern city-states on Earth.\n\nToday, citizens are already anticipating this futurist trend by creating numerous initiatives inside their local communities and outside of politics.\n\nIf you want to be part of the change, please come have a look to our monthly events! You will have the opportunity to meet real actors of change and question them about their purpose. \n\nWe also offer the opportunity for anyone interested to come before the audience and share their ideas in 60 seconds at the end of the event.\n\nSee more about #BrusselsTogether radical way of thinking below.\n\nhttps://brusselstogether.org/\n\nGet your ticket below and get a free drink thanks to our sponsor! 🍻🎉\n\n**Schedule**\n\n7 pm - Doors open\n\n7:30 pm - Introduction to #BrusselsTogether\n\n7:40 pm - Co-Labs, Citizen Lab of Social Innovations\n\n7:55 pm - BeCode.org, growing today’s talented youth into tomorrow’s best developers.\n\n8:10 pm - OURB, A city building network\n\n8:30 pm - How do YOU make Brussels better \nPitch your idea in 60 seconds or less\n","location": {"name": "Brass'Art Digitaal Cafe","address":"Place communale de Molenbeek 28"},"startsAt":"Wed Apr 05 2017 10:00:00 GMT-0700 (PDT)","endsAt":"Wed Apr 05 2017 12:00:00 GMT-0700 (PDT)","timezone":"Europe/Brussels","collective":{"slug":group.slug},"tiers":[{"name":"free ticket","description":"Free ticket","amount":0},{"name":"sponsor","description":"Sponsor the drinks. Pretty sure everyone will love you.","amount":15000}]};
      };

      it("fails if not authenticated", async () => {

        const event = stringify(getEventData(group1));

        const query = `
        mutation createEvent {
          createEvent(event: ${event}) {
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
        expect(result.errors[0].message).to.equal("You need to be logged in to create an event");
      });


      it("fails if authenticated but cannot edit collective", async () => {

        const event = getEventData(group1);

        const query = `
        mutation createEvent {
          createEvent(event: ${stringify(event)}) {
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
        expect(result.errors[0].message).to.equal("You must be logged in as a member of the collective to create an event");
      });

      it("creates an event with multiple tiers", async () => {
        
        const event = getEventData(group1);

        const query = `
        mutation createEvent {
          createEvent(event: ${stringify(event)}) {
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
        const createdEvent = result.data.createEvent;
        expect(createdEvent.slug).to.equal(event.slug);
        expect(createdEvent.tiers.length).to.equal(event.tiers.length);

        event.id = createdEvent.id;
        event.slug = 'newslug';
        event.tiers = createdEvent.tiers;

        // We remove the first tier
        event.tiers.shift();

        // We update the second (now only) tier
        event.tiers[0].amount = 123;

        const updateQuery = `
        mutation editEvent {
          editEvent(event: ${stringify(event)}) {
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
        expect(r2.errors[0].message).to.equal("You need to be logged in to edit an event");

        const r3 = await graphql(schema, updateQuery, null, { remoteUser: user2 });
        expect(r3.errors).to.have.length(1);
        expect(r3.errors[0].message).to.equal("You need to be logged in as a core contributor or as a host to edit this event");

        const r4 = await graphql(schema, updateQuery, null, { remoteUser: user1 });
        const updatedEvent = r4.data.editEvent;
        expect(updatedEvent.slug).to.equal(event.slug);
        expect(updatedEvent.tiers.length).to.equal(event.tiers.length);
        expect(updatedEvent.tiers[0].amount).to.equal(event.tiers[0].amount);

      })
    })

    describe('edit tiers', () => {

      it('fails if not authenticated', async () => {
        const query = `
        mutation editTiers {
          editTiers(collectiveSlug: "${group1.slug}", tiers: [{ name: "backer", type: "BACKER", amount: 10000, interval: "month" }, { name: "sponsor", type: "SPONSOR", amount: 500000, interval: "year" }]) {
            id,
            name,
            type,
            amount,
            interval
          }
        }
        `;
        const result = await graphql(schema, query, null, { });
        console.log("result", result.errors);
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal("You need to be logged in to edit tiers");
      });

      it('fails if not authenticated as host or member of collective', async () => {
        const query = `
        mutation editTiers {
          editTiers(collectiveSlug: "${group1.slug}", tiers: [{ name: "backer", type: "BACKER", amount: 10000, interval: "month" }, { name: "sponsor", type: "SPONSOR", amount: 500000, interval: "year" }]) {
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
          editTiers(collectiveSlug: "${group1.slug}", tiers: [{ name: "backer", type: "BACKER", amount: 10000, interval: "month" }, { name: "sponsor", type: "SPONSOR", amount: 500000, interval: "year" }]) {
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
        expect(tiers[0].interval).to.equal('month');
        expect(tiers[1].interval).to.equal('year');

        tiers[0].goal = 20000;
        tiers[1].amount = 100000;
        tiers.push({name: "free ticket", type: "TICKET", amount: 0});
        const updateQuery = `
        mutation editTiers {
          editTiers(collectiveSlug: "${group1.slug}", tiers: ${stringify(tiers)}) {
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
        expect(updatedTiers).to.have.length(3);
        expect(updatedTiers[0].goal).to.equal(tiers[0].goal);
        expect(updatedTiers[1].amount).to.equal(tiers[1].amount);
      })
    })
  })

  describe('delete Event', () => {
    it('fails to delete an event if not logged in', async () => {
      const query = `
      mutation deleteEvent {
        deleteEvent(id: ${event1.id}) {
          id,
          name
        }
      }`;
      const result = await graphql(schema, query, null, { });
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal("You need to be logged in to delete an event");
      return models.Event.findById(event1.id).then(event => {
        expect(event).to.not.be.null;
      })
    });
    it('fails to delete an event if logged in as another user', async () => {
      const query = `
      mutation deleteEvent {
        deleteEvent(id: ${event1.id}) {
          id,
          name
        }
      }`;
      const result = await graphql(schema, query, null, { remoteUser: user2 });
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal("You need to be logged in as a core contributor or as a host to edit this event");
      return models.Event.findById(event1.id).then(event => {
        expect(event).to.not.be.null;
      })
    });
    it('deletes an event', async () => {
      const query = `
      mutation deleteEvent {
        deleteEvent(id: ${event1.id}) {
          id,
          name
        }
      }`;
      await graphql(schema, query, null, { remoteUser: user1 });
      return models.Event.findById(event1.id).then(event => {
        expect(event).to.be.null;
      })
    });
  });

  describe('createResponse tests', () => {

    beforeEach(() => models.Tier.create(
      Object.assign(utils.data('tier1'), { EventId: event1.id }))
      .tap(t => tier1 = t));

    beforeEach(() => models.Tier.create(
      Object.assign(utils.data('tier2'), { EventId: event1.id })));

    describe('throws an error', () => {

      it('when missing all required fields', async () => {
        const query = `
          mutation createResponse {
            createResponse(response: {}) {
              id,
              status
              event {
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
        expect(result.errors[0].message).to.contain('event');
        expect(result.errors[0].message).to.contain('user');
        expect(result.errors[0].message).to.contain('status');
      });

      describe('when collective/event/tier doesn\'t exist', () => {

        it('when collective doesn\'t exist', async () => {
          const query = `
            mutation createResponse {
              createResponse(response: { user: { email: "${user1.email}" }, collective: { slug: "doesNotExist" }, event: { slug: "${event1.slug}" }, tier: { id: 1 }, status: "YES", quantity:1 }) {
                id,
                status
                event {
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
          expect(result.errors[0].message).to.equal('No tier found with tier id: 1 for event slug:jan-meetup in collective slug:doesNotExist');
        });

        it('when event doesn\'t exist', async () => {
          const query = `
            mutation createResponse {
              createResponse(response: { user: { email:"user@email.com" }, collective: { slug: "${group1.slug}" }, event: { slug: "doesNotExist" }, tier: { id:1 }, status:"YES", quantity:1 }) {
                id,
                status
                event {
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
          expect(result.errors[0].message).to.equal('No tier found with tier id: 1 for event slug:doesNotExist in collective slug:scouts');
        });

        it('when tier doesn\'t exist', async () => {
          const query = `
            mutation createResponse {
              createResponse(response: { user: { email: "user@email.com" }, collective: { slug: "${group1.slug}" }, event: { slug: "${event1.slug}" }, tier: {id: 1002}, status:"YES", quantity:1 }) {
                id,
                status
                event {
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
          expect(result.errors[0].message).to.equal(`No tier found with tier id: 1002 for event slug:${event1.slug} in collective slug:${group1.slug}`);
        });
      });

      describe('after checking ticket quantity', () => {
        it('and if not enough are available', async () => {
          const query = `
            mutation createResponse {
              createResponse(response: { user: { email: "user@email.com" }, collective: { slug: "${group1.slug}" }, event: { slug: "${event1.slug}" }, tier: { id: 1 }, status:"YES", quantity:101 }) {
                id,
                status
                event {
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
          expect(result.errors[0].message).to.equal(`No more tickets left for ${tier1.name}`);
        });
      });

      describe('when no payment method', () => {
        it('and it\'s a paid tier', async () => {
           const query = `
            mutation createResponse {
              createResponse(response: { user: { email: "user@email.com" }, collective: { slug: "${group1.slug}" }, event: { slug: "${event1.slug}" }, tier: { id: 2 }, status:"YES", quantity:2 }) {
                id,
                status
                event {
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

    describe('creates a response', () => {

      describe('for INTERESTED status', () => {

        it('from an existing user', async () => {
          const query = `
            mutation createResponse {
              createResponse(response: {
                user: { email: "${user2.email}" },
                collective: { slug: "${group1.slug}" },
                event: { slug: "${event1.slug}" },
                status:"INTERESTED"
              }) {
                id,
                status,
                user {
                  id,
                  email
                },
                event {
                  id
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
          const result = await graphql(schema, query, null, context)
          expect(result).to.deep.equal({
            data: {
              "createResponse": {
                "event": {
                  "id": 1
                },
                "id": 1,
                "status": "INTERESTED",
                "tier": null,
                "user": {
                  "email": null, // note: since the logged in user cannot edit the group, it cannot get back the email address of a response
                  "id": 2
                },
                "collective": {
                  "id": 1,
                  "slug": "scouts"
                }
              }
            }
          });
        });
      });

      describe('for YES status', () => {

        describe('in a free tier', () => {

          it('from an existing user', async () => {
            const query = `
              mutation createResponse {
                createResponse(response: { user: { email: "${user2.email}" }, collective: { slug: "${group1.slug}" }, event: { slug: "${event1.slug}" }, tier: { id: 1 }, status:"YES", quantity:2 }) {
                  id,
                  status,
                  user {
                    id,
                    email
                  },
                  event {
                    id
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
            const result = await graphql(schema, query, null, context)
            expect(result).to.deep.equal({
              data: {
                "createResponse": {
                  "event": {
                    "id": 1
                  },
                  "id": 1,
                  "status": "YES",
                  "tier": {
                    "availableQuantity": 8,
                    "description": "free tickets for all",
                    "id": 1,
                    "maxQuantity": 10,
                    "name": "Free tier"
                  },
                  "user": {
                    "email": null,
                    "id": 2
                  },
                  "collective": {
                    "id": 1,
                    "slug": "scouts"
                  }
                }
              }
            });
          });

          it('from a new user', async () => {
            const query = `
              mutation createResponse {
                createResponse(response: { user: { email: "newuser@email.com" }, collective: { slug: "${group1.slug}" }, event: { slug: "${event1.slug}" }, tier: { id: 1 }, status: "YES", quantity: 2 }) {
                  id,
                  status,
                  user {
                    id,
                    email
                  },
                  event {
                    id
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
          const result = await graphql(schema, query, null, context)
            expect(result).to.deep.equal({
              data: {
                 "createResponse": {
                  "event": {
                    "id": 1
                  },
                  "id": 1,
                  "status": "YES",
                  "tier": {
                    "availableQuantity": 8,
                    "description": "free tickets for all",
                    "id": 1,
                    "maxQuantity": 10,
                    "name": "Free tier"
                  },
                  "user": {
                    "email": null,
                    "id": 3
                  },
                  "collective": {
                    "id": 1,
                    "slug": "scouts"
                  }
                }
              }
            });
          });
        });

        describe('in a paid tier', () => {

          it('from an existing user', async () => {
            const query = `
              mutation createResponse {
                createResponse(response: {
                  user: {
                    email: "${user2.email}",
                    card: {
                      token: "tok_stripe",
                      expMonth: 11,
                      expYear: 2020,
                      number: 4242
                    }
                  },
                  collective: { slug: "${group1.slug}" },
                  event: { slug: "${event1.slug}" },
                  tier: { id: 2 }, status:"YES", quantity:2
                }) {
                  id,
                  status,
                  user {
                    id,
                    email
                  },
                  event {
                    id
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
            expect(result).to.deep.equal({
              data: {
                "createResponse": {
                  "event": {
                    "id": 1
                  },
                  "id": 1,
                  "status": "YES",
                  "tier": {
                    "availableQuantity": 98,
                    "description": "$20 ticket",
                    "id": 2,
                    "maxQuantity": 100,
                    "name": "paid tier"
                  },
                  "user": {
                    "email": null,
                    "id": 2
                  },
                  "collective": {
                    "id": 1,
                    "slug": "scouts"
                  }
                }
              }
            });
            expect(createPaymentStub.callCount).to.equal(1);
            expect(createPaymentStub.firstCall.args[0].user.id).to.equal(2);
            expect(createPaymentStub.firstCall.args[0].group.slug).to.equal('scouts');
            expect(createPaymentStub.firstCall.args[0].response.id).to.equal(1);
            expect(createPaymentStub.firstCall.args[0].payment).to.deep.equal({
              stripeToken: 'tok_stripe',
              amount: 4000,
              currency: 'USD',
              description: 'January meetup - paid tier'
            });
          });

          it('from an existing user', async () => {
            const query = `
              mutation createResponse {
                createResponse(response: {
                  user: {
                    email: "newuser@email.com",
                    card: {
                      token: "tok_stripe",
                      expMonth: 11,
                      expYear: 2020,
                      number: 4242
                    }
                  },
                  collective: { slug: "${group1.slug}" },
                  event: { slug: "${event1.slug}" },
                  tier: { id: 2 }, status:"YES", quantity:2
                }) {
                  id,
                  status,
                  user {
                    id,
                    email
                  },
                  event {
                    id
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
          const result = await graphql(schema, query, null, context)
            expect(result).to.deep.equal({
              data: {
                "createResponse": {
                  "event": {
                    "id": 1
                  },
                  "id": 1,
                  "status": "YES",
                  "tier": {
                    "availableQuantity": 98,
                    "description": "$20 ticket",
                    "id": 2,
                    "maxQuantity": 100,
                    "name": "paid tier"
                  },
                  "user": {
                    "email": null,
                    "id": 3
                  },
                  "collective": {
                    "id": 1,
                    "slug": "scouts"
                  }
                }
              }
            });
            expect(createPaymentStub.callCount).to.equal(1);
            expect(createPaymentStub.firstCall.args[0].user.id).to.equal(3);
            expect(createPaymentStub.firstCall.args[0].group.slug).to.equal('scouts');
            expect(createPaymentStub.firstCall.args[0].response.id).to.equal(1);
            expect(createPaymentStub.firstCall.args[0].payment).to.deep.equal({
              stripeToken: 'tok_stripe',
              amount: 4000,
              currency: 'USD',
              description: 'January meetup - paid tier'
            });
          });
        });
      });

    });
  });
});