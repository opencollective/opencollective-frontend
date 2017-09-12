import app from '../server/index';
import {expect} from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import Promise from 'bluebird';
import models from '../server/models';

/**
 * Variables.
 */
const application = utils.data('application');
let users, collective;

/**
 * Functions
 */
const createTransactions = () => {

  const transactions = [{
    CreatedByUserId: users[2].id,
    FromCollectiveId: users[2].CollectiveId,
    CollectiveId: collective.id,
    amount: 2000,
    amountInHostCurrency: 2000,
    createdAt: '2016-05-07 19:52:21.203+00',
    updatedAt: '2016-05-07 19:52:21.203+00'
  },
  {
    CreatedByUserId: users[3].id,
    FromCollectiveId: users[3].CollectiveId,
    CollectiveId: collective.id,
    amount: 10000,
    amountInHostCurrency: 10000,
    createdAt: '2016-05-07 19:52:21.203+00',
    updatedAt: '2016-05-07 19:52:21.203+00'
  }];

  return collective
    .addUserWithRole(users[3], roles.BACKER)
    .then(() => models.Transaction.createMany(transactions, { HostCollectiveId: 1 }));
};

describe('members.routes.test.js', () => {

  beforeEach(() => utils.resetTestDB());

  // Create users.
  beforeEach(() =>
    Promise.map(['user1', 'user2', 'user3', 'user4'], u => models.User.createUserWithCollective(utils.data(u)))
      .tap(results => users = results));

  // Create collective.
  beforeEach('create a collective', () => models.Collective.create(utils.data('collective1')).tap(g => collective = g));

  // Add the host and a backer to the collective.
  beforeEach('add host and backer', (done) => {
    const promises = [
      collective.addUserWithRole(users[0], roles.HOST),
      collective.addUserWithRole(users[1], roles.ADMIN),
      collective.addUserWithRole(users[2], roles.BACKER)
    ];
    Promise.all(promises).then(() => done() );
  });

  /**
   * Add user to a collective.
   */
  describe('#addUser', () => {

    it('fails adding a non-existing user to a collective', (done) => {
      request(app)
        .post(`/collectives/${collective.id}/users/98765?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(404)
        .end(done);
    });

    it('fails adding a user to a non-existing collective', (done) => {
      request(app)
        .post(`/collectives/98765/users/${users[1].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(404)
        .end(done);
    });

    it('fails adding a user with a non-existing role', (done) => {
      request(app)
        .post(`/collectives/${collective.id}/users/${users[1].id}`)
        .send({
          api_key: application.api_key,
          role: 'nonexistingrole'
        })
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(400)
        .end(done);
    });

    it('fails adding a user to a collective if not a member of the collective', (done) => {
      request(app)
        .post(`/collectives/${collective.id}/users/${users[2].id}`)
        .send({
          api_key: application.api_key,
          role: 'ADMIN'
        })
        .set('Authorization', `Bearer ${users[2].jwt()}`)
        .expect(403)
        .end(done);
    });

    it('fails adding a user to a collective if no host', (done) => {
      request(app)
        .post(`/collectives/${collective.id}/users/${users[1].id}`)
        .send({
          api_key: application.api_key,
          role: 'nonexistingrole'
        })
        .set('Authorization', `Bearer ${users[2].jwt()}`)
        .expect(403)
        .end(done);
    });

    it('fails adding a host if the collective already has one', (done) => {
      request(app)
        .post(`/collectives/${collective.id}/users/${users[1].id}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'Collective already has a host'
          }
        })
        .send({
          api_key: application.api_key,
          role: roles.HOST
        })
        .end(done)
    });

    it('successfully add a user to a collective', (done) => {
      request(app)
        .post(`/collectives/${collective.id}/users/${users[1].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          users[1].getMemberships().then((memberships) => {
            expect(memberships[0].CollectiveId).to.equal(collective.id);
            expect(memberships[0].role).to.equal(roles.ADMIN);
            expect(memberships[1].role).to.equal(roles.BACKER);
            done();
          });
        });
    });

    it('successfully add a user to a collective with a role', (done) => {
      const role = roles.ADMIN;
      request(app)
        .post(`/collectives/${collective.id}/users/${users[2].id}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .send({
          api_key: application.api_key,
          role
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          users[1].getMemberships().then((memberships) => {
            expect(memberships[0].CollectiveId).to.equal(collective.id);
            expect(memberships[0].role).to.equal(role);

            setTimeout(() => {
              models.Activity.findAndCountAll({}).then((res) => {
                expect(res.count).to.equal(1);
                done();
              });
            }, 50);
          });

        });
    });

    it('successfully adds the user to the mailing list', (done) => {
      models.Notification.findOne({where: {
        CollectiveId: collective.id,
        UserId: users[2].id,
        type: 'mailinglist.admins'
      }}).then(notification => {
        expect(notification).to.not.exist;
      })
      .then(() => {
        request(app)
          .post(`/collectives/${collective.id}/users/${users[2].id}`)
          .set('Authorization', `Bearer ${users[0].jwt()}`)
          .send({
            api_key: application.api_key,
            role: roles.ADMIN
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body).to.have.property('success', true);

            models.Notification.findOne({where: {
              CollectiveId: collective.id,
              UserId: users[2].id,
              type: 'mailinglist.admins'
            }}).then(notification => {
              expect(notification.type).to.equal('mailinglist.admins');
              expect(notification.channel).to.equal('email');
              expect(notification.active).to.be.true;
              done();
            });
          });
      });
    });
  });

  /**
   * Get a collective's users
   */
  describe('/collectives/:slug/users', () => {

    beforeEach(createTransactions);

    // Create the tiers
    beforeEach('create backer tier', () => models.Tier.create({...utils.data('tier1'), CollectiveId: collective.id }))
    beforeEach('create sponsor tier', () => models.Tier.create({...utils.data('tier2'), CollectiveId: collective.id }))

    // Add users to tiers
    beforeEach('add users to tiers', () => Promise.all([
      models.Order.create({ CreatedByUserId: users[2].id, FromCollectiveId: users[2].CollectiveId, CollectiveId: 1, TierId: 1, processedAt: new Date }),
      models.Order.create({ CreatedByUserId: users[3].id, FromCollectiveId: users[3].CollectiveId, CollectiveId: 1, TierId: 2, processedAt: new Date })
    ]));

    // Add active and non active subscription
    beforeEach('add active subscription', () => Promise.all([
      models.Order.create({FromCollectiveId: users[2].CollectiveId, CollectiveId: collective.id, CreatedByUserId: users[2].id, TierId: 1, Subscription: { isActive: true }}, { include: [ { model: models.Subscription } ] }),
      models.Order.create({FromCollectiveId: users[3].CollectiveId, CollectiveId: collective.id, CreatedByUserId: users[3].id, TierId: 2, Subscription: { isActive: false }}, { include: [ { model: models.Subscription } ] })
    ]));

    it('get the list of backers with their corresponding tier', () =>
      request(app)
        .get(`/collectives/${collective.slug}/backers?api_key=${application.api_key}`)
        .expect(200)
        .toPromise()
        .tap(res => {
          const backers = res.body;
          expect(backers).to.have.length(2);
          backers.sort((a,b) => (a.firstName < b.firstName) ? -1 : 1);
          expect(backers[0].role).to.equal('BACKER');
          expect(backers[1].role).to.equal('BACKER');
          expect(backers[1].tier.name).to.equal('backer');
          expect(backers[0].tier.name).to.equal('sponsor');
        })
    );

    it('get the list of *active* backers with their corresponding tier', (done) => {
      request(app)
        .get(`/collectives/${collective.slug}/backers?filter=active&api_key=${application.api_key}`)
        .expect(200)
        .expect((res) => {
          const backers = res.body;
          expect(backers).to.have.length(1);
          backers.sort((a,b) => (a.firstName < b.firstName) ? -1 : 1);
          expect(backers[0].tier.name).to.equal('backer');
        })
        .end(done);
    });

    it('get the list of backers in csv format without emails if not logged in as admin', (done) => {
      request(app)
        .get(`/collectives/${collective.slug}/backers.csv?api_key=${application.api_key}`)
        .expect(200)
        .expect((res) => {
          const headers = res.text.split('\n')[0].replace(/"/g, '').split(',');
          const backers = res.text.split('\n').slice(1);
          const getValue = (rowIndex, colName) => {
            const row = backers[rowIndex].split(',');
            return row[headers.indexOf(colName)];
          }
          expect(backers.length).to.equal(2);
          backers.sort((a,b) => (a.substr(0,1) < b.substr(0,1)) ? -1 : 1);
          expect(getValue(0, "role")).to.equal('"BACKER"');
          expect(getValue(0, "tier")).to.equal('"backer"');
          expect(getValue(1, "role")).to.equal('"BACKER"');
          expect(getValue(1, "tier")).to.equal('"sponsor"');
          expect(headers).to.not.contain('"email"');
        })
        .end(done);
    });

    it('get the list of backers in csv format without emails if logged in as backer', (done) => {
      request(app)
        .get(`/collectives/${collective.slug}/backers.csv?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[2].jwt()}`) // BACKER
        .expect(200)
        .expect((res) => {
          const headers = res.text.split('\n')[0];
          expect(headers).to.not.contain('"email"');
        })
        .end(done);
    });

    it('get the list of backers in csv format with emails if logged in as admin', (done) => {
      request(app)
        .get(`/collectives/${collective.slug}/backers.csv?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[1].jwt()}`) // ADMIN
        .expect(200)
        .expect((res) => {
          const headers = res.text.split('\n')[0].replace(/"/g, '').split(',');
          const backers = res.text.split('\n').slice(1);
          const getValue = (rowIndex, colName) => {
            const row = backers[rowIndex].split(',');
            return row[headers.indexOf(colName)];
          }
          expect(headers).to.contain('email');
          expect(getValue(0,"email")).to.contain('@');
        })
        .end(done);
    });    
  });
});
