import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';
import sinon from 'sinon';
import { appStripe } from '../server/gateways/stripe';
import stripeMock from './mocks/stripe';

import * as utils from './utils';

describe('graphql.collective.test.js', () => {
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
            stats {
            totalTransactions
            }
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
        stats {
          backers
          sponsors
          yearlyBudget
          topExpenses
          topFundingSources
        }
        __typename
      }
    }`;

    const result = await utils.graphqlQuery(query, { slug: "apex" });
    result.errors && console.error(result.errors);
    expect(result.errors).to.not.exist;
    const collective = result.data.Collective;
    expect(collective.website).to.equal('http://apex.run');
    expect(collective.members).to.have.length(29);
    const memberships = collective.members;
    memberships.sort((a, b) => a.id - b.id)
    expect(memberships[0].role).to.equal('HOST');
    expect(memberships[1].role).to.equal('ADMIN');
    expect(memberships[2].role).to.equal('ADMIN');
    expect(memberships[3].role).to.equal('BACKER');
    expect(memberships[4].role).to.equal('BACKER');
    expect(memberships[5].role).to.equal('BACKER');
    expect(memberships[6].role).to.equal('BACKER');
    expect(memberships[3].member.slug).to.equal('xdamman');
    expect(collective.createdByUser.email).to.be.null;
    expect(collective.tiers).to.have.length(2);
    expect(collective.stats).to.deep.equal({
      backers: 25,
      sponsors: 1,
      yearlyBudget: 330620,
      topExpenses: {"byCategory":[{"category":"Engineering","count":6,"totalExpenses":324729}],"byCollective":[{"slug":"tjholowaychuk","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/25254v3s400_acc93f90-0085-11e7-951e-491568b1a942.jpeg","name":"TJ Holowaychuk","totalExpenses":-170914},{"slug":"opensource","image":"https://res.cloudinary.com/opencollective/image/upload/v1479171624/OSC_fwut73.png","name":"Open Source Collective","totalExpenses":-110000}]},
      topFundingSources: {"byCollective":[{"slug":"pubnub","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/pubnublogopng_38ab9250-d2c4-11e6-8ba3-b7985935397d.png","name":"PubNub","totalDonations":147560},{"slug":"harlow_ward","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/168a47c0-d41d-11e6-b711-1589373fcf88.jpg","name":"Harlow Ward","totalDonations":38646},{"slug":"breck7","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/bb14acd098624944ac160008b79fb9e5_30e998d0-619b-11e7-9eab-c17f21ef8eb7.png","name":"Breck Yunits","totalDonations":26040}],"byCollectiveType":[{"type":"USER","totalDonations":163077}]}
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