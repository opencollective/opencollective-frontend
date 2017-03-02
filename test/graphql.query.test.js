import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';

import * as utils from './utils';
import models from '../server/models';


describe('Query Tests', () => {
  let user1, user2, user3, group1, group2, group3, event1, event2, tier1, tier2, tier3;

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

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user1 = u));

  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

  beforeEach(() => models.User.create(utils.data('user3')).tap(u => user3 = u));

  beforeEach(() => models.Group.create(utils.data('group1')).tap(g => group1 = g));

  beforeEach(() => models.Group.create(utils.data('group2')).tap(g => group2 = g));

  beforeEach(() => models.Group.create(utils.data('group4')).tap(g => group3 = g));

  describe('Root query tests', () => {

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event1'), { createdByUserId: user1.id, GroupId: group1.id }))
      .tap(e => event1 = e));

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event2'), { createdByUserId: user1.id, GroupId: group1.id }))
      .tap(e => event2 = e));

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event2'), { createdByUserId: user2.id, GroupId: group2.id })));
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
        const result = await graphql(schema, query);
        expect(result.errors.length).to.equal(1);
        expect(result.errors[0].message).to.equal('Field \"Event\" argument \"collectiveSlug\" of type \"String!\" is required but not provided.');
      })
    })

    describe('returns nothing', () => {

      it('when given a non-existent slug', async () => {
        const query = `
          query getMultipleEvents {
            allEventsForCollective(collectiveSlug: "non-existent-slug") {
              id,
              name,
              description
            }
          }
        `;
        const result = await graphql(schema, query);
        expect(result).to.deep.equal({
          data: {
            allEventsForCollective: []
          }
        });
      });

      it('when given an existing collective slug when it has no events', async () => {
        const query = `
          query getMultipleEvents {
            allEventsForCollective(collectiveSlug: "${group3.slug}") {
              id,
              name,
              description
            }
          }
        `;
        const result = await graphql(schema, query);
        expect(result).to.deep.equal({
          data: {
            allEventsForCollective: []
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
              description
            }
          }
        `;
        const result = await graphql(schema, query);
        expect(result).to.deep.equal({
          data: {
            Event: {
              description: "January monthly meetup",
              id: 1,
              name: "January meetup",
            }            
          }
        });
      });

      describe('returns multiple events', () => {
        
        it('when given only a collective slug', async () => {
          const query = `
            query getMultipleEvents {
              allEventsForCollective(collectiveSlug: "${group1.slug}") {
                id,
                name,
                description
              }
            }
          `;
          const result = await graphql(schema, query);
          expect(result).to.deep.equal({
            data: {
              allEventsForCollective: [
                {
                  description: "January monthly meetup",
                  id: 1,
                  name: "January meetup"
                },
                {
                  description: "February monthly meetup",
                  id: 2,
                  name: "Feb meetup"               
                }
              ]
            }
          });
        });
      });

      describe('returns multiple events with tiers and responses', () => {

        beforeEach(() => models.Tier.create(
          Object.assign(utils.data('tier1'), { EventId: event1.id }))
          .tap(t => tier1 = t));

        beforeEach(() => models.Tier.create(
          Object.assign(utils.data('tier2'), { EventId: event1.id }))
          .tap(t => tier2 = t));

        beforeEach(() => models.Tier.create(
          Object.assign(utils.data('tier1'), { EventId: event2.id }))
          .tap(t => tier3 = t));

        beforeEach(() => models.Response.create(
          Object.assign(utils.data('response1'), { 
            EventId: event1.id, 
            TierId: tier1.id, 
            GroupId: group1.id, 
            UserId: user2.id,
            confirmedAt: new Date()
          })));

        beforeEach(() => models.Response.create(
          Object.assign(utils.data('response2'), { 
            EventId: event1.id, 
            TierId: tier1.id, 
            GroupId: group1.id, 
            UserId: user3.id,
            confirmedAt: new Date()
          })));

        // this response shouldn't show up in the query
        // because it's not confirmed
        beforeEach(() => models.Response.create(
          Object.assign(utils.data('response2'), { 
            EventId: event1.id, 
            TierId: tier1.id, 
            GroupId: group1.id, 
            UserId: user1.id,
            confirmedAt: null
          })));

        beforeEach(() => models.Response.create(
          Object.assign(utils.data('response3'), { 
            EventId: event1.id, 
            TierId: tier2.id, 
            GroupId: group1.id, 
            UserId: user3.id,
            confirmedAt: new Date()
          })));
        
        it('when given only a collective slug', async () => {
          const query = `
            query getOneEvent {
              allEventsForCollective(collectiveSlug: "${group1.slug}") {
                id,
                name,
                description,
                location,
                address,
                backgroundImage,
                lat,
                long,
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
          const result = await graphql(schema, query);
          expect(result).to.deep.equal({
            data: {
              allEventsForCollective: [
                {
                  id: 1,
                  name: "January meetup",
                  "description":"January monthly meetup",
                  "location": "Balanced NYC",
                  "address": "547 Broadway, NY 10012",
                  "backgroundImage": "http://opencollective.com/backgroundimage.png",
                  "lat": 39.807222,
                  "long": -76.984722,
                  "createdByUser": {
                    "id":1,
                    "name":"Phil Mod"
                  },
                  "tiers": [
                    {
                      "id": 1,
                      "name": tier1.name,
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
                      "name": tier2.name,
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
                },
                {
                  "id": 2,
                  "name": "Feb meetup",
                  "description": "February monthly meetup",
                  "address": "505 Broadway, NY 10012",
                  "backgroundImage": null,
                  "location": "Puck Fair",
                  "lat": null,
                  "long": null,
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
                }
              ]
            }
          });
        });
      });
    });
  });
});
