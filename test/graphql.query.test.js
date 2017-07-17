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
        ticket1: 2 responses
        ticket2: 1 response
      event2: 1 tier
        tier3: no response
    collective2: 1 event
      event3: no tiers // event3 not declared above due to linting
    collective3: no events
  */

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user1 = u));

  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

  beforeEach(() => models.User.create(utils.data('user3')).tap(u => user3 = u));

  beforeEach(() => models.Collective.create(utils.data('collective1')).tap(g => collective1 = g));

  beforeEach(() => models.Collective.create(utils.data('collective2')).tap(g => collective2 = g));

  beforeEach(() => models.Collective.create(utils.data('collective4')).tap(g => collective3 = g));

  describe('Root query tests', () => {

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event1'), { CreatedByUserId: user1.id, CollectiveId: collective1.id }))
      .tap(e => event1 = e));

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event2'), { CreatedByUserId: user1.id, CollectiveId: collective1.id }))
      .tap(e => event2 = e));

    beforeEach(() => models.Event.create(
      Object.assign({}, utils.data('event2'), { slug: "another-event", CreatedByUserId: user2.id, CollectiveId: collective2.id })));
      //.tap(e => event3 = e)); leaving it here, so setup above makes sense.

    describe('throws an error', () => {

      it('when given only an existing event slug', async () => {
        const query = `
          query getOneEvent {
            Event(eventSlug: "${event1.slug}") {
              id,
              name,
              description
            }
          }
        `;
        const context = { remoteUser: null };
        const result = await graphql(schema, query, null, context);
        expect(result.errors.length).to.equal(1);
        expect(result.errors[0].message).to.equal('Field \"Event\" argument \"collectiveSlug\" of type \"String!\" is required but not provided.');
      })
    })

    describe('returns nothing', () => {

      it('when given a non-existent slug', async () => {
        const query = `
          query getMultipleEvents {
            allEvents(collectiveSlug: "non-existent-slug") {
              id,
              name,
              description
            }
          }
        `;
        const context = { remoteUser: null };
        const result = await graphql(schema, query, null, context);
        expect(result).to.deep.equal({
          data: {
            allEvents: []
          }
        });
      });

      it('when given an existing collective slug when it has no events', async () => {
        const query = `
          query getMultipleEvents {
            allEvents(collectiveSlug: "${collective3.slug}") {
              id,
              name,
              description
            }
          }
        `;
        const context = { remoteUser: null };
        const result = await graphql(schema, query, null, context);
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
            Event(collectiveSlug: "Scouts", eventSlug:"Jan-Meetup") {
              id,
              name,
              description,
              collective {
                slug,
                twitterHandle
              }
              timezone
            }
          }
        `;
        const context = { remoteUser: null };
        const result = await graphql(schema, query, null, context);
        expect(result).to.deep.equal({
          data: {
            Event: {
              description: "January monthly meetup",
              id: 1,
              name: "January meetup",
              timezone: "America/New_York",
              collective: {
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
              allEvents(collectiveSlug: "${collective1.slug}") {
                id,
                name,
                description
              }
            }
          `;
          const context = { remoteUser: null };
          const result = await graphql(schema, query, null, context);
          expect(result).to.deep.equal({
            data: {
              allEvents: [
                {
                  description: "February monthly meetup",
                  id: 2,
                  name: "Feb meetup"               
                },
                {
                  description: "January monthly meetup",
                  id: 1,
                  name: "January meetup"
                }
              ]
            }
          });
        });
      });

      describe('returns multiple events with tiers and responses', () => {

        beforeEach(() => models.Tier.create(
          Object.assign(utils.data('ticket1'), { EventId: event1.id }))
          .tap(t => ticket1 = t));

        beforeEach(() => models.Tier.create(
          Object.assign(utils.data('ticket2'), { EventId: event1.id }))
          .tap(t => ticket2 = t));

        beforeEach(() => models.Tier.create(
          Object.assign(utils.data('ticket1'), { EventId: event2.id }))
          .tap(t => tier3 = t));

        beforeEach(() => models.Response.create(
          Object.assign(utils.data('response1'), { 
            EventId: event1.id, 
            TierId: ticket1.id, 
            CollectiveId: collective1.id, 
            UserId: user2.id,
            confirmedAt: new Date()
          })));

        beforeEach(() => models.Response.create(
          Object.assign(utils.data('response2'), { 
            EventId: event1.id, 
            TierId: ticket1.id, 
            CollectiveId: collective1.id, 
            UserId: user3.id,
            confirmedAt: new Date()
          })));

        // this response shouldn't show up in the query
        // because it's not confirmed
        beforeEach(() => models.Response.create(
          Object.assign(utils.data('response2'), { 
            EventId: event1.id, 
            TierId: ticket1.id, 
            CollectiveId: collective1.id, 
            UserId: user1.id,
            confirmedAt: null
          })));

        beforeEach(() => models.Response.create(
          Object.assign(utils.data('response3'), { 
            EventId: event1.id, 
            TierId: ticket2.id, 
            CollectiveId: collective1.id, 
            UserId: user3.id,
            confirmedAt: new Date()
          })));
        
        it('sends response data', async () => {
          const query = `
            query getMultipleEvents {
              Event(collectiveSlug: "${collective1.slug}", eventSlug: "${event1.slug}") {
                responses {
                  createdAt,
                  status
                }
              }
            }
          `;
          const context = { remoteUser: null };
          const result = await graphql(schema, query, null, context);
          const response = result.data.Event.responses[0];
          expect(response).to.have.property("createdAt");
          expect(response).to.have.property("status");
        });

        it('when given only a collective slug', async () => {
          const query = `
            query getOneEvent {
              allEvents(collectiveSlug: "${collective1.slug}") {
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
                  name
                }
                tiers {
                  id,
                  name,
                  description,
                  maxQuantity,
                  availableQuantity,
                  responses {
                    id,
                    status,
                    description,
                    user {
                      id,
                      name
                    }
                  }
                }
              }
            }
          `;
          const context = { remoteUser: null };
          const result = await graphql(schema, query, null, context);
          expect(result).to.deep.equal({
            data: {
              allEvents: [
                {
                  "id": 2,
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
                    "name": "Phil Mod"
                  },
                  "tiers":[
                    {
                      id: 3,
                      name: tier3.name,
                      description: tier3.description,
                      "maxQuantity": 10,
                      "availableQuantity": 10,
                      responses: []
                    }
                  ]
                },
                {
                  id: 1,
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
                    "name":"Phil Mod"
                  },
                  "tiers": [
                    {
                      "id": 1,
                      "name": ticket1.name,
                      "description":"free tickets for all",
                      "maxQuantity": 10,
                      "availableQuantity": 7,
                      "responses": [
                        {
                          "id": 1,
                          "status": "INTERESTED",
                          "description": "I work on bitcoin",
                          "user": {
                            "id": 2,
                            "name": "Anish Bas"
                          },
                        },
                        {
                          "id": 2,
                          "status": "YES",
                          "description": "I have been working on open source for over a decade",
                          "user": {
                            "id": 3,
                            "name": "Xavier Damman"
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
                      "responses": [
                        {
                          "id": 4,
                          "status": "YES",
                          "description": null,
                          "user": {
                            "id": 3,
                            "name": "Xavier Damman"
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
