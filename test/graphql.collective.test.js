import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';

import models from '../server/models';
import cache from '../server/lib/cache';
import * as expenses from '../server/graphql/v1/mutations/expenses';

import * as utils from './utils';
import * as store from './stores';

describe('graphql.collective.test.js', () => {
  beforeEach(async () => {
    await utils.resetTestDB();
  });

  it('should display a nice error message if collective is not found', async () => {
    // Given the following query
    const query = `query Collective($slug: String) {
      Collective(slug: $slug) { id slug } }`;
    // When a collective that doesn't exist is retrieved
    const result = await utils.graphqlQuery(query, { slug: 'apex' });
    // Than we're supposed to see some errors
    expect(result.errors).to.exist;
    expect(result.errors[0].message).to.equal('No collective found with slug apex');
  });

  it("won't generate an error if told not to", async () => {
    // Given the following query
    const query = `query Collective($slug: String) {
      Collective(slug: $slug, throwIfMissing: false) { id slug } }`;
    // When a collective that doesn't exist is retrieved
    const result = await utils.graphqlQuery(query, { slug: 'apex' });
    // Than we're supposed to see some errors
    expect(result.errors).to.not.exist;
    expect(result.data.Collective).to.be.null;
  });

  it('gets the collective info for the collective page', async () => {
    // Given a collective called apex with some metadata
    const currency = 'USD';
    const { admuser } = await store.newUser('admuser');
    const { orgadm0 } = await store.newUser('orgadm0');
    const { hostAdmin, hostCollective, apex } = await store.newCollectiveWithHost(
      'apex',
      currency,
      currency,
      10,
      admuser,
    );
    // await apex.addUserWithRole(user, 'BACKER');
    await apex.update({ website: 'http://apex.run' });
    // And given the host has a stripe account
    await store.stripeConnectedAccount(hostCollective.id);
    // And given a donation from an organization
    const org0 = await store.newOrganization({ name: 'org0', currency }, orgadm0);
    await store.stripeOneTimeDonation({
      remoteUser: orgadm0,
      fromCollective: org0,
      collective: apex,
      currency,
      amount: 20000,
    });
    await hostAdmin.populateRoles();
    // And given a few donations from new users
    for (let i = 0; i < 10; i++) {
      const { user } = await store.newUser(`testuser${i}`);
      await store.stripeOneTimeDonation({
        remoteUser: user,
        collective: apex,
        currency,
        amount: 1000 * (i + 1),
      });
      // And given some expenses
      const expense = await store.createApprovedExpense(user, {
        category: 'Engineering',
        amount: 100 * (i + 1),
        description: 'test',
        currency,
        payoutMethod: 'manual',
        collective: { id: apex.id },
      });
      await expenses.payExpense(hostAdmin, { id: expense.id });
    }

    // When the following query is executed
    const query = `
    query Collective($slug: String) {
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
        githubHandle
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

    const result = await utils.graphqlQuery(query, { slug: 'apex' });
    result.errors && console.error(result.errors);
    expect(result.errors).to.not.exist;

    const collective = result.data.Collective;
    expect(collective.website).to.equal('http://apex.run');
    expect(collective.members).to.have.length(23);

    const memberships = collective.members;
    memberships.sort((a, b) => a.id - b.id);
    expect(memberships[0].role).to.equal('HOST');
    expect(memberships[1].role).to.equal('ADMIN');
    expect(memberships[2].role).to.equal('BACKER');
    expect(collective.createdByUser.email).to.be.null;
    expect(collective.tiers).to.have.length(2);

    expect(collective.stats.backers).to.deep.equal({
      all: 11,
      users: 10,
      organizations: 1,
    });

    expect(collective.stats.topFundingSources).to.deep.equal({
      byCollective: [
        {
          image: null,
          slug: 'org0',
          name: 'org0',
          totalDonations: 18000,
        },
        {
          image: null,
          slug: 'testuser9',
          name: 'testuser9',
          totalDonations: 9000,
        },
        {
          image: null,
          slug: 'testuser8',
          name: 'testuser8',
          totalDonations: 8100,
        },
      ],
      byCollectiveType: [{ type: 'USER', totalDonations: 49500 }],
    });

    expect(collective.stats.topExpenses).to.deep.equal({
      byCategory: [{ category: 'Engineering', count: 10, totalExpenses: 5500 }],
      byCollective: [
        {
          slug: 'testuser9',
          image: null,
          name: 'testuser9',
          totalExpenses: -1000,
          twitterHandle: null,
        },
        {
          slug: 'testuser8',
          image: null,
          name: 'testuser8',
          totalExpenses: -900,
          twitterHandle: null,
        },
        {
          slug: 'testuser7',
          image: null,
          name: 'testuser7',
          totalExpenses: -800,
          twitterHandle: null,
        },
      ],
    });
  });

  it('gets the url path and the host collective for an event', async () => {
    // Given a host
    const { hostCollective } = await store.newHost('brusselstogether', 'EUR', 5);
    // And given a collective
    const { collective } = await store.newCollectiveInHost('brusselstogether collective', 'EUR', hostCollective);
    // and an event in that collective
    const event = (await store.newCollectiveInHost('meetup 5', 'EUR', hostCollective)).collective;
    await event.update({ type: 'EVENT', ParentCollectiveId: collective.id });

    // When the following query is executed
    const query = `
      query Collective($slug: String) {
        Collective(slug: $slug) {
          slug
          path
          host {
            id
            slug
            path
          }
        }
      }
    `;
    const result = await utils.graphqlQuery(query, { slug: 'meetup-5' });
    // Then there should be no errors
    result.errors && console.error(result.errors);
    expect(result.errors).to.not.exist;

    // And then data should match what we have above
    expect(result.data.Collective.host.id).to.equal(hostCollective.id);
    expect(result.data.Collective.host.slug).to.equal(hostCollective.slug);
    expect(result.data.Collective.path).to.equal('/brusselstogether-collective/events/meetup-5');
    expect(result.data.Collective.host.path).to.equal('/brusselstogether');
  });

  it('gets the expense stats across all hosted collectives', async () => {
    // Given a user
    const { user } = await store.newUser('user');
    // And given a host
    const { hostCollective } = await store.newHost('brusselstogether', 'EUR', 5);
    // And given two collectives under the above host
    const { collective } = await store.newCollectiveInHost('brusselstogether collective', 'EUR', hostCollective, null, {
      isActive: true,
    });
    const { veganizerbxl } = await store.newCollectiveInHost('veganizerbxl', 'EUR', hostCollective, null, {
      isActive: true,
    });

    // And given a helper to create data for expenses
    const d = (amount, description, cid) => ({
      amount,
      description,
      currency: 'EUR',
      payoutMethod: 'manual',
      collective: { id: cid },
    });

    // And given that we add some expenses to brussels together:
    await store.createPaidExpense(user, d(2000, 'Pizza', collective.id));
    await store.createPaidExpense(user, d(1000, 'Lunch', collective.id));
    await store.createPaidExpense(user, d(1000, 'Lunch', collective.id));
    await store.createPaidExpense(user, d(1000, 'Lunch', collective.id));
    await store.createPaidExpense(user, d(2000, 'Tickets', collective.id));
    await store.createRejectedExpense(user, d(50000, '10 T-Shirts', collective.id));
    await store.createRejectedExpense(user, d(50000, '10 T-Shirts', collective.id));
    await store.createRejectedExpense(user, d(50000, '10 T-Shirts', collective.id));

    // And given that we add some expenses for the collective veganizerbxl
    await store.createPaidExpense(user, d(2000, 'Vegan Pizza', veganizerbxl.id));
    await store.createPaidExpense(user, d(1000, 'Vegan Lunch', veganizerbxl.id));
    await store.createPaidExpense(user, d(1000, 'Vegan Lunch', veganizerbxl.id));
    await store.createPaidExpense(user, d(1000, 'Vegan Treats', veganizerbxl.id));
    await store.createPaidExpense(user, d(2000, 'Tickets', veganizerbxl.id));
    await store.createApprovedExpense(user, d(50000, 'Vegan stuff', veganizerbxl.id));
    await store.createRejectedExpense(user, d(50000, 'Non vegan thing', veganizerbxl.id));
    await store.createRejectedExpense(user, d(50000, 'Non vegan biscuit', veganizerbxl.id));
    await store.createRejectedExpense(user, d(50000, 'Non vegan stuff', veganizerbxl.id));
    await store.createRejectedExpense(user, d(50000, 'Non vegan t-shirts', veganizerbxl.id));

    // When the following query is executed
    const query = `
    query Collective($slug: String) {
      Collective(slug: $slug) {
        id
        slug
        stats {
          collectives {
            all
            hosted
            memberOf
          }
          expenses {
            pending
            approved
            paid
          }
        }
        collectives {
          total
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
    }
    `;

    const result = await utils.graphqlQuery(query, {
      slug: 'brusselstogether',
    });
    result.errors && console.error(result.errors);
    expect(result.errors).to.not.exist;

    const collectives = result.data.Collective.collectives.collectives;
    expect(result.data.Collective.stats.collectives.all).to.equal(2);
    expect(result.data.Collective.stats.collectives.hosted).to.equal(2);
    expect(result.data.Collective.stats.collectives.memberOf).to.equal(0);
    expect(collectives.sort((a, b) => a.id - b.id)).to.deep.equal([
      {
        id: collective.id,
        slug: 'brusselstogether-collective',
        stats: {
          expenses: {
            all: 8,
            paid: 5,
            pending: 0,
            rejected: 3,
            approved: 0,
          },
        },
      },
      {
        id: veganizerbxl.id,
        slug: 'veganizerbxl',
        stats: {
          expenses: {
            all: 10,
            paid: 5,
            pending: 0,
            rejected: 4,
            approved: 1,
          },
        },
      },
    ]);
  });

  it('gets the members by type with stats, transactions and orders', async () => {
    // Given some users
    const { theadmin } = await store.newUser('theadmin');
    const { theuser0 } = await store.newUser('theuser0');
    const { theuser1 } = await store.newUser('theuser1');
    const { orgadm0 } = await store.newUser('orgadm0');
    const { orgadm1 } = await store.newUser('orgadm1');
    const currency = 'USD';
    // And given the following collective with a host
    const { collective, hostCollective } = await store.newCollectiveWithHost('apex', currency, currency, 10, theadmin, {
      isActive: true,
    });
    // And given the host has a stripe account
    await store.stripeConnectedAccount(hostCollective.id);
    // And given some purchases from users to the collective
    await store.stripeOneTimeDonation({
      remoteUser: theuser0,
      collective,
      currency,
      amount: 100,
    });
    await store.stripeOneTimeDonation({
      remoteUser: theuser0,
      collective,
      currency,
      amount: 200,
    });
    await store.stripeOneTimeDonation({
      remoteUser: theuser0,
      collective,
      currency,
      amount: 500,
    });
    await store.stripeOneTimeDonation({
      remoteUser: theuser1,
      collective,
      currency,
      amount: 5000,
    });
    await store.stripeOneTimeDonation({
      remoteUser: theuser1,
      collective,
      currency,
      amount: 5000,
    });
    // And given the following organizations
    const org0 = await store.newOrganization({ name: 'org0', currency }, orgadm0);
    const org1 = await store.newOrganization({ name: 'org1', currency }, orgadm1);
    // And given some donations from the above orgs
    await store.stripeOneTimeDonation({
      remoteUser: orgadm0,
      fromCollective: org0,
      collective,
      currency,
      amount: 100000,
    });
    await store.stripeOneTimeDonation({
      remoteUser: orgadm0,
      fromCollective: org0,
      collective,
      currency,
      amount: 200000,
    });
    await store.stripeOneTimeDonation({
      remoteUser: orgadm1,
      fromCollective: org1,
      collective,
      currency,
      amount: 100000,
    });

    // When the query is performed
    const query = `
    query Collective($slug: String, $type: String) {
      Collective(slug: $slug) {
        members(type: $type, limit: 10, offset: 0) {
          id
          role
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
    const fetchMembersByType = async type => {
      const result = await utils.graphqlQuery(query, { slug: 'apex', type });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      return result.data.Collective.members;
    };

    // Then we see we have two users that are members of that
    // collective
    const members = await fetchMembersByType('USER');
    expect(members).to.have.length(3);
    // And then we see the second and third users made some donations
    expect(members[0].transactions).to.have.length(0);
    expect(members[1].transactions).to.have.length(3);
    expect(members[2].transactions).to.have.length(2);
    // And then the amounts donated should match the values of the
    // donations created above
    expect(members[0].stats.totalDonations).to.equal(0);
    expect(members[1].stats.totalDonations).to.equal(800);
    expect(members[2].stats.totalDonations).to.equal(10000);
    // And then we also check the organizations that are affiliated to
    // this collective
    const memberOrgs = await fetchMembersByType('ORGANIZATION');
    expect(memberOrgs).to.have.length(2);
    expect(memberOrgs[0].stats.totalDonations).to.equal(300000);
    expect(memberOrgs[1].stats.totalDonations).to.equal(100000);
  });

  describe('allMembers query', () => {
    const allMembersQuery = `
    query allMembers($collectiveSlug: String, $memberCollectiveSlug: String, $orderBy: String, $role: String, $type: String, $isActive: Boolean) {
      allMembers(collectiveSlug: $collectiveSlug, memberCollectiveSlug: $memberCollectiveSlug, role: $role, type: $type, limit: 10, offset: 0, orderBy: $orderBy, isActive: $isActive) {
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
          ... on Organization {
            email
          }
        }
        tier {
          id
          slug
          interval
        }
      }
    }
    `;

    let brusselsTogetherHostAdmin;

    beforeEach(async () => {
      // Given some users
      const currency = 'EUR';
      const { piamancini } = await store.newUser('piamancini', { currency });
      const { xdamman } = await store.newUser('xdamman', { currency });
      const { user } = await store.newUser('alexandrasaveljeva', { currency });
      const { user0 } = await store.newUser('user0', { currency });
      const { user1 } = await store.newUser('user1', { currency });
      // And given a collective with a host that has stripe enabled
      const { hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost(
        'brusselstogether collective',
        currency,
        currency,
        10,
        null,
        { isActive: true },
      );
      brusselsTogetherHostAdmin = hostAdmin;
      await store.stripeConnectedAccount(hostCollective.id);
      // And given some purchases
      await store.stripeOneTimeDonation({
        remoteUser: user,
        collective,
        currency,
        amount: 100,
      });
      await store.stripeOneTimeDonation({
        remoteUser: user0,
        collective,
        currency,
        amount: 100,
      });
      await store.stripeOneTimeDonation({
        remoteUser: user1,
        collective,
        currency,
        amount: 500,
      });
      await store.stripeOneTimeDonation({
        remoteUser: xdamman,
        collective,
        currency,
        amount: 2000,
      });

      // And given some other collectives under the same host and some
      // donations made by xdamman
      const { veganizerbxl } = await store.newCollectiveInHost('veganizerbxl', currency, hostCollective, null, {
        isActive: true,
      });
      const { another } = await store.newCollectiveInHost('another', currency, hostCollective, null, {
        isActive: true,
      });
      await store.stripeOneTimeDonation({
        remoteUser: xdamman,
        collective: veganizerbxl,
        currency,
        amount: 1000,
      });
      await store.stripeOneTimeDonation({
        remoteUser: xdamman,
        collective: another,
        currency,
        amount: 1000,
      });

      // And given another collective and another purchase but now for Pia's user
      const { opensource } = await store.newCollectiveInHost('opensource', currency, hostCollective, null, {
        isActive: true,
      });
      await store.stripeOneTimeDonation({
        remoteUser: piamancini,
        collective: opensource,
        currency,
        amount: 1000,
      });
    });

    it('gets the active members ', async () => {
      const result = await utils.graphqlQuery(allMembersQuery, {
        collectiveSlug: 'brusselstogether-collective',
        isActive: true,
        orderBy: 'totalDonations',
      });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      expect(members).to.have.length(5);
      expect(members[0].collective.slug).to.equal('brusselstogether-collective');
      expect(members[0].member.slug).to.equal('xdamman');
      members.map(m => {
        m.tier && expect(m.tier.interval).to.be.null;
      });
    });

    it('gets the members by collectiveSlug without email', async () => {
      const result = await utils.graphqlQuery(allMembersQuery, {
        collectiveSlug: 'brusselstogether-collective',
      });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      expect(members).to.have.length(4);
      expect(members[0].collective.slug).to.equal('brusselstogether-collective');
      expect(members[0].member.slug).to.equal('alexandrasaveljeva');
      members.map(m => {
        expect(m.member.email).to.be.null;
      });
    });

    it('gets the user members by collectiveSlug with email', async () => {
      const hostAdmin = brusselsTogetherHostAdmin;
      const result = await utils.graphqlQuery(
        allMembersQuery,
        { collectiveSlug: 'veganizerbxl', type: 'USER' },
        hostAdmin,
      );
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      members.map(m => {
        expect(m.member.email).to.not.be.null;
      });
    });

    it('gets the user members by collectiveSlug without email if logged in as admin of another host', async () => {
      const { hostAdmin } = await store.newHost('another host', 'USD', 10);
      const result = await utils.graphqlQuery(
        allMembersQuery,
        { collectiveSlug: 'veganizerbxl', type: 'USER' },
        hostAdmin,
      );
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      members.map(m => {
        expect(m.member.email).to.be.null;
      });
    });

    it('gets the members by memberCollectiveSlug by role', async () => {
      const result = await utils.graphqlQuery(allMembersQuery, {
        memberCollectiveSlug: 'xdamman',
        role: 'ADMIN',
      });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      expect(members[1].role).to.equal('BACKER');
      expect(members[1].collective.slug).to.equal('brusselstogether-collective');
      expect(members[1].member.slug).to.equal('xdamman');
      expect(members).to.have.length(3);
    });

    it('gets the members by memberCollectiveSlug sorted by totalDonations', async () => {
      const result = await utils.graphqlQuery(allMembersQuery, {
        memberCollectiveSlug: 'xdamman',
        orderBy: 'totalDonations',
      });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      expect(members[0].collective.slug).to.equal('brusselstogether-collective');
      expect(members[0].member.slug).to.equal('xdamman');
      expect(members).to.have.length(3);
    });

    it('gets the members by memberCollectiveSlug sorted by balance', async () => {
      const result = await utils.graphqlQuery(allMembersQuery, {
        memberCollectiveSlug: 'piamancini',
        orderBy: 'balance',
      });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const members = result.data.allMembers;
      expect(members[0].collective.slug).to.equal('opensource');
      expect(members[0].member.slug).to.equal('piamancini');
      expect(members).to.have.length(1);
    });
  });

  describe('edits', () => {
    let pubnubCollective, pubnubAdmin, adminMembership;

    beforeEach(async () => {
      pubnubAdmin = (await store.newUser('pubnub admin')).user;
      pubnubCollective = (
        await store.newCollectiveWithHost('pubnub', 'USD', 'USD', 10, pubnubAdmin, {
          isActive: true,
        })
      ).collective;
      adminMembership = await models.Member.findOne({
        where: {
          MemberCollectiveId: pubnubAdmin.id,
        },
      });
    });

    it('edits members', async () => {
      const collective = {
        id: pubnubCollective.id,
        slug: 'pubnub',
        name: 'PubNub ',
        description: null,
        longDescription: null,
        currency: 'USD',
        image:
          'https://opencollective-production.s3-us-west-1.amazonaws.com/pubnublogopng_38ab9250-d2c4-11e6-8ba3-b7985935397d.png',
        members: [
          {
            id: adminMembership.id,
            role: 'ADMIN',
            member: {
              name: 'Xavier Damman',
              email: null,
            },
          },
          {
            role: 'MEMBER',
            member: {
              name: 'member1',
              email: 'member1@hail.com',
            },
          },
          {
            role: 'ADMIN',
            member: {
              name: 'member2',
              email: 'member2@hail.com',
            },
          },
        ],
        location: {},
      };

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
      expect(members.length).to.equal(4);
      const member1 = members.find(m => m.member.name === 'member1');
      expect(member1.role).to.equal('MEMBER');
      expect(member1.member.name).to.equal('member1');
      expect(member1.member.email).to.equal('member1@hail.com');

      const member = await models.User.findByPk(member1.member.createdByUser.id);
      const res2 = await utils.graphqlQuery(query, { collective }, member);
      expect(res2.errors).to.exist;
      expect(res2.errors[0].message).to.equal(
        'You must be logged in as an admin or as the host of this collective collective to edit it',
      );

      const member2 = members.find(m => m.member.name === 'member2');
      const adminMember = await models.User.findByPk(member2.member.createdByUser.id);
      const res3 = await utils.graphqlQuery(query, { collective }, adminMember);
      expect(res3.errors[0].message).to.equal(
        'You cannot remove yourself as a Collective admin. If you are the only admin, please add a new one and ask them to remove you.',
      );
    });

    it('apply to host', async () => {
      const { hostCollective } = await store.newHost('brusselstogether', 'EUR', 5);

      const collective = {
        id: pubnubCollective.id,
        HostCollectiveId: hostCollective.id,
      };

      const query = `
    mutation editCollective($collective: CollectiveInputType!) {
      editCollective(collective: $collective) {
        id,
        slug,
        host {
          id
          slug
          currency
        }
        currency,
      }
    }
    `;
      const res = await utils.graphqlQuery(query, { collective }, pubnubAdmin);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      const updatedCollective = res.data.editCollective;
      // console.log('>>> updatedCollective', updatedCollective);
      expect(updatedCollective.host.id).to.equal(hostCollective.id);
      expect(updatedCollective.currency).to.equal('EUR');
    });
  });
  describe('edits member public message', () => {
    const QUERY = `
      mutation editPublicMessage($FromCollectiveId: Int!, $CollectiveId: Int!, $message: String) {
        editPublicMessage(FromCollectiveId: $FromCollectiveId, CollectiveId: $CollectiveId, message: $message) {
          id
          publicMessage
        }
      }
    `;
    let pubnubCollective, pubnubHostCollective, pubnubAdmin, sandbox, cacheDelSpy;
    cache;
    beforeEach(async () => {
      pubnubAdmin = (await store.newUser('pubnub admin')).user;
      const collectiveWithHost = await store.newCollectiveWithHost('pubnub', 'USD', 'USD', 10, pubnubAdmin, {
        isActive: true,
      });
      pubnubCollective = collectiveWithHost.collective;
      pubnubHostCollective = collectiveWithHost.hostCollective;
      sandbox = sinon.createSandbox();
      cacheDelSpy = sandbox.spy(cache, 'del');
    });
    afterEach(() => sandbox.restore());
    it('edits public message', async () => {
      await store.stripeConnectedAccount(pubnubHostCollective.id);
      await store.stripeOneTimeDonation({
        remoteUser: pubnubAdmin,
        collective: pubnubCollective,
        currency: 'USD',
        amount: 20000,
      });
      const message = 'I am happy to support this collective!';
      const res = await utils.graphqlQuery(
        QUERY,
        {
          FromCollectiveId: pubnubAdmin.collective.id,
          CollectiveId: pubnubCollective.id,
          message,
        },
        pubnubAdmin,
      );
      utils.expectNoErrorsFromResult(res);
      // Check only two members where returned by the mutation
      expect(res.data.editPublicMessage.length).to.equal(2);
      // Find all members modified by the mutation in the database.
      const members = await models.Member.findAll({
        attributes: ['id', 'publicMessage'],
        where: {
          MemberCollectiveId: pubnubAdmin.collective.id,
          CollectiveId: pubnubCollective.id,
          publicMessage: message,
        },
      });
      // Check only two member were modified by the mutation in the database.
      expect(members.length).to.equal(2);
      // Check the two members returned by the mutation are the two members modified in the database.
      members.forEach(member =>
        expect(res.data.editPublicMessage).to.deep.include({ id: member.id, publicMessage: member.publicMessage }),
      );
      // Check contributors cache is deleted after edition
      expect(cacheDelSpy.callCount).to.equal(1);
      expect(cacheDelSpy.firstCall.args[0]).to.equal(`collective_contributors_${pubnubCollective.id}`);
    });
    it('deletes public message', async () => {
      await store.stripeConnectedAccount(pubnubHostCollective.id);
      await store.stripeOneTimeDonation({
        remoteUser: pubnubAdmin,
        collective: pubnubCollective,
        currency: 'USD',
        amount: 20000,
      });

      // Update the public message in the database
      const [quantityUpdated] = await models.Member.update(
        {
          publicMessage: 'I am happy to contribute to this collective!',
        },
        {
          where: {
            MemberCollectiveId: pubnubAdmin.collective.id,
            CollectiveId: pubnubCollective.id,
          },
        },
      );
      expect(quantityUpdated).to.equal(2);
      const res = await utils.graphqlQuery(
        QUERY,
        {
          FromCollectiveId: pubnubAdmin.collective.id,
          CollectiveId: pubnubCollective.id,
          message: null,
        },
        pubnubAdmin,
      );
      utils.expectNoErrorsFromResult(res);
      // Check only two members where returned by the mutation
      expect(res.data.editPublicMessage.length).to.equal(2);
      // Find all members modified by the mutation in the database.
      const members = await models.Member.findAll({
        attributes: ['id', 'publicMessage'],
        where: {
          MemberCollectiveId: pubnubAdmin.collective.id,
          CollectiveId: pubnubCollective.id,
        },
      });
      // Check only two member were modified by the mutation in the database.
      expect(members.length).to.equal(2);
      // Check the two members returned by the mutation are the two members modified in the database.
      members.forEach(member =>
        expect(res.data.editPublicMessage).to.deep.include({ id: member.id, publicMessage: null }),
      );
      // Check contributors cache is deleted after edition
      expect(cacheDelSpy.callCount).to.equal(1);
      expect(cacheDelSpy.firstCall.args[0]).to.equal(`collective_contributors_${pubnubCollective.id}`);
    });
    it('error trying to edit members public message where user is not admin', async () => {
      const { user } = await store.newUser('test');
      const res = await utils.graphqlQuery(
        QUERY,
        {
          FromCollectiveId: user.collective.id,
          CollectiveId: pubnubCollective.id,
          message: 'I am happy to support this collective!',
        },
        pubnubAdmin,
      );
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal("You don't have the permission to edit member public message");
      expect(cacheDelSpy.callCount).to.equal(0);
    });
    it('error trying to edit members that do not exists ', async () => {
      const { user } = await store.newUser('test');
      const res = await utils.graphqlQuery(
        QUERY,
        {
          FromCollectiveId: user.collective.id,
          CollectiveId: pubnubCollective.id,
          message: 'I am happy to support th0is collective!',
        },
        user,
      );
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal('No member found');
      expect(cacheDelSpy.callCount).to.equal(0);
    });
  });
});
