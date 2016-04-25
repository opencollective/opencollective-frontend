/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var expect = require('chai').expect;
var sinon = require('sinon');
var request = require('supertest');
var utils = require('../test/utils.js')();
var roles = require('../server/constants/roles');

/**
 * Variables.
 */
var groupData = utils.data('group1');
var activitiesData = utils.data('activities1').activities;
var models = app.set('models');

/**
 * Tests.
 */
describe('activities.routes.test.js', () => {

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

  // Create activities.
  beforeEach((done) => {
    async.eachSeries(activitiesData, (a, cb) => {
      models.Activity.create(a).done(cb);
    }, done);
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  /**
   * Get group's activities.
   */
  describe('#group', () => {

    it('fails getting activities if not member of the group', (done) => {
      request(app)
        .get('/groups/' + group.id + '/activities')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully get a group\'s activities', (done) => {
      request(app)
        .get('/groups/' + group.id + '/activities')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;

          var activities = res.body;
          expect(activities.length).to.equal(12);
          activities.forEach((a) => {
            expect(a.GroupId).to.equal(group.id);
          });
          done();

        });
    });

    describe('Pagination', () => {

      var perPage = 3;

      it('successfully get a group\'s activities with per_page', (done) => {
        request(app)
          .get('/groups/' + group.id + '/activities')
          .send({
            per_page: perPage,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body.length).to.equal(3);
            expect(res.body[0].id).to.equal(4);

            // Check pagination header.
            var headers = res.headers;
            expect(headers).to.have.property('link');
            expect(headers.link).to.contain('next');
            expect(headers.link).to.contain('page=2');
            expect(headers.link).to.contain('current');
            expect(headers.link).to.contain('page=1');
            expect(headers.link).to.contain('per_page=' + perPage);
            expect(headers.link).to.contain('/groups/' + group.id + '/activities');
            var tot = _.reduce(activitiesData, (memo, el) => { return memo + ((el.GroupId === group.id) ? 1 : 0); }, 0);
            expect(headers.link).to.contain('/groups/1/activities?page=' + Math.ceil(tot / perPage) + '&per_page=' + perPage + '>; rel="last"');

            done();
          });
      });

      it('successfully get the second page of a group\'s activities', (done) => {
        var page = 2;
        request(app)
          .get('/groups/' + group.id + '/activities')
          .send({
            per_page: perPage,
            page: page,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body.length).to.equal(3);
            expect(res.body[0].id).to.equal(7);

            // Check pagination header.
            var headers = res.headers;
            expect(headers.link).to.contain('page=3');
            expect(headers.link).to.contain('page=2');
            done();
          });
      });

      it('successfully get a group\'s activities using since_id', (done) => {
        var sinceId = 8;

        request(app)
          .get('/groups/' + group.id + '/activities')
          .send({
            since_id: sinceId,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            var activities = res.body;
            expect(activities[0].id > sinceId).to.be.true;
            var last = 0;
            _.each(activities, (a) => {
              expect(a.id >= last).to.be.true;
            });

            // Check pagination header.
            var headers = res.headers;
            expect(headers.link).to.be.empty;
            done();
          });

      });

    });

    describe('Sorting', () => {

      it('successfully get a group\'s activities with sorting', (done) => {
        request(app)
          .get('/groups/' + group.id + '/activities')
          .send({
            sort: 'createdAt',
            direction: 'desc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            var activities = res.body;
            var last = new Date();
            _.each(activities, (a) => {
              expect((new Date(a.createdAt) <= new Date(last))).to.be.true;
              last = a.createdAt;
            });
            done();
          });
      });

    });

  });

  /**
   * Get user's activities.
   */
  describe('#user', () => {

    it('fails getting other user\'s activities', (done) => {
      request(app)
        .get('/users/' + user.id + '/activities')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully get a user\'s activities', (done) => {
      request(app)
        .get('/users/' + user.id + '/activities')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;

          var activities = res.body;
          expect(activities.length).to.equal(6);
          activities.forEach((a) => {
            expect(a.UserId).to.equal(user.id);
          });
          done();

        });
    });

  });

});
