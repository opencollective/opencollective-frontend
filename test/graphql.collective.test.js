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
    query Collective($slug: String!) {
      Collective(slug: $slug) {
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
          name
          service
        }
        connectedAccounts {
          id
          service
        }
        __typename
      }
    }`;

    const result = await utils.graphqlQuery(query, { slug: "xdamman" });
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
    mutation editCollective($collective: CollectiveInputType!) {
      editCollective(collective: $collective) {
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
    const res = await utils.graphqlQuery(query, { collective }, pubnubAdmin);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    const members = res.data.editCollective.members;
    expect(members.length).to.equal(2);
    expect(members[1].role).to.equal('MEMBER');
    expect(members[1].member.name).to.equal('member1');
    expect(members[1].member.email).to.equal('member1@hail.com');
    
    const member = await models.User.findById(members[1].member.createdByUser.id);
    const res2 = await utils.graphqlQuery(query, { collective }, member);
    expect(res2.errors).to.exist;
    expect(res2.errors[0].message).to.equal(`You must be logged in as an admin or as the host of this organization collective to edit it`);
  })

  it('edit payment methods', async () => {
    let query, res, paymentMethods;

    sinon.stub(appStripe.customers, 'create', () => Promise.resolve(stripeMock.customers.create));

    const collective = {
      id: pubnubCollective.id,
      paymentMethods: [{
        service: 'stripe',
        name: '4242',
        token: 'tok_123456781234567812345678',
        data: {
          brand: 'VISA',
          funding: 'credit',
          expMonth: 1,
          expYear: 2022
        }
      }]
    }

    query = `
    mutation editCollective($collective: CollectiveInputType!) {
      editCollective(collective: $collective) {
        id,
        slug,
        paymentMethods {
          id
          uuid
          name
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

    res = await utils.graphqlQuery(query, { collective }, pubnubAdmin);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    paymentMethods = res.data.editCollective.paymentMethods;
    expect(paymentMethods).to.have.length(1);
    expect(paymentMethods[0].uuid).to.have.length(36);
    expect(paymentMethods[0].name).to.equal('4242');

    // Adds another credit card
    collective.paymentMethods[0].id = paymentMethods[0].id;
    collective.paymentMethods.push({
      name: '1212',
      service: 'stripe',
      token: 'tok_123456781234567812345678'
    });

    query = `
    mutation editCollective($collective: CollectiveInputType!) {
      editCollective(collective: $collective) {
        id,
        slug,
        paymentMethods {
          id
          uuid
          name
        }
      }
    }
    `;

    res = await utils.graphqlQuery(query, { collective }, pubnubAdmin);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    paymentMethods = res.data.editCollective.paymentMethods;
    expect(paymentMethods).to.have.length(2);
    expect(paymentMethods[0].uuid).to.have.length(36);
    expect(paymentMethods[0].name).to.equal('4242');
    expect(paymentMethods[1].uuid).to.have.length(36);
    expect(paymentMethods[1].name).to.equal('1212');


    query = `
    query Collective($slug: String!) {
      Collective(slug: $slug) {
        paymentMethods {
          uuid,
          name
        }
      }
    }`;

    res = await utils.graphqlQuery(query, { slug: 'pubnub' }, pubnubAdmin);
    res.errors && console.error(res.errors[0]);
    paymentMethods = res.data.Collective.paymentMethods;
    expect(paymentMethods).to.have.length(2);
    expect(paymentMethods[0].uuid).to.have.length(36);
    expect(paymentMethods[0].name).to.equal('4242');
    expect(paymentMethods[1].uuid).to.have.length(36);
    expect(paymentMethods[1].name).to.equal('1212');

    // Should not return the credit cards if not logged in;
    res = await utils.graphqlQuery(query, { slug: 'pubnub' });
    res.errors && console.error(res.errors[0]);
    expect(res.errors).to.not.exist;
    paymentMethods = res.data.Collective.paymentMethods;
    expect(paymentMethods).to.have.length(0);

    // Shouldn't return the credit cards if not logged in as an admin of the collective
    const member = await models.User.findById(2);
    res = await utils.graphqlQuery(query, { slug: 'pubnub' }, member);
    res.errors && console.error(res.errors[0]);
    expect(res.errors).to.not.exist;
    paymentMethods = res.data.Collective.paymentMethods;
    expect(paymentMethods).to.have.length(0);

    appStripe.customers.create.restore();
  })
});