/**
 * Dependencies.
 */

var app = require('../index');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();

/**
 * Variables.
 */

var userData = utils.data('user1');
var models = app.set('models');

describe('images.routes.test.js', function() {
  var application;
  var user;

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  /**
   * Create user
   */

  beforeEach(function(done) {
    models.User.create(userData)
    .done(function(e, u) {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  it('should upload an image to S3', function(done) {
      request(app)
      .post('/images/')
      .attach('file', 'test/mocks/images/camera.png')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .expect(200)
      .end(function(err, res) {
        expect(res.body.url).to.contain('.png');
        done();
      });
  });

  it('should throw an error if no file field is sent', function(done) {
     request(app)
      .post('/images/')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .expect(400)
      .end(done);
  });

  it('should not upload if the user is not logged in', function(done) {
     request(app)
      .post('/images/')
      .attach('file', 'test/mocks/images/camera.png')
      .expect(401)
      .end(done);
  });
});
