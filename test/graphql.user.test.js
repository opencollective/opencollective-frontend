import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';

import * as utils from './utils';
import models from '../server/models';


describe('Query Tests', () => {
  let user1, user2, user3, group1, group2, group3;

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
    })
  });
});
