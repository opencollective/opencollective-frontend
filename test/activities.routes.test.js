/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();
var roles = require('../app/constants/roles');

/**
 * Variables.
 */
var groupData = utils.data('group1');
var activitiesData = utils.data('activities1').activities;
var models = app.set('models');

/**
 * Tests.
 */
describe('activities.routes.test.js', function() {

  var application;
  var user;
  var user2;
  var group;

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  // Create users.
  beforeEach(function(done) {
    models.User.create(utils.data('user1')).done(function(e, u) {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });
  beforeEach(function(done) {
    models.User.create(utils.data('user2')).done(function(e, u) {
      expect(e).to.not.exist;
      user2 = u;
      done();
    });
  });
  beforeEach(function(done) {
    models.User.create(utils.data('user3')).done(function(e, u) {
      expect(e).to.not.exist;
      user3 = u;
      done();
    });
  });

  // Create group.
  beforeEach(function(done) {
    models.Group.create(groupData).done(function(e, g) {
      expect(e).to.not.exist;
      group = g;
      done();
    });
  });

  // Add an host to the group.
  beforeEach(function(done) {
    group
      .addUser(user, {role: roles.HOST})
      .done(done);
  });

  // Add an backer to the group.
  beforeEach(function(done) {
    group
      .addUser(user3, {role: roles.BACKER})
      .done(done);
  });

  // Create activities.
  beforeEach(function(done) {
    async.eachSeries(activitiesData, function(a, cb) {
      models.Activity.create(a).done(cb);
    }, done);
  });

  /**
   * Get group's activities.
   */
  describe('#group', function() {

    it('fails getting activities if not member of the group', function(done) {
      request(app)
        .get('/groups/' + group.id + '/activities')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully get a group\'s activities', function(done) {
      request(app)
        .get('/groups/' + group.id + '/activities')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;

          var activities = res.body;
          expect(activities.length).to.equal(9);
          activities.forEach(function(a) {
            expect(a.GroupId).to.equal(group.id);
          });
          done();

        });
    });

    describe('Pagination', function() {

      var perPage = 3;

      it('successfully get a group\'s activities with per_page', function(done) {
        request(app)
          .get('/groups/' + group.id + '/activities')
          .send({
            per_page: perPage,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end(function(e, res) {
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
            var tot = _.reduce(activitiesData, function(memo, el) { return memo + ((el.GroupId === group.id) ? 1 : 0); }, 0);
            expect(headers.link).to.contain('/groups/1/activities?page=' + Math.ceil(tot / perPage) + '&per_page=' + perPage + '>; rel="last"');

            done();
          });
      });

      it('successfully get the second page of a group\'s activities', function(done) {
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
          .end(function(e, res) {
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

      it('successfully get a group\'s activities using since_id', function(done) {
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
          .end(function(e, res) {
            expect(e).to.not.exist;
            var activities = res.body;
            expect(activities[0].id > sinceId).to.be.true;
            var last = 0;
            _.each(activities, function(a) {
              expect(a.id >= last).to.be.true;
            });

            // Check pagination header.
            var headers = res.headers;
            expect(headers.link).to.be.empty;
            done();
          });

      });

    });

    describe('Sorting', function() {

      it('successfully get a group\'s activities with sorting', function(done) {
        request(app)
          .get('/groups/' + group.id + '/activities')
          .send({
            sort: 'createdAt',
            direction: 'desc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            var activities = res.body;
            var last = new Date();
            _.each(activities, function(a) {
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
  describe('#user', function() {

    it('fails getting other user\'s activities', function(done) {
      request(app)
        .get('/users/' + user.id + '/activities')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully get a user\'s activities', function(done) {
      request(app)
        .get('/users/' + user.id + '/activities')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;

          var activities = res.body;
          expect(activities.length).to.equal(6);
          activities.forEach(function(a) {
            expect(a.UserId).to.equal(user.id);
          });
          done();

        });
    });

  });

});
