import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';

import * as utils from './utils';

describe('Query Tests', () => {

  beforeEach(() => utils.loadDB('opencollective_dvl'));

  it('gets the collective info for the collective page', async () => {

    const query = `
    query Collective {
      Collective(slug: "xdamman") {
        id
        slug
        type
        createdByUser {
          id
          firstName,
          email
          __typename
        }
        name
        website
        twitterHandle
        image
        description
        longDescription
        currency
        settings
        tiers {
          id
          slug
          type
          name
          description
          amount
          presets
          interval
          currency
          maxQuantity
          orders {
            id
            publicMessage
            createdAt
            totalTransactions
            fromCollective {
              id
              name
              image
              slug
              twitterHandle
              description
              __typename
            }
            __typename
          }
          __typename
        }
        memberships {
          id
          createdAt
          role
          collective {
            id
            slug
            description
            image
            stats {
              backers
              yearlyBudget
            }
            __typename
          }
          __typename
        }
        members {
          id
          createdAt
          role
          member {
            id
            name
            image
            slug
            twitterHandle
            description
            __typename
          }
          __typename
        }
        __typename
      }
    }`;

    const result = await graphql(schema, query, null, context);
    result.errors && console.error(result.errors);
    expect(result.errors).to.not.exist;
    const userCollective = result.data.Collective;
    expect(userCollective.twitterHandle).to.equal('xdamman');
    expect(userCollective.website).to.equal('http://xdamman.com');
    expect(userCollective.memberships).to.have.length(4);
    expect(userCollective.memberships[0].role).to.equal('BACKER');
    expect(userCollective.memberships[1].role).to.equal('ADMIN');
    expect(userCollective.memberships[2].role).to.equal('BACKER');
    expect(userCollective.memberships[3].role).to.equal('ADMIN');
    expect(userCollective.memberships[0].collective.slug).to.equal('apex');
    expect(userCollective.createdByUser.firstName).to.equal('Xavier');
    expect(userCollective.createdByUser.email).to.be.null;
    expect(userCollective.memberships[0].collective.stats).to.deep.equal({
      backers: 23,
      yearlyBudget: 329378
    });
  });

});