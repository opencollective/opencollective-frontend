import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';

import * as utils from './utils';
import models from '../server/models';


describe.only('Mutation Tests', () => {
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

  describe('createResponse tests', () => {

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event1'), { createdByUserId: user1.id, GroupId: group1.id }))
      .tap(e => event1 = e));

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event2'), { createdByUserId: user1.id, GroupId: group1.id }))
      .tap(e => event2 = e));

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event2'), { createdByUserId: user2.id, GroupId: group2.id })));
      //.tap(e => event3 = e)); leaving it here, so setup above makes sense.

    beforeEach(() => models.Tier.create(
      Object.assign(utils.data('tier1'), { EventId: event1.id }))
      .tap(t => tier1 = t));

    beforeEach(() => models.Tier.create(
      Object.assign(utils.data('tier2'), { EventId: event1.id }))
      .tap(t => tier2 = t));

    beforeEach(() => models.Tier.create(
      Object.assign(utils.data('tier1'), { EventId: event2.id }))
      .tap(t => tier3 = t));

    describe('throws an error', () => {

      it('when missing all required fields', async () => {
        const query = `
          mutation createResponse {
            createResponse(description:"blah") {
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
        const result = await graphql(schema, query);
        expect(result.errors.length).to.equal(6);
        expect(result.errors[0].message).to.contain('userEmail');
        expect(result.errors[1].message).to.contain('collectiveSlug');
        expect(result.errors[2].message).to.contain('tierId');
        expect(result.errors[3].message).to.contain('eventSlug');
        expect(result.errors[4].message).to.contain('quantity');
        expect(result.errors[5].message).to.contain('status');
      });

      describe('when collective/event/tier doesn\'t exist', () => {
        
        it('when collective doesn\'t exist', async () => {
          const query = `
            mutation createResponse {
              createResponse(userEmail:"${user1.email}", collectiveSlug:"doesNotExist", eventSlug:"${event1.slug}", tierId:1, status:"YES", quantity:1) {
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
          const result = await graphql(schema, query);
          expect(result.errors.length).to.equal(1);
          expect(result.errors[0].message).to.equal('No tier found with tierId:1 for eventSlug:jan-meetup in collectiveSlug:doesNotExist');
        });

        it('when event doesn\'t exist', async () => {
          const query = `
            mutation createResponse {
              createResponse(userEmail:"user@email.com", collectiveSlug:"${group1.slug}", eventSlug:"doesNotExist", tierId:1, status:"YES", quantity:1) {
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
          const result = await graphql(schema, query);
          expect(result.errors.length).to.equal(1);
          expect(result.errors[0].message).to.equal('No tier found with tierId:1 for eventSlug:doesNotExist in collectiveSlug:scouts');
        });

        it('when tier doesn\'t exist', async () => {
          const query = `
            mutation createResponse {
              createResponse(userEmail:"user@email.com", collectiveSlug:"${group1.slug}", eventSlug:"${event1.slug}", tierId:1002, status:"YES", quantity:1) {
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
          const result = await graphql(schema, query);
          expect(result.errors.length).to.equal(1);
          expect(result.errors[0].message).to.equal(`No tier found with tierId:1002 for eventSlug:${event1.slug} in collectiveSlug:${group1.slug}`);
        });
      });

      describe('after checking ticket quantity', () => {
        it('and if not enough are available', async () => {
          const query = `
            mutation createResponse {
              createResponse(userEmail:"user@email.com", collectiveSlug:"${group1.slug}", eventSlug:"${event1.slug}", tierId:1, status:"YES", quantity:101) {
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
          const result = await graphql(schema, query);
          expect(result.errors[0].message).to.equal(`No more tickets left for ${tier1.name}`);
        });
      });
    });

    describe('creates a response', () => {
      
      it('from an existing user', async () => {
        const query = `
          mutation createResponse {
            createResponse(userEmail:"${user2.email}", collectiveSlug:"${group1.slug}", eventSlug:"${event1.slug}", tierId:1, status:"YES", quantity:2) {
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
        const result = await graphql(schema, query);
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
                "email": "xdam@opencollective.com",
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
            createResponse(userEmail:"newuser@email.com", collectiveSlug:"${group1.slug}", eventSlug:"${event1.slug}", tierId:1, status:"YES", quantity:2) {
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
        const result = await graphql(schema, query);
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
                "email": "newuser@email.com",
                "id": 4
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
  });
});
