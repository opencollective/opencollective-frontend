/**
 * Dependencies.
 */

const app = require('../server/index');
const expect = require('chai').expect;
const request = require('supertest');
const utils = require('../test/utils.js')();

/**
 * Variables.
 */

const userData = utils.data('user1');
const models = app.set('models');

describe('images.routes.test.js', () => {
  let application;
  let user;

  beforeEach(() => utils.cleanAllDb().tap(a => application = a));

  /**
   * Create user
   */

  beforeEach(() => models.User.create(userData).tap(u => user = u));

  it('should upload an image to S3', (done) => {
    request(app)
    .post('/images/')
    .attach('file', 'test/mocks/images/camera.png')
    .set('Authorization', `Bearer ${user.jwt(application)}`)
    .expect(200)
    .end((err, res) => {
      expect(res.body.url).to.contain('.png');
      done();
    });
  });

  it('should throw an error if no file field is sent', (done) => {
    request(app)
    .post('/images/')
    .set('Authorization', `Bearer ${user.jwt(application)}`)
    .expect(400)
    .end(done);
  });

  it('should upload if the user is not logged in', (done) => {
    request(app)
    .post('/images/')
    .attach('file', 'test/mocks/images/camera.png')
    .expect(200)
    .end(done);
  });
});
