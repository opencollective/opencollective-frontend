import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/schema';
import { graphql } from 'graphql';

import * as utils from './utils';
import models from '../server/models';


describe.only('Query Tests', () => {
  let host, member, otherUser, group1, group2, group3, event1, event2, event3, tier1, tier2, tier3;

  /* SETUP
    group1: 2 events
      event1: 2 tiers
        tier1: 2 responses
        tier2: 1 response
      event2: 1 tier
        tier3: no response
    group2: 1 event
      event3: no tiers
    group3: no events
  */

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(utils.data('user1')).tap(u => host = u));

  beforeEach(() => models.User.create(utils.data('user2')).tap(u => member = u));

  beforeEach(() => models.User.create(utils.data('user3')).tap(u => otherUser = u));

  beforeEach(() => models.Group.create(utils.data('group1')).tap(g => group1 = g));

  beforeEach(() => models.Group.create(utils.data('group2')).tap(g => group2 = g));

  beforeEach(() => models.Group.create(utils.data('group4')).tap(g => group3 = g));

  describe('Root query tests', () => {

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event1'), { CreatorId: member.id, GroupId: group1.id }))
      .tap(e => event1 = e));

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event2'), { CreatorId: member.id, GroupId: group1.id }))
      .tap(e => event2 = e));

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event2'), { CreatorId: host.id, GroupId: group2.id }))
      .tap(e => event2 = e));

    describe('throws an error', () => {

      it('when given only an existing event slug', async () => {
        const query = `
          query getOneEvent {
            getEvents(slug: "jan-meetup") {
              id,
              name,
              description
            }
          }
        `;
        const result = await graphql(schema, query);
        expect(result.errors.length).to.equal(1);
        expect(result.errors[0].message).to.equal('Field \"getEvents\" argument \"groupSlug\" of type \"String!\" is required but not provided.');
      })
    })

    describe('returns nothing', () => {

      it('when given a non-existent slug', async () => {
        const query = `
          query getOneEvent {
            getEvents(groupSlug: "non-existent-slug") {
              id,
              name,
              description
            }
          }
        `;
        const result = await graphql(schema, query);
        expect(result).to.deep.equal({
          data: {
            getEvents: []
          }
        });
      });

      it('when given an existing group slug when it has no events', async () => {
        const query = `
          query getOneEvent {
            getEvents(groupSlug: "meetups") {
              id,
              name,
              description
            }
          }
        `;
        const result = await graphql(schema, query);
        expect(result).to.deep.equal({
          data: {
            getEvents: []
          }
        });
      });
    });

    describe('returns event(s)', () => {

      it('when given an event slug and groupSlug', async () => {
        const query = `
          query getOneEvent {
            getEvents(groupSlug: "scouts", slug:"jan-meetup") {
              id,
              name,
              description
            }
          }
        `;
        const result = await graphql(schema, query);
        expect(result).to.deep.equal({
          data: {
            getEvents: [
              {
                description: "January monthly meetup",
                id: 1,
                name: "January meetup",
              }
            ]
          }
        });
      });

      describe('returns multiple events', () => {
        
        it('when given only a group slug', async () => {
          const query = `
            query getOneEvent {
              getEvents(groupSlug: "scouts") {
                id,
                name,
                description
              }
            }
          `;
          const result = await graphql(schema, query);
          expect(result).to.deep.equal({
            data: {
              getEvents: [
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

      describe('returns multiple events with associations', () => {

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
            UserId: host.id 
          })));

        beforeEach(() => models.Response.create(
          Object.assign(utils.data('response2'), { 
            EventId: event1.id, 
            TierId: tier1.id, 
            GroupId: group1.id, 
            UserId: otherUser.id 
          })));

        beforeEach(() => models.Response.create(
          Object.assign(utils.data('response3'), { 
            EventId: event1.id, 
            TierId: tier2.id, 
            GroupId: group1.id, 
            UserId: otherUser.id 
          })));
        
        it('when given only a group slug', async () => {
          const query = `
            query getOneEvent {
              getEvents(groupSlug: "scouts") {
                id,
                name,
                description,
                createdBy {
                  id,
                  name
                }
                tiers {
                  id,
                  name,
                  description,
                  responses {
                    id,
                    status,
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
          console.log(result);
          expect(result).to.deep.equal({
            data: {
              getEvents: [
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
    });
  });
});
