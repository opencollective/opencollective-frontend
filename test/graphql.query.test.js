import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';

import * as utils from './utils';
import models from '../server/models';

describe('Query Tests', () => {
  let user1, user2, user3, collective1, collective2, collective3, event1, event2, ticket1, ticket2, tier3;

  /* SETUP
    collective1: 2 events
      event1: 2 tiers
        ticket1: 2 orders
        ticket2: 1 order
      event2: 1 tier
        tier3: no order
    collective2: 1 event
      event3: no tiers // event3 not declared above due to linting
    collective3: no events
  */

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => user1 = u));

  beforeEach(() => models.User.createUserWithCollective(utils.data('user2')).tap(u => user2 = u));

  beforeEach(() => models.User.createUserWithCollective(utils.data('user3')).tap(u => user3 = u));

  beforeEach(() => models.Collective.create(utils.data('collective1')).tap(g => collective1 = g));

  beforeEach(() => models.Collective.create(utils.data('collective2')).tap(g => collective2 = g));

  beforeEach(() => models.Collective.create(utils.data('collective4')).tap(g => collective3 = g));

  describe('Root query tests', () => {

    beforeEach(() => models.Collective.create(
      Object.assign(utils.data('event1'), { CreatedByUserId: user1.id, ParentCollectiveId: collective1.id }))
      .tap(e => event1 = e));

    beforeEach(() => models.Collective.create(
      Object.assign(utils.data('event2'), { CreatedByUserId: user1.id, ParentCollectiveId: collective1.id }))
      .tap(e => event2 = e));

    beforeEach(() => models.Collective.create(
      Object.assign({}, utils.data('event2'), { slug: "another-event", CreatedByUserId: user2.id, ParentCollectiveId: collective2.id })));
      //.tap(e => event3 = e)); leaving it here, so setup above makes sense.

    describe('returns nothing', () => {

      it('when given a non-existent slug', async () => {
        const query = `
          query getMultipleEvents {
            allEvents(slug: "non-existent-slug") {
              id,
              name,
              description
            }
          }
        `;
        const req = utils.makeRequest(null);
        const result = await graphql(schema, query, null, req);
        expect(result).to.deep.equal({
          data: {
            allEvents: []
          }
        });
      });

      it('when given an existing collective slug when it has no events', async () => {
        const query = `
          query getMultipleEvents {
            allEvents(slug: "${collective3.slug}") {
              id,
              name,
              description
            }
          }
        `;
        const req = utils.makeRequest(null);
        const result = await graphql(schema, query, null, req);
        expect(result).to.deep.equal({
          data: {
            allEvents: []
          }
        });
      });
    });

    describe('returns event(s)', () => {

      it('when given an event slug and collectiveSlug (case insensitive)', async () => {
        const query = `
          query getOneEvent {
            Collective(slug:"Jan-Meetup") {
              id,
              name,
              description,
              parentCollective {
                slug,
                twitterHandle
              }
              timezone
            }
          }
        `;
        const req = utils.makeRequest(null);
        const result = await graphql(schema, query, null, req);
        expect(result).to.deep.equal({
          data: {
            Collective: {
              description: "January monthly meetup",
              id: 7,
              name: "January meetup",
              timezone: "America/New_York",
              parentCollective: {
                slug: 'scouts',
                twitterHandle: 'scouts'
              }
            }            
          }
        });
      });

      describe('returns multiple events', () => {
        
        it('when given only a collective slug', async () => {
          const query = `
            query getMultipleEvents {
              allEvents(slug: "${collective1.slug}") {
                id,
                name,
                description
              }
            }
          `;
          const req = utils.makeRequest(null);
          const result = await graphql(schema, query, null, req);
          expect(result).to.deep.equal({
            data: {
              allEvents: [
                {
                  description: "February monthly meetup",
                  id: 8,
                  name: "Feb meetup"               
                },
                {
                  description: "January monthly meetup",
                  id: 7,
                  name: "January meetup"
                }
              ]
            }
          });
        });
      });

      describe('returns multiple events with tiers and orders', () => {

        beforeEach(() => models.Tier.create(
          Object.assign(utils.data('ticket1'), { CollectiveId: event1.id }))
          .tap(t => ticket1 = t));

        beforeEach(() => models.Tier.create(
          Object.assign(utils.data('ticket2'), { CollectiveId: event1.id }))
          .tap(t => ticket2 = t));

        beforeEach(() => models.Tier.create(
          Object.assign(utils.data('ticket1'), { CollectiveId: event2.id }))
          .tap(t => tier3 = t));

        beforeEach(() => models.Order.create(
          Object.assign(utils.data('order1'), { 
            CollectiveId: event1.id,
            FromCollectiveId: user2.CollectiveId,
            TierId: ticket1.id, 
            CreatedByUserId: user2.id,
            processedAt: new Date()
          })));

        beforeEach(() => models.Order.create(
          Object.assign(utils.data('order2'), { 
            CollectiveId: event1.id,
            FromCollectiveId: user3.CollectiveId,
            TierId: ticket1.id, 
            CreatedByUserId: user3.id,
            processedAt: new Date()
          })));

        // this order shouldn't show up in the query
        // because it's not confirmed
        beforeEach(() => models.Order.create(
          Object.assign(utils.data('order2'), { 
            CollectiveId: event1.id,
            FromCollectiveId: user1.CollectiveId,
            TierId: ticket1.id, 
            CreatedByUserId: user1.id,
            processedAt: null
          })));

        beforeEach(() => models.Order.create(
          Object.assign(utils.data('order3'), { 
            CollectiveId: event1.id,
            FromCollectiveId: user3.CollectiveId,
            TierId: ticket2.id, 
            CreatedByUserId: user3.id,
            processedAt: new Date()
          })));
        
        it('sends order data', async () => {
          const query = `
            query getOneCollective {
              Collective(slug: "${event1.slug}") {
                orders {
                  createdAt,
                  processedAt
                }
              }
            }
          `;
          const req = utils.makeRequest(null);
          const result = await graphql(schema, query, null, req);
          result.errors && console.error(result.errors);
          const order = result.data.Collective.orders[0];
          expect(order).to.have.property("createdAt");
          expect(order).to.have.property("processedAt");
        });

        it('when given only a collective slug', async () => {
          const query = `
            query allEvents {
              allEvents(slug: "${collective1.slug}") {
                id,
                name,
                description,
                location {
                  name,
                  address,
                  lat,
                  long
                },
                backgroundImage,
                createdByUser {
                  id,
                  firstName
                }
                tiers {
                  id,
                  name,
                  description,
                  maxQuantity,
                  availableQuantity,
                  orders {
                    id,
                    description,
                    createdByUser {
                      id,
                      firstName
                    }
                  }
                }
              }
            }
          `;
          const req = utils.makeRequest(null);
          const result = await graphql(schema, query, null, req);
          expect(result).to.deep.equal({
            data: {
              allEvents: [
                {
                  "id": 8,
                  "name": "Feb meetup",
                  "description": "February monthly meetup",
                  "backgroundImage": null,
                  "location": {
                    "name": "Puck Fair",
                    "address": "505 Broadway, NY 10012",
                    "lat": null,
                    "long": null
                  },
                  "createdByUser": {
                    "id": 1,
                    "firstName": "Phil"
                  },
                  "tiers":[
                    {
                      id: 3,
                      name: tier3.name,
                      description: tier3.description,
                      "maxQuantity": 10,
                      "availableQuantity": 10,
                      orders: []
                    }
                  ]
                },
                {
                  id: 7,
                  name: "January meetup",
                  "description":"January monthly meetup",
                  "location" : {
                    "name": "Balanced NYC",
                    "address": "547 Broadway, NY 10012",
                    "lat": 39.807222,
                    "long": -76.984722
                  },
                  "backgroundImage": "http://opencollective.com/backgroundimage.png",
                  "createdByUser": {
                    "id":1,
                    "firstName":"Phil"
                  },
                  "tiers": [
                    {
                      "id": 1,
                      "name": ticket1.name,
                      "description":"free tickets for all",
                      "maxQuantity": 10,
                      "availableQuantity": 7,
                      "orders": [
                        {
                          "id": 1,
                          "description": "I work on bitcoin",
                          "createdByUser": {
                            "id": 2,
                            "firstName": "Anish"
                          }
                        },
                        {
                          "id": 2,
                          "description": "I have been working on open source for over a decade",
                          "createdByUser": {
                            "id": 3,
                            "firstName": "Xavier"
                          }
                        }
                      ]
                    },
                    {
                      "id": 2,
                      "name": ticket2.name,
                      "description": "$20 ticket",
                      "maxQuantity": 100,
                      "availableQuantity": 98,
                      "orders": [
                        {
                          "id": 4,
                          "description": null,
                          "createdByUser": {
                            "id": 3,
                            "firstName": "Xavier"
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          });
        });
      });
    });
  });
});
