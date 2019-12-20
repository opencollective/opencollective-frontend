import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';

import * as utils from '../../../utils';
import models from '../../../../server/models';
import roles from '../../../../server/constants/roles';
import * as payments from '../../../../server/lib/payments';
import emailLib from '../../../../server/lib/email';

let host, user1, user2, user3, collective1, event1, ticket1;
let sandbox, executeOrderStub, emailSendSpy, emailSendMessageSpy;

describe('server/graphql/v1/mutation', () => {
  /* SETUP
    collective1: 2 events
      event1: 1 free ticket, 1 paid ticket
  */

  before(() => {
    sandbox = sinon.createSandbox();
    emailSendSpy = sandbox.spy(emailLib, 'send');
    emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
    executeOrderStub = sandbox.stub(payments, 'executeOrder').callsFake((user, order) => {
      // assumes payment goes through and marks Order as confirmedAt
      return models.Tier.findByPk(order.TierId)
        .then(tier => {
          if (tier.interval) {
            return models.Subscription.create({
              amount: tier.amount,
              currency: tier.currency,
              interval: tier.interval,
              isActive: true,
            }).then(s => s.id);
          }
        })
        .then(SubscriptionId => order.update({ SubscriptionId, processedAt: new Date() }))
        .then(() => models.Collective.findByPk(order.CollectiveId))
        .then(collective =>
          collective.addUserWithRole(
            user,
            roles.BACKER,
            { MemberCollectiveId: order.FromCollectiveId, TierId: order.TierId },
            { order },
          ),
        );
    });
  });

  after(() => sandbox.restore());

  beforeEach('reset db', async () => {
    await new Promise(res => setTimeout(res, 500));
    await utils.resetTestDB();
  });

  beforeEach('create user1', () => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user1 = u)));
  beforeEach('create host user 1', () =>
    models.User.createUserWithCollective({
      ...utils.data('host1'),
      currency: 'EUR',
    }).tap(u => (host = u)),
  );

  beforeEach('create user2', () => models.User.createUserWithCollective(utils.data('user2')).tap(u => (user2 = u)));
  beforeEach('create user3', () => models.User.createUserWithCollective(utils.data('user3')).tap(u => (user3 = u)));
  beforeEach('create collective1', () =>
    models.Collective.create(utils.data('collective1')).tap(g => (collective1 = g)),
  );
  beforeEach('add host', () => collective1.addHost(host.collective, host));
  beforeEach('add user1 as admin to collective1', () => collective1.addUserWithRole(user1, roles.ADMIN));
  beforeEach('add user2 as admin to collective1', () => collective1.addUserWithRole(user2, roles.ADMIN));

  beforeEach('create stripe account', done => {
    models.ConnectedAccount.create({
      service: 'stripe',
      token: 'abc',
      CollectiveId: host.collective.id,
    })
      .tap(() => done())
      .catch(done);
  });

  beforeEach('create an event collective', () =>
    models.Collective.create(
      Object.assign(utils.data('event1'), {
        CreatedByUserId: user1.id,
        ParentCollectiveId: collective1.id,
      }),
    ).tap(e => (event1 = e)),
  );
  beforeEach('add user1 as admin of event1', () => event1.addUserWithRole(user1, roles.ADMIN));

  describe('createCollective tests', () => {
    const createCollectiveQuery = `
    mutation createCollective($collective: CollectiveInputType!) {
      createCollective(collective: $collective) {
        id
        slug
        currency
        host {
          id
          currency
        }
        parentCollective {
          id
          currency
        }
        isActive
        tiers {
          id
          name
          amount
          presets
        }
      }
    }
    `;

    describe('creates an event collective', () => {
      const getEventData = collective => {
        return {
          name: 'BrusselsTogether Meetup 3',
          type: 'EVENT',
          longDescription:
            'Hello Brussels!\n\nAccording to the UN, by 2050 66% of the world’s population will be urban dwellers, which will profoundly affect the role of modern city-states on Earth.\n\nToday, citizens are already anticipating this futurist trend by creating numerous initiatives inside their local communities and outside of politics.\n\nIf you want to be part of the change, please come have a look to our monthly events! You will have the opportunity to meet real actors of change and question them about their purpose. \n\nWe also offer the opportunity for anyone interested to come before the audience and share their ideas in 60 seconds at the end of the event.\n\nSee more about #BrusselsTogether radical way of thinking below.\n\nhttps://brusselstogether.org/\n\nGet your ticket below and get a free drink thanks to our sponsor! 🍻🎉\n\n**Schedule**\n\n7 pm - Doors open\n\n7:30 pm - Introduction to #BrusselsTogether\n\n7:40 pm - Co-Labs, Citizen Lab of Social Innovations\n\n7:55 pm - BeCode.org, growing today’s talented youth into tomorrow’s best developers.\n\n8:10 pm - OURB, A city building network\n\n8:30 pm - How do YOU make Brussels better \nPitch your idea in 60 seconds or less\n',
          location: {
            name: "Brass'Art Digitaal Cafe",
            address: 'Place communale de Molenbeek 28',
          },
          startsAt: 'Wed Apr 05 2017 10:00:00 GMT-0700 (PDT)',
          endsAt: 'Wed Apr 05 2017 12:00:00 GMT-0700 (PDT)',
          timezone: 'Europe/Brussels',
          ParentCollectiveId: collective.id,
          tiers: [
            { name: 'free ticket', description: 'Free ticket', amount: 0 },
            {
              name: 'sponsor',
              description: 'Sponsor the drinks. Pretty sure everyone will love you.',
              amount: 15000,
            },
          ],
        };
      };

      it('fails if not authenticated', async () => {
        const result = await utils.graphqlQuery(createCollectiveQuery, {
          collective: getEventData(collective1),
        });
        expect(result.errors).to.have.length(1);
        expect(result.errors[0].message).to.equal('You need to be logged in to create a collective');
      });

      it('fails if authenticated but cannot edit parent collective', async () => {
        await host.collective.update({ settings: { apply: true } });
        const result = await utils.graphqlQuery(
          createCollectiveQuery,
          { collective: getEventData(collective1) },
          user3,
        );
        expect(result.errors).to.have.length(1);
        expect(result.errors[0].message).to.equal(
          'You must be logged in as a member of the scouts collective to create an event',
        );
      });

      it('creates an event with multiple tiers, uses the currency of parent collective', async () => {
        await host.collective.update({ currency: 'CAD', settings: { apply: true } });
        const event = getEventData(collective1);

        const result = await utils.graphqlQuery(createCollectiveQuery, { collective: event }, user1);
        result.errors && console.error(result.errors[0]);
        const createdEvent = result.data.createCollective;
        expect(createdEvent.slug).to.contain('brusselstogether-meetup');
        expect(createdEvent.tiers.length).to.equal(event.tiers.length);
        expect(createdEvent.isActive).to.be.true;
        event.id = createdEvent.id;
        event.tiers = createdEvent.tiers;

        // Make sure the creator of the event has been added as an ADMIN
        const members = await models.Member.findAll({
          where: { CollectiveId: event.id },
          order: [['MemberCollectiveId', 'ASC']],
        });
        expect(createdEvent.currency).to.equal(createdEvent.parentCollective.currency);
        expect(members).to.have.length(3);
        expect(members[0].CollectiveId).to.equal(event.id);
        expect(members[0].MemberCollectiveId).to.equal(user1.CollectiveId);
        expect(members[0].role).to.equal(roles.ADMIN);
        expect(members[1].role).to.equal(roles.HOST);
        expect(members[1].MemberCollectiveId).to.equal(collective1.HostCollectiveId);
        expect(members[2].role).to.equal(roles.ADMIN);
        expect(members[2].MemberCollectiveId).to.equal(user2.CollectiveId);

        // We remove the first tier
        event.tiers.shift();

        // We update the second (now only) tier
        event.tiers[0].amount = 123;

        const updateQuery = `
        mutation editCollective($collective: CollectiveInputType!) {
          editCollective(collective: $collective) {
            id,
            slug,
            tiers {
              id,
              name,
              amount
            }
          }
        }
        `;

        const r2 = await utils.graphqlQuery(updateQuery, { collective: event });
        expect(r2.errors).to.have.length(1);
        expect(r2.errors[0].message).to.equal('You need to be logged in to edit a collective');

        const r3 = await utils.graphqlQuery(updateQuery, { collective: event }, user3);
        expect(r3.errors).to.have.length(1);
        expect(r3.errors[0].message).to.equal(
          'You must be logged in as the creator of this Event or as an admin of the scouts collective to edit this Event Collective',
        );

        const r4 = await utils.graphqlQuery(updateQuery, { collective: event }, user1);
        const updatedEvent = r4.data.editCollective;
        expect(updatedEvent.tiers.length).to.equal(event.tiers.length);
        expect(updatedEvent.tiers[0].amount).to.equal(event.tiers[0].amount);
      });
    });

    describe('apply to create a collective', () => {
      let newCollectiveData;

      beforeEach(() => {
        newCollectiveData = {
          slug: 'newcollective',
          name: 'new collective',
          website: 'http://newcollective.org',
          twitterHandle: 'newcollective',
          HostCollectiveId: host.collective.id,
          currency: 'EUR',
        };
      });

      it('fails if not logged in', async () => {
        const res = await utils.graphqlQuery(createCollectiveQuery, {
          collective: newCollectiveData,
        });
        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.contain('You need to be logged in to create a collective');
      });

      it("fails to create a collective on a host that doesn't accept applications", async () => {
        await host.collective.update({ settings: { apply: false } });
        const collective = {
          name: 'new collective',
          HostCollectiveId: host.CollectiveId,
        };
        const result = await utils.graphqlQuery(createCollectiveQuery, { collective }, user1);
        expect(result.errors[0].message).to.equal('This host does not accept applications for new collectives');
      });

      it('creates a collective', async () => {
        emailSendMessageSpy.resetHistory();
        await host.collective.update({ settings: { apply: true } });
        const res = await utils.graphqlQuery(createCollectiveQuery, { collective: newCollectiveData }, user1);
        res.errors && console.error(res.errors[0]);
        const newCollective = res.data.createCollective;
        const hostMembership = await models.Member.findOne({
          where: { CollectiveId: newCollective.id, role: 'HOST' },
        });
        const adminMembership = await models.Member.findOne({
          where: { CollectiveId: newCollective.id, role: 'ADMIN' },
        });

        expect(newCollective.currency).to.equal(newCollectiveData.currency);
        expect(newCollective.tiers).to.have.length(2);
        expect(newCollective.tiers[0].presets).to.have.length(4);
        expect(hostMembership.MemberCollectiveId).to.equal(host.CollectiveId);
        expect(adminMembership.MemberCollectiveId).to.equal(user1.CollectiveId);

        expect(newCollective.isActive).to.be.false;
        expect(newCollective.host.id).to.equal(host.collective.id);
        await utils.waitForCondition(() => emailSendMessageSpy.callCount === 3);
        expect(emailSendMessageSpy.callCount).to.equal(3);

        const applyEmailArgs = emailSendMessageSpy.args.find(callArgs => callArgs[1].includes('Thanks for applying'));
        expect(applyEmailArgs).to.exist;
        expect(applyEmailArgs[0]).to.equal(user1.email);

        const newCollectiveArgs = emailSendMessageSpy.args.find(callArgs =>
          callArgs[1].includes('would love to be hosted'),
        );
        expect(newCollectiveArgs).to.exist;
        expect(newCollectiveArgs[0]).to.equal(host.email);

        const welcomeArgs = emailSendMessageSpy.args.find(callArgs =>
          callArgs[1].includes('Welcome to Open Collective!'),
        );
        expect(welcomeArgs).to.exist;
        expect(welcomeArgs[0]).to.equal(user1.email);
      });
    });
  });

  describe('editCollective tests', () => {
    describe('edit tiers', () => {
      const editTiersQuery = `
      mutation editTiers($id: Int!, $tiers: [TierInputType]) {
        editTiers(id: $id, tiers: $tiers) {
          id
          name
          type
          amount
          interval
          goal
        }
      }
      `;

      const tiers = [
        { name: 'backer', type: 'TIER', amount: 10000, interval: 'month' },
        { name: 'sponsor', type: 'TIER', amount: 500000, interval: 'year' },
      ];

      it('fails if not authenticated', async () => {
        const result = await utils.graphqlQuery(editTiersQuery, {
          id: collective1.id,
          tiers,
        });
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal('You need to be logged in to edit tiers');
      });

      it('fails if not authenticated as host or member of collective', async () => {
        const result = await utils.graphqlQuery(editTiersQuery, { id: collective1.id }, user3);
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal(
          "You need to be logged in as a core contributor or as a host of the Scouts d'Arlon collective",
        );
      });

      it('add new tiers and update existing', async () => {
        const result = await utils.graphqlQuery(editTiersQuery, { id: collective1.id, tiers }, user1);
        result.errors && console.error(result.errors[0]);
        expect(tiers).to.have.length(2);
        tiers.sort((a, b) => b.amount - a.amount);
        expect(tiers[0].interval).to.equal('year');
        expect(tiers[1].interval).to.equal('month');
        tiers[0].goal = 20000;
        tiers[1].amount = 100000;
        tiers.push({ name: 'free ticket', type: 'TICKET', amount: 0 });
        const result2 = await utils.graphqlQuery(editTiersQuery, { id: collective1.id, tiers }, user1);
        result2.errors && console.error(result2.errors[0]);
        const updatedTiers = result2.data.editTiers;
        updatedTiers.sort((a, b) => b.amount - a.amount);
        expect(updatedTiers).to.have.length(3);
        expect(updatedTiers[0].goal).to.equal(tiers[0].goal);
        expect(updatedTiers[1].amount).to.equal(tiers[1].amount);
      });
    });

    describe('change the hostFeePercent of the host', () => {
      const updateQuery = `
      mutation editCollective($collective: CollectiveInputType!) {
        editCollective(collective: $collective) {
          id,
          slug,
          hostFeePercent,
          host {
            id
            hostFeePercent
          }
        }
      }
      `;

      it('fails if not authenticated as an admin of the host', async () => {
        const result = await utils.graphqlQuery(
          updateQuery,
          { collective: { id: collective1.id, hostFeePercent: 11 } },
          user1,
        );
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.contain(
          'Only an admin of the host collective can edit the host fee for this collective',
        );
      });

      it('updates the hostFeePercent of the collective, not of the host', async () => {
        const result = await utils.graphqlQuery(
          updateQuery,
          { collective: { id: collective1.id, hostFeePercent: 11 } },
          host,
        );
        expect(result.data.editCollective.hostFeePercent).to.equal(11);
        expect(result.data.editCollective.host.hostFeePercent).to.equal(10);
      });

      it('updates the hostFeePercent of the host and of the hosted collectives', async () => {
        const result = await utils.graphqlQuery(
          updateQuery,
          { collective: { id: host.collective.id, hostFeePercent: 9 } },
          host,
        );
        expect(result.data.editCollective.hostFeePercent).to.equal(9);
        const hostedCollectives = await models.Collective.findAll({ where: { HostCollectiveId: host.collective.id } });
        hostedCollectives.map(c => {
          expect(c.hostFeePercent).to.equal(9);
        });
      });
    });
  });

  describe('delete Collective', () => {
    const deleteEventCollectiveQuery = `
      mutation deleteEventCollective($id: Int!) {
        deleteEventCollective(id: $id) {
          id,
          name
        }
      }`;

    it('fails to delete a collective if not logged in', async () => {
      const result = await utils.graphqlQuery(deleteEventCollectiveQuery, {
        id: event1.id,
      });
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('You need to be logged in to delete a collective');
      return models.Collective.findByPk(event1.id).then(event => {
        expect(event).to.not.be.null;
      });
    });

    it('fails to delete a collective if logged in as another user', async () => {
      const result = await utils.graphqlQuery(deleteEventCollectiveQuery, { id: event1.id }, user3);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal(
        'You need to be logged in as a core contributor or as a host to delete this collective',
      );
      return models.Collective.findByPk(event1.id).then(event => {
        expect(event).to.not.be.null;
      });
    });

    it('deletes a collective', async () => {
      const res = await utils.graphqlQuery(deleteEventCollectiveQuery, { id: event1.id }, user1);
      res.errors && console.error(res.errors[0]);
      expect(res.errors).to.not.exist;
      return models.Collective.findByPk(event1.id).then(event => {
        expect(event).to.be.null;
      });
    });
  });

  describe('createOrder tests', () => {
    beforeEach('create ticket 1', () =>
      models.Tier.create(Object.assign(utils.data('ticket1'), { CollectiveId: event1.id })).tap(t => (ticket1 = t)),
    );

    beforeEach('create ticket 2', () =>
      models.Tier.create(Object.assign(utils.data('ticket2'), { CollectiveId: event1.id })),
    );

    beforeEach('create tier 1', () =>
      models.Tier.create(Object.assign(utils.data('tier1'), { CollectiveId: collective1.id })),
    );

    describe('throws an error', () => {
      it('when missing all required fields', async () => {
        const query = `
          mutation createOrder($order: OrderInputType!) {
            createOrder(order: $order) {
              id,
              collective {
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

        const result = await utils.graphqlQuery(query, { order: {} });
        expect(result.errors.length).to.equal(1);
        expect(result.errors[0].message).to.contain('collective');
      });

      describe("when collective/tier doesn't exist", () => {
        it("when collective doesn't exist", async () => {
          const query = `
            mutation createOrder($order: OrderInputType!) {
              createOrder(order: $order) {
                id,
                collective {
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
          const order = {
            collective: { id: 12324 },
            tier: { id: 3 },
            quantity: 1,
          };
          const result = await utils.graphqlQuery(query, { order }, user2);
          expect(result.errors.length).to.equal(1);
          expect(result.errors[0].message).to.equal(`No collective found: ${order.collective.id}`);
        });

        it("when tier doesn't exist", async () => {
          const query = `
            mutation createOrder($order: OrderInputType!) {
              createOrder(order: $order) {
                id,
                collective {
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

          const order = {
            collective: { id: event1.id },
            tier: { id: 1002 },
            quantity: 1,
          };
          const result = await utils.graphqlQuery(query, { order }, user2);
          expect(result.errors.length).to.equal(1);
          expect(result.errors[0].message).to.equal(
            `No tier found with tier id: 1002 for collective slug ${event1.slug}`,
          );
        });
      });

      describe('after checking ticket quantity', () => {
        it('and if not enough are available', async () => {
          const query = `
            mutation createOrder($order: OrderInputType!) {
              createOrder(order: $order) {
                id,
                collective {
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

          const order = {
            collective: { id: event1.id },
            tier: { id: 3 },
            quantity: 101,
          };
          const result = await utils.graphqlQuery(query, { order }, user2);
          expect(result.errors[0].message).to.equal(`No more tickets left for ${ticket1.name}`);
        });
      });

      describe('when no payment method', () => {
        it("and it's a paid ticket", async () => {
          const query = `
            mutation createOrder($order: OrderInputType!) {
              createOrder(order: $order) {
                id,
                collective {
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

          const order = {
            collective: { id: event1.id },
            tier: { id: 4 },
            quantity: 2,
          };
          const result = await utils.graphqlQuery(query, { order }, user2);
          expect(result.errors[0].message).to.equal('This order requires a payment method');
        });
      });
    });

    describe('creates an order', () => {
      beforeEach('reset spies', () => {
        executeOrderStub.resetHistory();
        emailSendSpy.resetHistory();
        emailSendMessageSpy.resetHistory();
      });

      describe('as an organization', () => {
        const query = `
          mutation createOrder($order: OrderInputType!) {
            createOrder(order: $order) {
              id,
              tier {
                id,
              },
              fromCollective {
                slug
                twitterHandle
              },
              collective {
                id,
                slug
              }
            }
          }
        `;

        it('as a new organization', async () => {
          const order = {
            fromCollective: {
              name: 'Google',
              website: 'https://google.com',
              twitterHandle: 'google',
            },
            paymentMethod: {
              token: 'tok_123456781234567812345678',
              service: 'stripe',
              name: '4242',
              data: {
                expMonth: 11,
                expYear: 2020,
              },
            },
            collective: { id: collective1.id },
            publicMessage: 'Looking forward!',
            tier: { id: 5 },
            quantity: 2,
          };
          emailSendMessageSpy.resetHistory();
          const result = await utils.graphqlQuery(query, { order }, user2);
          result.errors && console.error(result.errors);
          expect(result.data).to.deep.equal({
            createOrder: {
              fromCollective: {
                slug: 'google',
                twitterHandle: 'google',
              },
              collective: {
                id: collective1.id,
                slug: collective1.slug,
              },
              id: 1,
              tier: {
                id: 5,
              },
            },
          });

          // Make sure we have added the user as a BACKER
          const members = await models.Member.findAll({
            where: {
              CollectiveId: collective1.id,
              role: roles.BACKER,
            },
          });
          await utils.waitForCondition(() => emailSendMessageSpy.callCount > 1);
          // utils.inspectSpy(emailSendMessageSpy, 2);
          expect(members).to.have.length(1);

          // Make sure we send the collective.member.created email notification to core contributor of collective1
          expect(emailSendMessageSpy.callCount).to.equal(3);
          // utils.inspectSpy(emailSendMessageSpy, 2);
          expect(emailSendMessageSpy.firstCall.args[0]).to.equal('user2@opencollective.com');
          expect(emailSendMessageSpy.firstCall.args[1]).to.equal('Your Organization on Open Collective');
          expect(emailSendMessageSpy.secondCall.args[0]).to.equal('user1@opencollective.com');
          expect(emailSendMessageSpy.secondCall.args[1]).to.equal("Google joined Scouts d'Arlon as backer");
          expect(emailSendMessageSpy.secondCall.args[2]).to.contain('Looking forward!'); // publicMessage
          expect(emailSendMessageSpy.secondCall.args[2]).to.contain(
            '@google thanks for your financial contribution to @scouts',
          );
        });

        it('as an existing organization', async () => {
          const org = await models.Collective.create({
            type: 'ORGANIZATION',
            name: 'Slack',
            website: 'https://slack.com',
            description: 'Supporting open source since 1999',
            twitterHandle: 'slack',
            image: 'http://www.endowmentwm.com/wp-content/uploads/2017/07/slack-logo.png',
          });

          await org.addUserWithRole(user2, roles.ADMIN);

          const order = {
            fromCollective: {
              id: org.id,
            },
            paymentMethod: {
              token: 'tok_123456781234567812345678',
              service: 'stripe',
              name: '4242',
              data: {
                expMonth: 11,
                expYear: 2020,
              },
            },
            collective: { id: collective1.id },
            publicMessage: 'Looking forward!',
            tier: { id: 5 },
            quantity: 2,
          };
          const result = await utils.graphqlQuery(query, { order }, user2);
          result.errors && console.error(result.errors);
          expect(result.data).to.deep.equal({
            createOrder: {
              fromCollective: {
                slug: 'slack',
                twitterHandle: 'slack',
              },
              collective: {
                id: collective1.id,
                slug: collective1.slug,
              },
              id: 1,
              tier: {
                id: 5,
              },
            },
          });

          // Make sure we have added the user as a BACKER
          const members = await models.Member.findAll({
            where: {
              CollectiveId: collective1.id,
              role: roles.BACKER,
            },
          });
          expect(members).to.have.length(1);
          await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
          expect(emailSendSpy.callCount).to.equal(2);
          const activityData = emailSendSpy.lastCall.args[2];
          expect(activityData.member.role).to.equal(roles.BACKER);
          expect(activityData.collective.type).to.equal('COLLECTIVE');
          expect(activityData.order.publicMessage).to.equal('Looking forward!');
          expect(activityData.order.subscription.interval).to.equal('month');
          expect(activityData.collective.slug).to.equal(collective1.slug);
          expect(activityData.member.memberCollective.slug).to.equal('slack');
          expect(emailSendSpy.lastCall.args[0]).to.equal('collective.member.created');
          expect(emailSendMessageSpy.lastCall.args[0]).to.equal(user2.email);
        });
      });

      describe('in a free ticket', () => {
        it('from an existing user', async () => {
          const query = `
            mutation createOrder($order: OrderInputType!) {
              createOrder(order: $order) {
                id,
                createdByUser {
                  id,
                  email
                },
                tier {
                  id,
                  name,
                  description,
                  maxQuantity,
                  stats {
                    totalOrders
                    availableQuantity
                  }
                },
                fromCollective {
                  id,
                  slug
                },
                collective {
                  id,
                  slug
                }
              }
            }
          `;

          const order = {
            collective: { id: event1.id },
            publicMessage: 'Looking forward!',
            tier: { id: 3 },
            quantity: 2,
          };
          const result = await utils.graphqlQuery(query, { order }, user2);
          result.errors && console.error(result.errors);
          expect(result.data).to.deep.equal({
            createOrder: {
              fromCollective: {
                id: user2.CollectiveId,
                slug: user2.collective.slug,
              },
              collective: {
                id: event1.id,
                slug: event1.slug,
              },
              id: 1,
              tier: {
                description: 'free tickets for all',
                id: 3,
                maxQuantity: 10,
                name: 'Free ticket',
                stats: {
                  availableQuantity: 8,
                  totalOrders: 1,
                },
              },
              createdByUser: {
                email: user2.email,
                id: 3,
              },
            },
          });

          // Make sure we have added the user as an ATTENDEE
          const members = await models.Member.findAll({
            where: {
              CollectiveId: event1.id,
              role: roles.ATTENDEE,
            },
          });
          expect(members).to.have.length(1);
          await utils.waitForCondition(() => emailSendMessageSpy.callCount > 1);
          expect(emailSendSpy.callCount).to.equal(2);
          const activityData = emailSendSpy.firstCall.args[2];
          expect(activityData.member.role).to.equal('ATTENDEE');
          expect(activityData.collective.type).to.equal('EVENT');
          expect(activityData.order.publicMessage).to.equal('Looking forward!');
          expect(activityData.collective.slug).to.equal(event1.slug);
          expect(activityData.member.memberCollective.slug).to.equal(user2.collective.slug);
          expect(emailSendSpy.firstCall.args[0]).to.equal('collective.member.created');
          expect(emailSendSpy.secondCall.args[0]).to.equal('ticket.confirmed');
          expect(emailSendMessageSpy.callCount).to.equal(2);
          expect(emailSendMessageSpy.firstCall.args[0]).to.equal('user1@opencollective.com');
          expect(emailSendMessageSpy.firstCall.args[1]).to.equal('Anish Bas joined January meetup as attendee');
          expect(emailSendMessageSpy.secondCall.args[0]).to.equal('user2@opencollective.com');
          expect(emailSendMessageSpy.secondCall.args[1]).to.equal('2 tickets confirmed for January meetup');
        });

        it('from a new user', async () => {
          const query = `
            mutation createOrder($order: OrderInputType!) {
              createOrder(order: $order) {
                id
                createdByUser {
                  id
                  email
                }
                tier {
                  id
                  name
                  description
                  maxQuantity
                  stats {
                    availableQuantity
                  }
                }
              }
            }
        `;

          const order = {
            collective: { id: event1.id },
            tier: { id: 3 },
            quantity: 2,
          };
          const remoteUser = await models.User.createUserWithCollective({
            email: 'newuser@email.com',
          });
          const result = await utils.graphqlQuery(query, { order }, remoteUser);
          expect(result).to.deep.equal({
            data: {
              createOrder: {
                id: 1,
                tier: {
                  description: 'free tickets for all',
                  id: 3,
                  maxQuantity: 10,
                  name: 'Free ticket',
                  stats: {
                    availableQuantity: 8,
                  },
                },
                createdByUser: {
                  email: 'newuser@email.com',
                  id: 5,
                },
              },
            },
          });

          // Make sure we have added the user as an ATTENDEE
          const members = await models.Member.findAll({
            where: {
              CollectiveId: event1.id,
              role: roles.ATTENDEE,
            },
          });
          expect(members).to.have.length(1);
        });
      });

      describe('in a paid ticket', () => {
        it('from an existing user', async () => {
          const query = `
            mutation createOrder($order: OrderInputType!) {
              createOrder(order: $order) {
                id,
                createdByUser {
                  id,
                  email
                },
                tier {
                  id,
                  name,
                  description,
                  maxQuantity,
                  stats {
                    availableQuantity
                  }
                },
                collective {
                  id,
                  slug
                }
              }
            }
          `;

          const order = {
            paymentMethod: {
              token: 'tok_123456781234567812345678',
              service: 'stripe',
              name: '4242',
              data: {
                expMonth: 11,
                expYear: 2020,
              },
            },
            collective: { id: event1.id },
            tier: { id: 4 },
            quantity: 2,
          };
          const result = await utils.graphqlQuery(query, { order }, user2);
          result.errors && console.error(result.errors[0]);
          expect(result.data).to.deep.equal({
            createOrder: {
              id: 1,
              tier: {
                stats: {
                  availableQuantity: 98,
                },
                description: '$20 ticket',
                id: 4,
                maxQuantity: 100,
                name: 'paid ticket',
              },
              createdByUser: {
                email: user2.email,
                id: 3,
              },
              collective: {
                id: event1.id,
                slug: 'jan-meetup',
              },
            },
          });
          const executeOrderArgument = executeOrderStub.firstCall.args;
          expect(executeOrderStub.callCount).to.equal(1);
          executeOrderStub.resetHistory();
          expect(executeOrderArgument[1].id).to.equal(1);
          expect(executeOrderArgument[1].TierId).to.equal(4);
          expect(executeOrderArgument[1].CollectiveId).to.equal(6);
          expect(executeOrderArgument[1].CreatedByUserId).to.equal(3);
          expect(executeOrderArgument[1].totalAmount).to.equal(4000);
          expect(executeOrderArgument[1].currency).to.equal('USD');
          expect(executeOrderArgument[1].paymentMethod.token).to.equal('tok_123456781234567812345678');
          await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
          expect(emailSendMessageSpy.callCount).to.equal(1);
          expect(emailSendMessageSpy.firstCall.args[0]).to.equal(user1.email);
          expect(emailSendMessageSpy.firstCall.args[1]).to.contain(`Anish Bas joined ${event1.name} as backer`);
          expect(emailSendMessageSpy.firstCall.args[2]).to.contain('/scouts/events/jan-meetup');
        });

        it('from an existing but logged out user (should fail)', async () => {
          const query = `
            mutation createOrder($order: OrderInputType!) {
              createOrder(order: $order) {
                id,
                createdByUser {
                  id,
                  email
                },
                tier {
                  id,
                  name,
                  description,
                  maxQuantity,
                  stats {
                    availableQuantity
                  }
                },
                collective {
                  id,
                  slug
                }
              }
            }
          `;

          const order = {
            paymentMethod: {
              token: 'tok_123456781234567812345678',
              service: 'stripe',
              name: '4242',
              data: {
                expMonth: 11,
                expYear: 2020,
              },
            },
            collective: { id: event1.id },
            tier: { id: 4 },
            quantity: 2,
            user: { email: user2.email },
          };

          const loggedInUser = null;
          const result = await utils.graphqlQuery(query, { order }, loggedInUser);
          // result.errors && console.error(result.errors[0]);
          expect(result.errors).to.exist;
          expect(result.errors[0].message).to.equal('You need to be authenticated to perform this action');
        });

        it('from a new user', async () => {
          const query = `
            mutation createOrder($order: OrderInputType!) {
              createOrder(order: $order) {
                id,
                createdByUser {
                  id,
                  email
                },
                tier {
                  id,
                  name,
                  description,
                  maxQuantity,
                  stats {
                    availableQuantity
                  }
                },
                collective {
                  id,
                  slug
                }
              }
            }
          `;

          const order = {
            paymentMethod: {
              token: 'tok_123456781234567812345678',
              name: '4242',
              data: {
                expMonth: 11,
                expYear: 2020,
              },
            },
            collective: { id: event1.id },
            tier: { id: 4 },
            quantity: 2,
          };
          const remoteUser = await models.User.createUserWithCollective({ email: 'newuser@email.com' });
          const result = await utils.graphqlQuery(query, { order }, remoteUser);
          result.errors && console.error(result.errors[0]);
          const executeOrderArgument = executeOrderStub.firstCall.args;
          expect(result).to.deep.equal({
            data: {
              createOrder: {
                id: 1,
                tier: {
                  description: '$20 ticket',
                  id: 4,
                  maxQuantity: 100,
                  name: 'paid ticket',
                  stats: {
                    availableQuantity: 98,
                  },
                },
                createdByUser: {
                  email: 'newuser@email.com',
                  id: 5,
                },
                collective: {
                  id: 6,
                  slug: 'jan-meetup',
                },
              },
            },
          });

          expect(executeOrderStub.callCount).to.equal(1);
          expect(executeOrderArgument[1].id).to.equal(1);
          expect(executeOrderArgument[1].TierId).to.equal(4);
          expect(executeOrderArgument[1].CollectiveId).to.equal(6);
          expect(executeOrderArgument[1].CreatedByUserId).to.equal(5);
          expect(executeOrderArgument[1].totalAmount).to.equal(4000);
          expect(executeOrderArgument[1].currency).to.equal('USD');
          expect(executeOrderArgument[1].paymentMethod.token).to.equal('tok_123456781234567812345678');
          await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
          expect(emailSendMessageSpy.callCount).to.equal(1);
          expect(emailSendMessageSpy.firstCall.args[0]).to.equal(user1.email);
          expect(emailSendMessageSpy.firstCall.args[1]).to.contain('incognito joined January meetup as backer');
        });
      });
    });
  });
});
