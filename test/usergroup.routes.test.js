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
let users, group;

/**
 * Functions
 */
const createTransactions = () => {

  const transactions = [{
    UserId: users[2].id,
    GroupId: group.id,
    amount: 2000,
    amountInTxnCurrency: 2000,
    createdAt: '2016-05-07 19:52:21.203+00',
    updatedAt: '2016-05-07 19:52:21.203+00'
  },
  {
    UserId: users[3].id,
    GroupId: group.id,
    amount: 10000,
    amountInTxnCurrency: 10000,
    createdAt: '2016-05-07 19:52:21.203+00',
    updatedAt: '2016-05-07 19:52:21.203+00'
  }];

  return group
    .addUserWithRole(users[3], roles.BACKER)
    .then(() => models.Transaction.createMany(transactions));
};

describe('usergroup.routes.test.js', () => {

  beforeEach(() => utils.resetTestDB());

  // Create users.
  beforeEach(() =>
    Promise.map(['user1','user2','user3', 'user4'], u => models.User.create(utils.data(u)))
      .tap(results => users = results));

  // Create group.
  beforeEach(() => models.Group.create(utils.data('group1')).tap(g => group = g));
    

  // Add the host and a backer to the group.
  beforeEach((done) => {
    const promises = [group.addUserWithRole(users[0], roles.HOST),
                      group.addUserWithRole(users[1], roles.MEMBER),
                      group.addUserWithRole(users[2], roles.BACKER)
                      ];
    Promise.all(promises).then(() => done() );
  });

  /**
   * Add user to a group.
   */
  describe('#addUser', () => {

    it('fails adding a non-existing user to a group', (done) => {
      request(app)
        .post(`/groups/${group.id}/users/98765?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(404)
        .end(done);
    });

    it('fails adding a user to a non-existing group', (done) => {
      request(app)
        .post(`/groups/98765/users/${users[1].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(404)
        .end(done);
    });

    it('fails adding a user with a non-existing role', (done) => {
      request(app)
        .post(`/groups/${group.id}/users/${users[1].id}`)
        .send({
          api_key: application.api_key,
          role: 'nonexistingrole'
        })
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(400)
        .end(done);
    });

    it('fails adding a user to a group if not a member of the group', (done) => {
      request(app)
        .post(`/groups/${group.id}/users/${users[2].id}`)
        .send({
          api_key: application.api_key,
          role: 'MEMBER'
        })
        .set('Authorization', `Bearer ${users[2].jwt()}`)
        .expect(403)
        .end(done);
    });

    it('fails adding a user to a group if no host', (done) => {
      request(app)
        .post(`/groups/${group.id}/users/${users[1].id}`)
        .send({
          api_key: application.api_key,
          role: 'nonexistingrole'
        })
        .set('Authorization', `Bearer ${users[2].jwt()}`)
        .expect(403)
        .end(done);
    });

    it('fails adding a host if the group already has one', (done) => {
      request(app)
        .post(`/groups/${group.id}/users/${users[1].id}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'Group already has a host'
          }
        })
        .send({
          api_key: application.api_key,
          role: roles.HOST
        })
        .end(done)
    });

    it('successfully add a user to a group', (done) => {
      request(app)
        .post(`/groups/${group.id}/users/${users[1].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          users[1].getGroups().then((groups) => {
            expect(groups[0].id).to.equal(group.id);
            expect(groups[0].UserGroup.role).to.equal(roles.BACKER);
            done();
          });

        });
    });

    it('successfully add a user to a group with a role', (done) => {
      const role = roles.MEMBER;

      request(app)
        .post(`/groups/${group.id}/users/${users[2].id}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .send({
          api_key: application.api_key,
          role
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          users[1].getGroups().then((groups) => {
            expect(groups[0].id).to.equal(group.id);
            expect(groups[0].UserGroup.role).to.equal(role);

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
        GroupId: group.id,
        UserId: users[2].id,
        type: 'mailinglist.members'
      }}).then(notification => {
        expect(notification).to.not.exist;
      })
      .then(() => {
        request(app)
          .post(`/groups/${group.id}/users/${users[2].id}`)
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
              GroupId: group.id,
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
   * Get user's groups.
   */
  describe('#getUserGroups', () => {

    beforeEach('add users[0] to group', () =>
      request(app)
        .post(`/groups/${group.id}/users/${users[0].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(200));

    it('successfully get another user\'s groups', () =>
      request(app)
        .get(`/users/${users[0].id}/groups?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[1].jwt()}`)
        .expect(200));

    it('successfully get a user\'s groups', (done) => {
      request(app)
        .get(`/users/${users[1].id}/groups?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[1].jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(1);
          done();
        });
    });

    it('successfully get a user\'s groups bis', (done) => {
      request(app)
        .get(`/users/${users[0].id}/groups?api_key=${application.api_key}`)
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

    it('successfully get a user\'s groups with the role', (done) => {
      request(app)
        .get(`/users/${users[0].id}/groups?include=usergroup.role&api_key=${application.api_key}`)
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
   * Update a user-group relation.
   */
  describe('#updateUserGroup', () => {

    it('fails if not the host', (done) => {
      request(app)
        .put(`/groups/${group.id}/users/${users[0].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[2].jwt()}`)
        .expect(403)
        .end(done);
    });

    it('fails if the user is not part of the group yet', (done) => {
      request(app)
        .put(`/groups/${group.id}/users/${users[3].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(404)
        .end(done);
    });

    it('successfully update a user-group relation', (done) => {
      const role = roles.MEMBER;
      request(app)
        .put(`/groups/${group.id}/users/${users[2].id}?api_key=${application.api_key}`)
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
          models.Activity.findAndCountAll({where: {type: 'group.user.updated'} }).then((res) => {
            expect(res.count).to.equal(2);
            done();
          });
        });
    });

  });

  /**
   * Delete a user-group relation.
   */
  describe('#deleteUserGroup', () => {

    it('fails if not the host', () =>
      request(app)
        .del(`/groups/${group.id}/users/${users[0].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[2].jwt()}`)
        .expect(403));

    it('fails if the user is not part of the group yet', () =>
      request(app)
        .del(`/groups/${group.id}/users/${users[3].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(404));

    it('successfully update a user-group relation', (done) => {
      request(app)
        .del(`/groups/${group.id}/users/${users[2].id}?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${users[0].jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          async.parallel([
            (cb) => {
              // Check usergroup.
              const query = {
                where: {
                  GroupId: group.id,
                  UserId: users[2].id
                }
              };
              models.UserGroup.findAndCountAll(query).then((res) => {
                expect(res.count).to.equal(0);
                cb();
              });
            },
            (cb) => {
              // Check activities.
              models.Activity.findAndCountAll({where: {type: 'group.user.deleted'} }).then((res) => {
                expect(res.count).to.equal(2);
                cb();
              });
            }
          ], done);

        });
    });

  });

  /**
   * Get a group's users
   */
  describe('/groups/:slug/users', () => {

    beforeEach(createTransactions);

    it('get the list of users with their corresponding tier', () =>
      request(app)
        .get(`/groups/${group.slug}/users?api_key=${application.api_key}`)
        .expect(200)
        .toPromise()
        .tap(res => {
          const users = res.body;
          expect(users).to.have.length(4);
          users.sort((a,b) => (a.firstName < b.firstName) ? -1 : 1);
          expect(users[0].tier).to.equal('core contributor');
          expect(users[1].tier).to.equal('sponsor');
          expect(users[2].tier).to.equal('host');
          expect(users[3].tier).to.equal('backer');
        })
    );

    it('get the list of *active* users with their corresponding tier', (done) => {
      request(app)
        .get(`/groups/${group.slug}/users?filter=active&api_key=${application.api_key}`)
        .expect(200)
        .expect((res) => {
          const users = res.body;
          expect(users).to.have.length(3);
          users.sort((a,b) => (a.firstName < b.firstName) ? -1 : 1);
          expect(users[0].tier).to.equal('core contributor');
        })
        .end(done);
    });

    it('get the list of users in csv format without emails if not logged in as admin', (done) => {
      request(app)
        .get(`/groups/${group.slug}/users.csv?api_key=${application.api_key}`)
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
          expect(getValue(0, "tier")).to.equal('"core contributor"');
          expect(getValue(1, "tier")).to.equal('"sponsor"');
          expect(getValue(2, "tier")).to.equal('"host"');
          expect(getValue(3, "tier")).to.equal('"backer"');
          expect(headers).to.not.contain('"email"');
        })
        .end(done);
    });

    it('get the list of users in csv format without emails if logged in as backer', (done) => {
      request(app)
        .get(`/groups/${group.slug}/users.csv?api_key=${application.api_key}`)
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
        .get(`/groups/${group.slug}/users.csv?api_key=${application.api_key}`)
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
