/**
 * Dependencies.
 */
var app = require('../index');
var async = require('async');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();
var roles = require('../server/constants/roles');

/**
 * Variables.
 */
var models = app.set('models');
var users, group;

/**
 * Functions
 */
const createDonations = (cb) => {
  const donations = [{
    UserId: users[2].id,
    GroupId: group.id,
    amount: 2000
  },
  {
    UserId: users[3].id,
    GroupId: group.id,
    amount: 10000
  }];

  group
    .addUserWithRole(users[3], roles.BACKER)
    .then(() => {
      const promises = donations.map(d => models.Donation.create(d));
      Promise.all(promises).then(() => cb());
    });
};

/**
 * Tests.
 */
describe('usergroup.routes.test.js', () => {
  var application;

  beforeEach((done) => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  // Create users.
  beforeEach(function(done) {
    this.timeout(2000);
    utils.createUsers(['user1','user2','user3', 'user4'], (results) => {
      users = results;
      done();
    });
  });

  // Create group.
  beforeEach(() => models.Group.create(utils.data('group1')).tap(g => group = g));

  // Add the host and a backer to the group.
  beforeEach((done) => {
    const promises = [group.addUserWithRole(users[0], roles.HOST),
                      group.addUserWithRole(users[1], roles.MEMBER),
                      group.addUserWithRole(users[2], roles.BACKER)];
    Promise.all(promises).then(() => done() );
  });

  /**
   * Add user to a group.
   */
  describe('#addUser', () => {

    it('fails adding a non-existing user to a group', (done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + 98765)
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails adding a user to a non-existing group', (done) => {
      request(app)
        .post('/groups/' + 98765 + '/users/' + users[1].id)
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails adding a user with a non-existing role', (done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + users[1].id)
        .send({
          role: 'nonexistingrole'
        })
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .expect(400)
        .end(done);
    });

    it('fails adding a user to a group if not a member of the group', (done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + users[1].id)
        .send({
          role: 'nonexistingrole'
        })
        .set('Authorization', 'Bearer ' + users[1].jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails adding a user to a group if no host', (done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + users[1].id)
        .send({
          role: 'nonexistingrole'
        })
        .set('Authorization', 'Bearer ' + users[2].jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails adding a host if the group already has one', (done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + users[1].id)
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'Group already has a host'
          }
        })
        .send({
          role: roles.HOST
        })
        .end(done)
    });

    it('successfully add a user to a group', (done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + users[1].id)
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
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
      var role = roles.MEMBER;

      request(app)
        .post('/groups/' + group.id + '/users/' + users[2].id)
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .send({
          role: role
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

  });

  /**
   * Get user's groups.
   */
  describe('#getUserGroups', () => {

    beforeEach((done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + users[0].id)
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .expect(200)
        .end(done);
    });

    it('fails getting another user\'s groups', (done) => {
      request(app)
        .get('/users/' + users[0].id + '/groups')
        .set('Authorization', 'Bearer ' + users[1].jwt(application))
        .expect(403)
        .end((e, res) => {
          expect(e).to.not.exist;
          done();
        });
    });

    it('successfully get a user\'s groups', (done) => {
      request(app)
        .get('/users/' + users[1].id + '/groups')
        .set('Authorization', 'Bearer ' + users[1].jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(1);
          done();
        });
    });

    it('successfully get a user\'s groups bis', (done) => {
      request(app)
        .get('/users/' + users[0].id + '/groups')
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.have.property('id');
          expect(res.body[0]).to.have.property('name');
          expect(res.body[0]).to.have.property('description');
          expect(res.body[0]).to.not.have.property('Activities');
          done();
        });
    });

    it('successfully get a user\'s groups with activities', (done) => {
      request(app)
        .get('/users/' + users[0].id + '/groups?include=activities')
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.have.property('id');
          expect(res.body[0]).to.have.property('name');
          expect(res.body[0]).to.have.property('description');
          expect(res.body[0]).to.have.property('activities');
          expect(res.body[0].activities).to.have.length.above(0);
          done();
        });
    });

    it('successfully get a user\'s groups with the role', (done) => {
      request(app)
        .get('/users/' + users[0].id + '/groups?include=usergroup.role')
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
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

    it('fails if no access to the group', (done) => {
      request(app)
        .put('/groups/' + group.id + '/users/' + users[0].id)
        .set('Authorization', 'Bearer ' + users[1].jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if no host', (done) => {
      request(app)
        .put('/groups/' + group.id + '/users/' + users[0].id)
        .set('Authorization', 'Bearer ' + users[2].jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if the user is not part of the group yet', (done) => {
      request(app)
        .put('/groups/' + group.id + '/users/' + users[3].id)
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .expect(404)
        .end(done);
    });

    it('successfully update a user-group relation', (done) => {
      var role = roles.MEMBER;
      request(app)
        .put('/groups/' + group.id + '/users/' + users[2].id)
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .send({
          role: role
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

    it('fails if no access to the group', (done) => {
      request(app)
        .del('/groups/' + group.id + '/users/' + users[0].id)
        .set('Authorization', 'Bearer ' + users[1].jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if no host', (done) => {
      request(app)
        .del('/groups/' + group.id + '/users/' + users[0].id)
        .set('Authorization', 'Bearer ' + users[2].jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if the user is not part of the group yet', (done) => {
      request(app)
        .del('/groups/' + group.id + '/users/' + users[3].id)
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .expect(404)
        .end(done);
    });

    it('successfully update a user-group relation', (done) => {
      var role = 'member';
      request(app)
        .del('/groups/' + group.id + '/users/' + users[2].id)
        .set('Authorization', 'Bearer ' + users[0].jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          async.parallel([
            (cb) => {
              // Check usergroup.
              var query = {
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

    beforeEach(createDonations);

    it('get the list of users with their corresponding tier', (done) => {
      request(app)
        .get(`/groups/${group.slug}/users`)
        .expect(200)
        .expect((res) => {
          const users = res.body;
          expect(users[0].tier).to.equal('host');
          expect(users[1].tier).to.equal('contributor');
          expect(users[2].tier).to.equal('sponsor');
          expect(users[3].tier).to.equal('backer');
        })
        .end(done);
    });

  });
});
