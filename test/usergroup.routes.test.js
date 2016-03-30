/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var config = require('config');
var expect = require('chai').expect;
var sinon = require('sinon');
var request = require('supertest');
var utils = require('../test/utils.js')();
var roles = require('../app/constants/roles');

/**
 * Variables.
 */
var userData = utils.data('user1');
var groupData = utils.data('group1');
var models = app.set('models');

/**
 * Tests.
 */
describe('usergroup.routes.test.js', () => {
  var application;
  var user;
  var user2;
  var group;
  var sandbox = sinon.sandbox.create();

  beforeEach((done) => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  // Create users.
  beforeEach((done) => {
    models.User.create(utils.data('user1')).done((e, u) => {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  beforeEach((done) => {
    models.User.create(utils.data('user2')).done((e, u) => {
      expect(e).to.not.exist;
      user2 = u;
      done();
    });
  });

  beforeEach((done) => {
    models.User.create(utils.data('user3')).done((e, u) => {
      expect(e).to.not.exist;
      user3 = u;
      done();
    });
  });

  // Create group.
  beforeEach((done) => {
    models.Group.create(groupData).done((e, g) => {
      expect(e).to.not.exist;
      group = g;
      done();
    });
  });

  // Add an host to the group.
  beforeEach((done) => {
    group
      .addUserWithRole(user, roles.HOST)
      .done(done);
  });

  // Add an backer to the group.
  beforeEach((done) => {
    group
      .addUserWithRole(user3, roles.BACKER)
      .done(done);
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  /**
   * Add user to a group.
   */
  describe('#addUser', () => {

    it('fails adding a non-existing user to a group', (done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + 98765)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails adding a user to a non-existing group', (done) => {
      request(app)
        .post('/groups/' + 98765 + '/users/' + user2.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails adding a user with a non-existing role', (done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + user2.id)
        .send({
          role: 'nonexistingrole'
        })
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(400)
        .end(done);
    });

    it('fails adding a user to a group if not a member of the group', (done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + user2.id)
        .send({
          role: 'nonexistingrole'
        })
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails adding a user to a group if no host', (done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + user2.id)
        .send({
          role: 'nonexistingrole'
        })
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails adding a host if the group already has one', (done) => {
      request(app)
        .post('/groups/' + group.id + '/users/' + user2.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
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
        .post('/groups/' + group.id + '/users/' + user2.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          user2.getGroups().then((groups) => {
            expect(groups[0].id).to.equal(group.id);
            expect(groups[0].UserGroup.role).to.equal(roles.BACKER);
            done();
          });

        });
    });

    it('successfully add a user to a group with a role', (done) => {
      var role = roles.MEMBER;

      request(app)
        .post('/groups/' + group.id + '/users/' + user2.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          role: role
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          user2.getGroups().then((groups) => {
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
        .post('/groups/' + group.id + '/users/' + user.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(done);
    });

    it('fails getting another user\'s groups', (done) => {
      request(app)
        .get('/users/' + user.id + '/groups')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end((e, res) => {
          expect(e).to.not.exist;
          done();
        });
    });

    it('successfully get a user\'s groups', (done) => {
      request(app)
        .get('/users/' + user2.id + '/groups')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(0);
          done();
        });
    });

    it('successfully get a user\'s groups bis', (done) => {
      request(app)
        .get('/users/' + user.id + '/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
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
        .get('/users/' + user.id + '/groups?include=activities')
        .set('Authorization', 'Bearer ' + user.jwt(application))
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
        .get('/users/' + user.id + '/groups?include=usergroup.role')
        .set('Authorization', 'Bearer ' + user.jwt(application))
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
        .put('/groups/' + group.id + '/users/' + user.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if no host', (done) => {
      request(app)
        .put('/groups/' + group.id + '/users/' + user.id)
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if the user is not part of the group yet', (done) => {
      request(app)
        .put('/groups/' + group.id + '/users/' + user2.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('successfully update a user-group relation', (done) => {
      var role = roles.MEMBER;
      request(app)
        .put('/groups/' + group.id + '/users/' + user3.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
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
        .del('/groups/' + group.id + '/users/' + user.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if no host', (done) => {
      request(app)
        .del('/groups/' + group.id + '/users/' + user.id)
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if the user is not part of the group yet', (done) => {
      request(app)
        .del('/groups/' + group.id + '/users/' + user2.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('successfully update a user-group relation', (done) => {
      var role = 'member';
      request(app)
        .del('/groups/' + group.id + '/users/' + user3.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
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
                  UserId: user3.id
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

});
