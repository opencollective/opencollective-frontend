import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';
import sinon from 'sinon';
import { appStripe } from '../server/paymentProviders/stripe/gateway';
import stripeMock from './mocks/stripe';

import * as utils from './utils';

describe('graphql.collective.test.js', () => {
  let pubnubCollective, pubnubAdmin, adminMembership;

  before('load db', () => utils.loadDB('opencollective_dvl'));
  before('fetch pubnub', () => models.Collective.findOne({ where: { slug: 'pubnub' }}).then(c => pubnubCollective = c));
  before('create admin user with collective', () => models.User.createUserWithCollective({ name: "PubNub Administrator", email: 'admin@pubnub.com'}).then(c => pubnubAdmin = c));
  before('create member', () => models.Member.create({
      CreatedByUserId: pubnubAdmin.id,
      MemberCollectiveId: pubnubAdmin.CollectiveId,
      CollectiveId: pubnubCollective.id,
      role: 'ADMIN'
    }).then(m => adminMembership = m));

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
          backers {
            all
            users
            organizations
          }
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
      backers: { all: 26, users: 25, organizations: 1 },
      yearlyBudget: 214738,
      topExpenses: {"byCategory":[{"category":"Engineering","count":7,"totalExpenses":380829}],"byCollective":[{"slug":"tjholowaychuk","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/25254v3s400_acc93f90-0085-11e7-951e-491568b1a942.jpeg","name":"TJ Holowaychuk","totalExpenses":-339120}]},
      topFundingSources: {"byCollective":[{"slug":"pubnub","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/pubnublogopng_38ab9250-d2c4-11e6-8ba3-b7985935397d.png","name":"PubNub","totalDonations":147560},{"slug":"harlow_ward","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/168a47c0-d41d-11e6-b711-1589373fcf88.jpg","name":"Harlow Ward","totalDonations":42940},{"slug":"breck7","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/bb14acd098624944ac160008b79fb9e5_30e998d0-619b-11e7-9eab-c17f21ef8eb7.png","name":"Breck Yunits","totalDonations":34720}],"byCollectiveType":[{"type":"USER","totalDonations":192031}]}
      });
  });

  it('gets the host collective for an event', async () => {
    const query = `
      query Collective($slug: String!) {
        Collective(slug: $slug) {
          host {
            id
            slug
          }
        }
      }
    `;
    const result = await utils.graphqlQuery(query, { slug: "meetup-5" });
    result.errors && console.error(result.errors);
    expect(result.errors).to.not.exist;
    expect(result.data.Collective.host.id).to.equal(9802);
    expect(result.data.Collective.host.slug).to.equal("brusselstogether");
  });

  it('gets the expense stats across all hosted collectives', async () => {
    const query = `
    query Collective($slug: String!) {
      Collective(slug: $slug) {
        id
        slug
        stats {
          collectives
          expenses {
            pending
            approved
            paid
          }
        }
        collectives {
          id
          slug
          stats {
            expenses {
              all
              paid
              pending
              rejected
              approved
            }
          }
        }
      }
    }
    `;
    const result = await utils.graphqlQuery(query, { slug: "brusselstogether" });
    result.errors && console.error(result.errors);
    expect(result.errors).to.not.exist;
    const collectives = result.data.Collective.collectives;
    expect(collectives.sort((a, b) => a.id - b.id)).to.deep.equal([
      {
        "id": 207,
        "slug": "brusselstogether-collective",
        "stats": {
          "expenses": {
            "all": 18,
            "paid": 15,
            "pending": 0,
            "rejected": 3,
            "approved": 0
          }
        }
      },
      {
        "id": 407,
        "slug": "veganizerbxl",
        "stats": {
          "expenses": {
            "all": 15,
            "paid": 10,
            "pending": 0,
            "rejected": 4,
            "approved": 1
          }
        }
      }
    ]);
  })

  it('gets the members by type with stats, transactions and orders', async () => {
    const query = `
    query Collective($slug: String!, $type: String) {
      Collective(slug: $slug) {
        members(type: $type, limit: 10, offset: 1) {
          id
          stats {
            totalDonations
          }
          transactions {
            id
            amount
          }
          orders {
            id
            totalAmount
          }
          member {
            id
            type
            slug
          }
        }
      }
    }
    `;
    const fetchMembersByType = async (type) => {
      const result = await utils.graphqlQuery(query, { slug: "brusselstogether-collective", type });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      return result.data.Collective.members;
    }
    /**
     * xdamman: note: members[0] has a transaction without an order.
     * It's a transaction for a ticket and the order references the CollectiveId of the event
     * but the transaction references the CollectiveId of the parent collective
     * a bug from the v2 migration
     */
    const members = await fetchMembersByType('USER');
    expect(members[1].transactions).to.have.length(20);
    expect(members[1].transactions[0].amount).to.equal(1000);
    expect(members[1].orders).to.have.length(2);
    expect(members[1].stats.totalDonations).to.equal(514000);
    expect(members).to.have.length(10);
    expect(await fetchMembersByType('ORGANIZATION')).to.have.length(3);
  });

  describe("allMembers query", () => {

    const allMembersQuery = `
    query allMembers($collectiveSlug: String, $memberCollectiveSlug: String, $orderBy: String, $role: String, $type: String) {
      allMembers(collectiveSlug: $collectiveSlug, memberCollectiveSlug: $memberCollectiveSlug, role: $role, type: $type, limit: 10, offset: 1, orderBy: $orderBy) {
        id
        role
        stats {
          totalDonations
        }
        collective {
          id
          slug
        }
        member {
          id
          slug
          ... on User {
            email
          }
        }
      }
    }
    `;

    it('gets the members by collectiveSlug without email', async () => {
      const result = await utils.graphqlQuery(allMembersQuery, { collectiveSlug: "brusselstogether-collective" });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      expect(members).to.have.length(10);
      expect(members[0].collective.slug).to.equal('brusselstogether-collective');
      expect(members[0].member.slug).to.equal('alexandrasaveljeva');
      members.map(m => {
        expect(m.member.email).to.be.null;
      });
    });

    it('gets the user members by collectiveSlug with email', async () => {
      const hostAdmin = await models.User.findById(2); // xdamman (admin of brusselstogether host)
      const result = await utils.graphqlQuery(allMembersQuery, { collectiveSlug: "veganizerbxl", type: "USER" }, hostAdmin);
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      members.map(m => {
        expect(m.member.email).to.not.be.null;
      });
    });

    it('gets the user members by collectiveSlug without email if logged in as admin of another host', async () => {
      const hostAdmin = await models.User.findById(30); // pia (admin of a host but not of brusselstogether host)
      const result = await utils.graphqlQuery(allMembersQuery, { collectiveSlug: "veganizerbxl", type: "USER" }, hostAdmin);
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      members.map(m => {
        expect(m.member.email).to.be.null;
      });
    });

    it('gets the members by memberCollectiveSlug by role', async () => {
      const result = await utils.graphqlQuery(allMembersQuery, { memberCollectiveSlug: "xdamman", role: "ADMIN" });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      expect(members[0].role).to.equal('ADMIN');
      expect(members[0].collective.slug).to.equal('brusselstogether');
      expect(members[0].member.slug).to.equal('xdamman');
      expect(members).to.have.length(10);
    });

    it('gets the members by memberCollectiveSlug sorted by totalDonations', async () => {
      const result = await utils.graphqlQuery(allMembersQuery, { memberCollectiveSlug: "xdamman", orderBy: "totalDonations" });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      expect(members[0].collective.slug).to.equal('brusselstogether-collective');
      expect(members[0].member.slug).to.equal('xdamman');
      expect(members).to.have.length(10);
    });

    it('gets the members by memberCollectiveSlug sorted by balance', async () => {
      const result = await utils.graphqlQuery(allMembersQuery, { memberCollectiveSlug: "piamancini", orderBy: "balance" });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      expect(members[0].collective.slug).to.equal('opensource');
      expect(members[0].member.slug).to.equal('piamancini');
      expect(members).to.have.length(7);
    });

  });

  it('edits members', async () => {

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