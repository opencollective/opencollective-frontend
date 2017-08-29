import _ from 'lodash';
import app from '../server/index';
import async from 'async';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import chanceLib from 'chance';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import sinon from 'sinon';
import emailLib from '../server/lib/email';
import stripeMock from './mocks/stripe';
import models from '../server/models';
import {appStripe} from '../server/gateways/stripe';

const chance = chanceLib.Chance();

const application = utils.data('application');
const userData = utils.data('user1');
const userData2 = utils.data('user2');
const userData3 = utils.data('user3');
const publicCollectiveData = utils.data('collective1');
const transactionsData = utils.data('transactions1').transactions;

describe('collectives.routes.test.js', () => {

  let host, user, sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();
    utils.clearbitStubBeforeEach(sandbox);
  });

  after(() => sandbox.restore());

  beforeEach(() => utils.resetTestDB());

  beforeEach('create host', () => models.User.createUserWithCollective(utils.data('host1')).tap(u => host = u));
  beforeEach('create user', () => models.User.createUserWithCollective(userData).tap(u => user = u));

  // Stripe stub.
  beforeEach(() => {
    const stub = sinon.stub(appStripe.accounts, 'create');
    stub.yields(null, stripeMock.accounts.create);
  });
  afterEach(() => {
    appStripe.accounts.create.restore();
  });

  /**
   * Create.
   */
  describe('#create', () => {

    it('fails creating a collective if no api_key', () =>
      request(app)
        .post('/collectives')
        .send({
          collective: publicCollectiveData
        })
        .expect(400)
    );

    describe('successfully create a collective', () => {
      let collective;

      beforeEach('subscribe host to collective.created notification', () => models.Notification.create({UserId: host.id, type: 'collective.created', channel: 'email'}));

      beforeEach('spy on emailLib', () => sinon.spy(emailLib, 'sendMessageFromActivity'));
      beforeEach('create the collective', (done) => {
        const users = [
              _.assign(_.omit(userData2, 'password'), { role: roles.ADMIN }),
              _.assign(_.omit(userData3, 'password'), { role: roles.ADMIN })];

        collective = Object.assign({}, publicCollectiveData, {users})
        collective.HostCollectiveId = host.CollectiveId;

        request(app)
          .post('/collectives')
          .send({
            api_key: application.api_key,
            collective
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            collective = res.body;
            done();
          })
      });

      afterEach('restore emailLib', () => emailLib.sendMessageFromActivity.restore());

      it('sends an email to the host', done => {
        setTimeout(() => {
          const activity = emailLib.sendMessageFromActivity.args[0][0];
          expect(activity.type).to.equal('collective.created');
          expect(activity.data).to.have.property('collective');
          expect(activity.data).to.have.property('host');
          expect(activity.data).to.have.property('user');
          expect(emailLib.sendMessageFromActivity.args[0][1].User.email).to.equal(host.email);
          done();
        }, 200);

      });

      it('returns the attributes of the collective', () => {
        expect(collective).to.have.property('id');
        expect(collective).to.have.property('name');
        expect(collective).to.have.property('mission');
        expect(collective).to.have.property('description');
        expect(collective).to.have.property('longDescription');
        expect(collective).to.have.property('image');
        expect(collective).to.have.property('backgroundImage');
        expect(collective).to.have.property('createdAt');
        expect(collective).to.have.property('updatedAt');
        expect(collective).to.have.property('twitterHandle');
        expect(collective).to.have.property('website');
        expect(collective).to.have.property('isActive', true);
      });

      it('assigns the users as members', () => {
        return Promise.all([
          models.Member.findOne({ where: { MemberCollectiveId: host.CollectiveId, role: roles.HOST } }),
          models.Member.count({ where: { CollectiveId: collective.id, role: roles.ADMIN } }),
          models.Collective.find({ where: { slug: collective.slug } })
          ])
        .then(results => {
          expect(results[0].CollectiveId).to.equal(collective.id);
          expect(results[1]).to.equal(2);
          expect(results[2].LastEditedByUserId).to.equal(3);
        });
      });

    });

  });

  /**
   * Create from Github
   */
  describe('#createFromGithub', () => {

    it('fails creating a collective if param value is not github', () =>
      request(app)
        .post('/collectives?flow=blah')
        .send({
          payload: publicCollectiveData
        })
        .expect(400)
    );

    it('fails creating a collective if no api key', () =>
      request(app)
        .post('/collectives?flow=github')
        .send({
          payload: publicCollectiveData
        })
        .expect(400)
    );

    it('fails creating a collective without payload', () =>
      request(app)
        .post('/collectives?flow=github')
        .send({
          collective: publicCollectiveData,
          api_key: application.api_key
        })
        .expect(400)
    );

    describe('Successfully create a collective and ', () => {

      const { ConnectedAccount } = models;

      beforeEach(() => {
        const { User } = models;

        // create connected account like the oauth happened
        let preCA;
        return ConnectedAccount.create({
          username: 'asood123',
          service: 'github',
          secret: 'xxxxx'
        })
        .then(ca => {
          preCA = ca;
          return User.createUserWithCollective({email: 'githubuser@gmail.com'});
        })
        .then(user => user.collective.addConnectedAccount(preCA));
      });

      beforeEach(() => sinon.spy(emailLib, 'send'));

      afterEach(() => emailLib.send.restore());

      it('assigns contributors as users with connectedAccounts', () =>
        request(app)
        .post('/collectives?flow=github')
        .set('Authorization', `Bearer ${user.jwt({ scope: 'connected-account', username: 'asood123', connectedAccountId: 1 })}`)
        .send({
          payload: {
            collective: {
              name:'Loot',
              slug:'Loot',
              mission: 'mission statement'
            },
            users: ['asood123', 'oc'],
            github_username: 'asood123'
          },
          api_key: application.api_key
        })
        .expect(200)
        .toPromise()
        .tap(res => {
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name', 'Loot');
          expect(res.body).to.have.property('slug', 'loot');
          expect(res.body).to.have.property('mission', 'mission statement');
          expect(res.body).to.have.property('description');
          expect(res.body).to.have.property('longDescription');
          expect(res.body).to.have.property('isActive', false);
          expect(emailLib.send.lastCall.args[1]).to.equal('githubuser@gmail.com');
        })
        .then(() => ConnectedAccount.findOne({where: { username: 'asood123' }}))
        .then(ca => {
          expect(ca).to.have.property('service', 'github');
          return ca.getCollective();
        })
        .then(userCollective => expect(userCollective).to.exist)
        .then(() => ConnectedAccount.findOne({ where: { username: 'oc' } }))
        .then(ca => {
          expect(ca).to.have.property('service', 'github');
          return ca.getCollective();
        })
        .tap(userCollective => expect(userCollective).to.exist)
        .then(userCollective => models.User.findById(userCollective.CreatedByUserId))
        .then(user => user.getCollectives({ paranoid: false })) // because we are setting deletedAt
        .tap(collectives => expect(collectives).to.have.length(1))
        .tap(collectives => expect(collectives[0].LastEditedByUserId).to.equal(3))
        .then(() => models.Member.findAll())
        .then(Members => {
          expect(Members).to.have.length(3);
          expect(Members[0]).to.have.property('role', roles.ADMIN);
          expect(Members[1]).to.have.property('role', roles.HOST);
          expect(Members[2]).to.have.property('role', roles.ADMIN);
          return null;
        }))
    });

  });

  /**
   * Get.
   */
  describe('#get', () => {

    let publicCollective;

    const stubStripe = () => {
      const stub = sinon.stub(appStripe.accounts, 'create');
      const mock = stripeMock.accounts.create;
      mock.email = chance.email();
      stub.yields(null, mock);
    };

    // beforeEach(() => utils.resetTestDB());

    beforeEach(() => {
      appStripe.accounts.create.restore();
      stubStripe();
    });

    // Create the public collective with user.
    beforeEach('create public collective with host', (done) => {
      request(app)
        .post('/collectives')
        .send({
          api_key: application.api_key,
          collective: Object.assign({}, publicCollectiveData, { isActive: true, slug: 'another', HostCollectiveId: host.CollectiveId, users: [ Object.assign({}, userData, { role: roles.ADMIN} )]})
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          models.Collective
            .findById(parseInt(res.body.id))
            .then((g) => {
              publicCollective = g;
              done();
            })
            .catch(done);
        });
    });

    const stripeAccount = { data: { publishableKey: stripeMock.accounts.create.keys.publishable } };
    beforeEach(() => host.collective
      .setStripeAccount(stripeAccount)
      .then(() => user.collective.setStripeAccount(stripeAccount)));

    beforeEach('create a new payment method for user', () => models.PaymentMethod.create({CollectiveId: user.CollectiveId}))

    // Create a transaction for collective1.
    beforeEach('create a transaction for collective 1', () =>
      models.Transaction.create({
        ...transactionsData[8],
        netAmountInCollectiveCurrency: transactionsData[8].amount,
        CreatedByUserId: user.id,
        FromCollectiveId: user.CollectiveId,
        ToCollectiveId: publicCollective.id,
        HostCollectiveId: host.CollectiveId
      }));

    beforeEach('add user as backer', () => models.Member.create({
      role: roles.BACKER,
      MemberCollectiveId: user.CollectiveId,
      CollectiveId: publicCollective.id
    }));

    it('fails getting an undefined collective', () =>
      request(app)
        .get(`/collectives/undefined?api_key=${application.api_key}`)
        .expect(404)
    );

    it('successfully get a collective', (done) => {
      request(app)
        .get(`/collectives/${publicCollective.id}?api_key=${application.api_key}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', publicCollective.id);
          expect(res.body).to.have.property('name', publicCollective.name);
          expect(res.body).to.have.property('isActive', true);
          expect(res.body).to.have.property('yearlyIncome');
          expect(res.body).to.have.property('backersCount');
          expect(res.body).to.have.property('related');
          expect(res.body.tags).to.eql(publicCollective.tags);
          expect(res.body).to.have.property('isSupercollective', false);
          done();
        });
    });

    it('successfully get a collective by its slug (case insensitive)', (done) => {
      request(app)
        .get(`/collectives/${publicCollective.slug.toUpperCase()}?api_key=${application.api_key}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', publicCollective.id);
          expect(res.body).to.have.property('name', publicCollective.name);
          expect(res.body).to.have.property('isActive', true);
          done();
        });
    });

    describe('Transactions/Budget', () => {

      const transactions = [];
      let totTransactions = 0;
      let totDonations = 0;

      // Create collective2
      beforeEach('create collective 2', () =>
        models.Collective.create({HostCollectiveId: host.CollectiveId, name: "collective 2", slug: "collective2"}));

        // Create transactions for publicCollective.
      beforeEach('create transactions for public collective', (done) => {
        async.each(transactionsData, (transaction, cb) => {
          if (transaction.amount < 0)
            totTransactions += transaction.amount;
          else
            totDonations += transaction.amount;

          request(app)
            .post(`/collectives/${publicCollective.id}/transactions`)
            .set('Authorization', `Bearer ${user.jwt()}`)
            .send({
              api_key: application.api_key,
              transaction: _.extend({}, transaction, { netAmountInCollectiveCurrency: transaction.amount, approved: true })
            })
            .expect(200)
            .end((e, res) => {
              expect(e).to.not.exist;
              transactions.push(res.body);
              cb();
            });
        }, done);
      });

      // Create a subscription for PublicCollective.
      beforeEach(() => models.Subscription
        .create(utils.data('subscription1'))
        .then(subscription => models.Order.create({
          amount: 999,
          currency: 'USD',
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          ToCollectiveId: publicCollective.id,
          SubscriptionId: subscription.id
        }))
        .then(order => models.Transaction.createFromPayload({
            transaction: Object.assign({}, transactionsData[7], { netAmountInCollectiveCurrency: transactionsData[7].amount, OrderId: order.id}),
            CreatedByUserId: user.id,
            FromCollectiveId: user.CollectiveId,
            ToCollectiveId: publicCollective.id,
          })));

      it('successfully get a collective with remaining budget and yearlyIncome', (done) => {
        request(app)
          .get(`/collectives/${publicCollective.id}`)
          .send({
            api_key: application.api_key
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            const g = res.body;
            expect(g).to.have.property('balance', parseInt((totDonations + totTransactions + transactionsData[7].amount + transactionsData[8].amount).toFixed(0), 10));
            expect(g).to.have.property('yearlyIncome', (transactionsData[7].amount + transactionsData[7].amount * 12)); // one is a single payment and other is a subscription
            done();
          });
      });

      it('successfully get a collective\'s backers', (done) => {
        request(app)
          .get(`/collectives/${publicCollective.id}/backers?api_key=${application.api_key}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            const userData = res.body[0];
            expect(userData.firstName).to.equal(user.public.firstName);
            expect(userData.lastName).to.equal(user.public.lastName);
            expect(userData.name).to.equal(`${user.public.firstName} ${user.public.lastName}`);
            expect(userData.role).to.equal(roles.BACKER);
            done();
          });
      });

    });

  });

  /**
   * Update.
   */
  describe('#update', () => {

    let collective;
    let user2;
    let user3;
    let user4;
    const collectiveNew = {
      name: 'new name',
      mission: 'new mission',
      description: 'new desc',
      longDescription: 'long description',
      budget: 1000000,
      burnrate: 10000,
      image: 'http://opencollective.com/assets/image.svg',
      backgroundImage: 'http://opencollective.com/assets/backgroundImage.png',
      isActive: true,
      settings: { lang: 'fr' },
      otherprop: 'value'
    };

    // Create the collective with user.
    beforeEach('create public collective with host', (done) => {
      request(app)
        .post('/collectives')
        .send({
          api_key: application.api_key,
          collective: Object.assign({}, publicCollectiveData, {
            slug: 'public-collective',
            name: 'public collective with host',
            HostCollectiveId: host.CollectiveId,
            users: [ Object.assign({}, userData, { role: roles.ADMIN} ) ]
          })
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          models.Collective
            .findById(parseInt(res.body.id))
            .then((g) => {
              collective = g;
              done();
            })
            .catch(done);
        });
    });

    // Create another user.
    beforeEach(() => models.User.createUserWithCollective(utils.data('user2')).then(u => user2 = u));

    // Create another user that is a backer.
    beforeEach(() => models.User.createUserWithCollective(utils.data('user3'))
      .tap(u => user3 = u)
      .then(() => collective.addUserWithRole(user3, roles.BACKER)));

    // Create another user that is a member.
    beforeEach(() => models.User.createUserWithCollective(utils.data('user4'))
      .tap(u => user4 = u)
      .then(() => collective.addUserWithRole(user4, roles.ADMIN)));

    it('fails updating a collective if not authenticated', (done) => {
      request(app)
        .put(`/collectives/${collective.id}`)
        .send({
          api_key: application.api_key,
          collective: collectiveNew
        })
        .expect(401)
        .end(done);
    });

    it('fails updating a collective if the user authenticated has no access', (done) => {
      request(app)
        .put(`/collectives/${collective.id}`)
        .set('Authorization', `Bearer ${user2.jwt()}`)
        .send({
          api_key: application.api_key,
          collective: collectiveNew
        })
        .expect(403)
        .end(done);
    });

    it('fails updating a collective if the user authenticated is a viewer', (done) => {
      request(app)
        .put(`/collectives/${collective.id}`)
        .set('Authorization', `Bearer ${user3.jwt()}`)
        .send({
          api_key: application.api_key,
          collective: collectiveNew
        })
        .expect(403)
        .end(done);
    });

    it('fails updating a collective if no data passed', (done) => {
      request(app)
        .put(`/collectives/${collective.id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(400)
        .end(done);
    });

    it('successfully updates a collective if authenticated as a ADMIN', (done) => {
      request(app)
        .put(`/collectives/${collective.id}`)
        .set('Authorization', `Bearer ${user4.jwt()}`)
        .send({
          api_key: application.api_key,
          collective: collectiveNew
        })
        .expect(200)
        .end(done);
    });

    it('successfully udpates a collective if authenticated as a user', (done) => {
      request(app)
        .put(`/collectives/${collective.id}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          api_key: application.api_key,
          collective: collectiveNew
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', collective.id);
          expect(res.body).to.have.property('name', collectiveNew.name);
          expect(res.body).to.have.property('mission', collectiveNew.mission);
          expect(res.body).to.have.property('description', collectiveNew.description);
          expect(res.body).to.have.property('longDescription', collectiveNew.longDescription);
          expect(res.body.settings).to.have.property('lang', collectiveNew.settings.lang);
          expect(res.body).to.have.property('image', collectiveNew.image);
          expect(res.body).to.have.property('backgroundImage', collectiveNew.backgroundImage);
          expect(res.body).to.have.property('isActive', collectiveNew.isActive);
          expect(res.body).to.not.have.property('otherprop');
          expect(new Date(res.body.createdAt).getTime()).to.equal(new Date(collective.createdAt).getTime());
          expect(new Date(res.body.updatedAt).getTime()).to.not.equal(new Date(collective.updatedAt).getTime());
          done();
        });
    });

    it('successfully create a collective with HOST and assign same person to be a ADMIN and a BACKER', () =>
      /* TODO: this works but we'll need to do a lot refactoring.
       * Need to find a way to call this with one line: like collective.addUser()
       */
      models.Member.create({
        MemberCollectiveId: user3.CollectiveId,
        CollectiveId: collective.id,
        role: roles.ADMIN
      })
      .then(() => models.Member.findAll({ where: { MemberCollectiveId: user3.CollectiveId, CollectiveId: collective.id }}))
      .tap(rows => expect(rows.length).to.equal(2)));
  });

});
