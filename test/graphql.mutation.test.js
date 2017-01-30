import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';

import * as utils from './utils';
import models from '../server/models';


describe('Mutation Tests', () => {
  let user1, user2, group1, event1, tier1;

  /* SETUP
    group1: 2 events
      event1: 1 tier
  */

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user1 = u));

  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

  beforeEach(() => models.Group.create(utils.data('group1')).tap(g => group1 = g));

  describe('createResponse tests', () => {

    beforeEach(() => models.Event.create(
      Object.assign(utils.data('event1'), { createdByUserId: user1.id, GroupId: group1.id }))
      .tap(e => event1 = e));

    beforeEach(() => models.Tier.create(
      Object.assign(utils.data('tier1'), { EventId: event1.id }))
      .tap(t => tier1 = t));

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
  });
});
