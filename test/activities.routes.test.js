/**
 * Dependencies.
 */
var expect    = require('chai').expect
  , request   = require('supertest')
  , _         = require('underscore')
  , async     = require('async')
  , app       = require('../index')
  , utils     = require('../test/utils.js')()
  , config    = require('config')
  ;

/**
 * Variables.
 */
var userData = utils.data('user1');
var groupData = utils.data('group1');
var activitiesData = utils.data('activities1').activities;
var models = app.set('models');

/**
 * Tests.
 */
describe('activities.routes.test.js', function() {

  var user, user2
    , group
    ;

  beforeEach(function(done) {
    utils.cleanAllDb(done);
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

  // Add an admin to the group.
  beforeEach(function(done) {
    group
      .addMember(user, {role: 'admin'})
      .done(done);
  });
  // Add an viewer to the group.
  beforeEach(function(done) {
    group
      .addMember(user3, {role: 'viewer'})
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
        .set('Authorization', 'Bearer ' + user2.jwt)
        .expect(403)
        .end(done);
    });

    it('successfully get a group\'s activities', function(done) {
      request(app)
        .get('/groups/' + group.id + '/activities')
        .set('Authorization', 'Bearer ' + user.jwt)
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

      var per_page = 3;

      it('successfully get a group\'s activities with per_page', function(done) {
        request(app)
          .get('/groups/' + group.id + '/activities')
          .send({
            per_page: per_page,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt)
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
            expect(headers.link).to.contain('per_page=' + per_page);
            expect(headers.link).to.contain('/groups/' + group.id + '/activities');
            var tot = _.reduce(activitiesData, function(memo, el){ return memo + ( (el.GroupId === group.id) ? 1 : 0 ); }, 0);
            expect(headers.link).to.contain('/groups/1/activities?page=' + Math.ceil(tot/per_page) + '&per_page=' + per_page + '>; rel="last"');

            done();
          });
      });

      it('successfully get the second page of a group\'s activities', function(done) {
        var page = 2;
        request(app)
          .get('/groups/' + group.id + '/activities')
          .send({
            per_page: per_page,
            page: page,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt)
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
        var since_id = 8;
        
        request(app)
          .get('/groups/' + group.id + '/activities')
          .send({
            since_id: since_id,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt)
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            var activities = res.body;
            expect(activities[0].id > since_id).to.be.true;
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
          .set('Authorization', 'Bearer ' + user.jwt)
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

    })

  });

});
