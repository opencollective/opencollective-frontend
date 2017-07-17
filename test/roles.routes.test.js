import app from '../server/index';
import async from 'async';
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
    UserId: users[2].id,
    CollectiveId: collective.id,
    amount: 2000,
    amountInTxnCurrency: 2000,
    createdAt: '2016-05-07 19:52:21.203+00',
    updatedAt: '2016-05-07 19:52:21.203+00'
  },
  {
    UserId: users[3].id,
    CollectiveId: collective.id,
    amount: 10000,
    amountInTxnCurrency: 10000,
    createdAt: '2016-05-07 19:52:21.203+00',
    updatedAt: '2016-05-07 19:52:21.203+00'
  }];

  return collective
    .addUserWithRole(users[3], roles.BACKER)
    .then(() => models.Transaction.createMany(transactions, { HostId: 1 }));
};

describe('role.routes.test.js', () => {

  beforeEach(() => utils.resetTestDB());

  // Create users.
  beforeEach(() =>
    Promise.map(['user1','user2','user3', 'user4'], u => models.User.create(utils.data(u)))
      .tap(results => users = results));

  // Create collective.
  beforeEach(() => models.Collective.create(utils.data('collective1')).tap(g => collective = g));

  // Add the host and a backer to the collective.
  beforeEach((done) => {
    const promises = [collective.addUserWithRole(users[0], roles.HOST),
                      collective.addUserWithRole(users[1], roles.MEMBER),
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
          role: 'MEMBER'
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

          users[1].getCollectives().then((collectives) => {
            expect(collectives[0].id).to.equal(collective.id);
            expect(collectives[0].Role.role).to.equal(roles.BACKER);
            done();
          });

        });
    });

    it('successfully add a user to a collective with a role', (done) => {
      const role = roles.MEMBER;

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

          users[1].getCollectives().then((collectives) => {
            expect(collectives[0].id).to.equal(collective.id);
            expect(collectives[0].Role.role).to.equal(role);

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
        type: 'mailinglist.members'
      }}).then(notification => {
        expect(notification).to.not.exist;
      })
      .then(() => {
        request(app)
          .post(`/collectives/${collective.id}/users/${users[2].id}`)
          .set('Authorization', `Bearer ${users[0].jwt()}`)
          .send({
            api_key: application.api_key,
            role: roles.MEMBER
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body).to.have.property('success', true);

            models.Notification.findOne({where: {
              CollectiveId: collective.id,
              UserId: users[2].id,
              type: 'mailinglist.members'
            }}).then(notification => {
              expect(notification.type).to.equal('mailinglist.members');
              expect(notification.channel).to.equal('email');
              expect(notification.active).to.be.true;
              done();
            });
          });
      });
    });
  });

  /**
   * Get user's collectives.
   */
  describe('#getRoles', () => {

    beforeEach('add users[0] to collective', () =>
      request(app)
        .post(`/collectives/${collective.id}/users/${users[0].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(200));

    it('successfully get another user\'s collectives', () =>
      request(app)
        .get(`/users/${users[0].id}/collectives?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[1].jwt()}`)
        .expect(200));

    it('successfully get a user\'s collectives', (done) => {
      request(app)
        .get(`/users/${users[1].id}/collectives?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[1].jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(1);
          done();
        });
    });

    it('successfully get a user\'s collectives bis', (done) => {
      request(app)
        .get(`/users/${users[0].id}/collectives?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.have.property('id');
          expect(res.body[0]).to.have.property('name');
          expect(res.body[0]).to.have.property('description');
          done();
        });
    });

    it('successfully get a user\'s collectives with the role', (done) => {
      request(app)
        .get(`/users/${users[0].id}/collectives?include=role&api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.have.property('id');
          expect(res.body[0]).to.have.property('name');
          expect(res.body[0]).to.have.property('description');
          expect(res.body[0]).to.have.property('role');
          done();
        });
    });

  });

  /**
   * Update a user-collective relation.
   */
  describe('#updateRole', () => {

    it('fails if not the host', (done) => {
      request(app)
        .put(`/collectives/${collective.id}/users/${users[0].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[2].jwt()}`)
        .expect(403)
        .end(done);
    });

    it('fails if the user is not part of the collective yet', (done) => {
      request(app)
        .put(`/collectives/${collective.id}/users/${users[3].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(404)
        .end(done);
    });

    it('successfully update a user-collective relation', (done) => {
      const role = roles.MEMBER;
      request(app)
        .put(`/collectives/${collective.id}/users/${users[2].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .send({
          api_key: application.api_key,
          role
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('role', role);

          // Check activities.
          models.Activity.findAndCountAll({where: {type: 'collective.user.updated'} }).then((res) => {
            expect(res.count).to.equal(2);
            done();
          });
        });
    });

  });

  /**
   * Delete a user-collective relation.
   */
  describe('#deleteRole', () => {

    it('fails if not the host', () =>
      request(app)
        .del(`/collectives/${collective.id}/users/${users[0].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[2].jwt()}`)
        .expect(403));

    it('fails if the user is not part of the collective yet', () =>
      request(app)
        .del(`/collectives/${collective.id}/users/${users[3].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(404));

    it('successfully update a user-collective relation', (done) => {
      request(app)
        .del(`/collectives/${collective.id}/users/${users[2].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          async.parallel([
            (cb) => {
              // Check role.
              const query = {
                where: {
                  CollectiveId: collective.id,
                  UserId: users[2].id
                }
              };
              models.Role.findAndCountAll(query).then((res) => {
                expect(res.count).to.equal(0);
                cb();
              });
            },
            (cb) => {
              // Check activities.
              models.Activity.findAndCountAll({where: {type: 'collective.user.deleted'} }).then((res) => {
                expect(res.count).to.equal(2);
                cb();
              });
            }
          ], done);

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
      models.Response.create({ UserId: users[2].id, CollectiveId: 1, TierId: 1, status: 'PROCESSED' }),
      models.Response.create({ UserId: users[3].id, CollectiveId: 1, TierId: 2, status: 'PROCESSED' })
    ]));

    // Add active and non active subscription
    beforeEach('add active subscription', () => Promise.all([
      models.Donation.create({CollectiveId: collective.id, UserId: users[2].id, Subscription: { isActive: true }}, { include: [ { model: models.Subscription } ] }),
      models.Donation.create({CollectiveId: collective.id, UserId: users[3].id, Subscription: { isActive: false }}, { include: [ { model: models.Subscription } ] })
    ]));

    it('get the list of users with their corresponding tier', () =>
      request(app)
        .get(`/collectives/${collective.slug}/users?api_key=${application.api_key}`)
        .expect(200)
        .toPromise()
        .tap(res => {
          const users = res.body;
          expect(users).to.have.length(4);
          users.sort((a,b) => (a.firstName < b.firstName) ? -1 : 1);
          expect(users[0].role).to.equal('MEMBER');
          expect(users[1].role).to.equal('BACKER');
          expect(users[1].tier.name).to.equal('sponsor');
          expect(users[2].role).to.equal('HOST');
          expect(users[3].role).to.equal('BACKER');
          expect(users[3].tier.name).to.equal('backer');
        })
    );

    it('get the list of *active* users with their corresponding tier', (done) => {
      request(app)
        .get(`/collectives/${collective.slug}/users?filter=active&api_key=${application.api_key}`)
        .expect(200)
        .expect((res) => {
          const users = res.body;
          expect(users).to.have.length(3);
          users.sort((a,b) => (a.firstName < b.firstName) ? -1 : 1);
          expect(users[2].tier.name).to.equal('backer');
        })
        .end(done);
    });

    it('get the list of users in csv format without emails if not logged in as admin', (done) => {
      request(app)
        .get(`/collectives/${collective.slug}/users.csv?api_key=${application.api_key}`)
        .expect(200)
        .expect((res) => {
          const headers = res.text.split('\n')[0].replace(/"/g, '').split(',');
          const users = res.text.split('\n').slice(1);
          const getValue = (rowIndex, colName) => {
            const row = users[rowIndex].split(',');
            return row[headers.indexOf(colName)];
          }
          expect(users.length).to.equal(4);
          users.sort((a,b) => (a.substr(22,1) < b.substr(22,1)) ? -1 : 1);
          expect(getValue(0, "role")).to.equal('"MEMBER"');
          expect(getValue(1, "tier")).to.equal('"backer"');
          expect(getValue(2, "tier")).to.equal('"sponsor"');
          expect(getValue(3, "role")).to.equal('"HOST"');
          expect(headers).to.not.contain('"email"');
        })
        .end(done);
    });

    it('get the list of users in csv format without emails if logged in as backer', (done) => {
      request(app)
        .get(`/collectives/${collective.slug}/users.csv?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[2].jwt()}`) // BACKER
        .expect(200)
        .expect((res) => {
          const headers = res.text.split('\n')[0];
          expect(headers).to.not.contain('"email"');
        })
        .end(done);
    });

    it('get the list of users in csv format with emails if logged in as admin', (done) => {
      request(app)
        .get(`/collectives/${collective.slug}/users.csv?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[1].jwt()}`) // MEMBER
        .expect(200)
        .expect((res) => {
          const headers = res.text.split('\n')[0].replace(/"/g, '').split(',');
          const users = res.text.split('\n').slice(1);
          const getValue = (rowIndex, colName) => {
            const row = users[rowIndex].split(',');
            return row[headers.indexOf(colName)];
          }
          expect(headers).to.contain('email');
          expect(getValue(0,"email")).to.contain('@');
        })
        .end(done);
    });    
  });
});
