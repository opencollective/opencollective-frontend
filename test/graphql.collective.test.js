import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import models from '../server/models';
import { graphql } from 'graphql';
import sinon from 'sinon';
import { appStripe } from '../server/gateways/stripe';
import stripeMock from './mocks/stripe';

import * as utils from './utils';

describe('Query Tests', () => {
  let pubnubCollective;

  beforeEach(() => utils.loadDB('opencollective_dvl'));

  beforeEach(() => models.Collective.findOne({ where: { slug: 'pubnub' }}).then(c => pubnubCollective = c));

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
        memberOf {
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
        paymentMethods {
          id
          identifier
          service
          brand
        }
        connectedAccounts {
          id
          service
        }
        __typename
      }
    }`;

    const result = await graphql(schema, query, null, utils.makeRequest());
    result.errors && console.error(result.errors);
    expect(result.errors).to.not.exist;
    const userCollective = result.data.Collective;
    expect(userCollective.twitterHandle).to.equal('xdamman');
    expect(userCollective.website).to.equal('http://xdamman.com');
    expect(userCollective.memberOf).to.have.length(4);
    const memberships = userCollective.memberOf;
    memberships.sort((a, b) => a.id - b.id)
    expect(memberships[0].role).to.equal('ADMIN');
    expect(memberships[1].role).to.equal('BACKER');
    expect(memberships[2].role).to.equal('ADMIN');
    expect(memberships[3].role).to.equal('BACKER');
    expect(memberships[1].collective.slug).to.equal('apex');
    expect(userCollective.createdByUser.firstName).to.equal('Xavier');
    expect(userCollective.createdByUser.email).to.be.null;
    expect(memberships[1].collective.stats).to.deep.equal({
      backers: 25,
      yearlyBudget: 338470
    });
  });

  it('edits members', async () => {

    const pubnubAdmin = await models.User.createUserWithCollective({ email: 'admin@pubnub.com'});
    const adminMembership = await models.Member.create({
      CreatedByUserId: pubnubAdmin.id,
      MemberCollectiveId: pubnubAdmin.CollectiveId,
      CollectiveId: pubnubCollective.id,
      role: 'ADMIN'
    });

    const collective = {
      "id": pubnubCollective.id,
      "type": "ORGANIZATION",
      "slug": "pubnub",
      "name": "PubNub ",
      "description": null,
      "longDescription": null,
      "currency": "USD",
      "image": "https://opencollective-production.s3-us-west-1.amazonaws.com/pubnublogopng_38ab9250-d2c4-11e6-8ba3-b7985935397d.png",
      "members": [
        {
          "id": adminMembership.id,
          "role": "ADMIN",
          "member": {
            "name": "Xavier Damman",
            "email": null
          }
        },
        {
          "role": "MEMBER",
          "member": {
            "name": "member1",
            "email": "member1@hail.com"
          }
        }
      ],
      "location": {}
    }

    const query = `
    mutation editCollective {
      editCollective(collective: ${utils.stringify(collective)}) {
        id,
        slug,
        members {
          id
          role
          member {
            name
            createdByUser {
              id
            }
            ... on User {
              email
            }
          }
        }
      }
    }
    `;

    const res = await graphql(schema, query, null, utils.makeRequest(pubnubAdmin));
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    const members = res.data.editCollective.members;
    expect(members.length).to.equal(2);
    expect(members[1].role).to.equal('MEMBER');
    expect(members[1].member.name).to.equal('member1');
    expect(members[1].member.email).to.equal('member1@hail.com');
    
    const res2 = await graphql(schema, query, null, utils.makeRequest({ id: members[1].member.createdByUser.id }));
    expect(res2.errors).to.exist;
    expect(res2.errors[0].message).to.equal(`You must be logged in as an admin or as the host of this organization collective to edit it`);
  })

  it('edit payment methods', async () => {
    let query, res, paymentMethods;

    sinon.stub(appStripe.customers, 'create', () => Promise.resolve(stripeMock.customers.create));

    const collective = {
      id: pubnubCollective.id,
      paymentMethods: [{
        identifier: '4242',
        brand: 'VISA',
        funding: 'credit',
        service: 'stripe',
        token: 'token-xxxx',
        expMonth: 1,
        expYear: 2022
      }]
    }

    query = `
    mutation editCollective {
      editCollective(collective: ${utils.stringify(collective)}) {
        id,
        slug,
        paymentMethods {
          id
          uuid
          identifier
        }
      }
    }
    `;

    const pubnubAdmin = await models.User.createUserWithCollective({ email: 'admin@pubnub.com'});
    await models.Member.create({
      CreatedByUserId: pubnubAdmin.id,
      MemberCollectiveId: pubnubAdmin.CollectiveId,
      CollectiveId: pubnubCollective.id,
      role: 'ADMIN'
    });

    res = await graphql(schema, query, null, utils.makeRequest(pubnubAdmin));
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    paymentMethods = res.data.editCollective.paymentMethods;
    expect(paymentMethods).to.have.length(1);
    expect(paymentMethods[0].uuid).to.have.length(36);
    expect(paymentMethods[0].identifier).to.equal('4242');

    // Adds another credit card
    collective.paymentMethods[0].id = paymentMethods[0].id;
    collective.paymentMethods.push({
      identifier: '1212',
      service: 'stripe'
    });

    query = `
    mutation editCollective {
      editCollective(collective: ${utils.stringify(collective)}) {
        id,
        slug,
        paymentMethods {
          id
          uuid
          identifier
        }
      }
    }
    `;

    res = await graphql(schema, query, null, utils.makeRequest(pubnubAdmin));
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    paymentMethods = res.data.editCollective.paymentMethods;
    expect(paymentMethods).to.have.length(2);
    expect(paymentMethods[0].uuid).to.have.length(36);
    expect(paymentMethods[0].identifier).to.equal('4242');
    expect(paymentMethods[1].uuid).to.have.length(36);
    expect(paymentMethods[1].identifier).to.equal('1212');


    query = `
    query Collective {
      Collective(slug: "pubnub") {
        paymentMethods {
          uuid,
          identifier
        }
      }
    }`;

    res = await graphql(schema, query, null, utils.makeRequest(pubnubAdmin));
    res.errors && console.error(res.errors[0]);
    paymentMethods = res.data.Collective.paymentMethods;
    expect(paymentMethods).to.have.length(2);
    expect(paymentMethods[0].uuid).to.have.length(36);
    expect(paymentMethods[0].identifier).to.equal('4242');
    expect(paymentMethods[1].uuid).to.have.length(36);
    expect(paymentMethods[1].identifier).to.equal('1212');

    // Should not return the credit cards if not logged in;
    res = await graphql(schema, query, null, utils.makeRequest(null));
    res.errors && console.error(res.errors[0]);
    expect(res.errors).to.not.exist;
    paymentMethods = res.data.Collective.paymentMethods;
    expect(paymentMethods).to.have.length(0);

    // Shouldn't return the credit cards if not logged in as an admin of the collective
    res = await graphql(schema, query, null, utils.makeRequest({id: 2, CollectiveId: 793 }));
    res.errors && console.error(res.errors[0]);
    expect(res.errors).to.not.exist;
    paymentMethods = res.data.Collective.paymentMethods;
    expect(paymentMethods).to.have.length(0);

    appStripe.customers.create.restore();
  })
});