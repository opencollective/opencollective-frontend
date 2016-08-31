/**
 * Dependencies.
 */
const app = require('../server/index');
const expect = require('chai').expect;
const request = require('supertest-as-promised');
const utils = require('../test/utils.js')();

/**
 * Variables.
 */
const userData = utils.data('user1');
const groupData = utils.data('group1');
const models = app.set('models');

/**
 * Tests.
 */
describe('profile.routes.test.js', () => {

  let user, group;

  beforeEach(() => utils.cleanAllDb());

  beforeEach(() => models.User.create(userData).tap(u => user = u));
  beforeEach((done) =>
    models.Group
      .create(groupData).tap(g => {
        group = g;
        return group.addUserWithRole(user, 'HOST');
      })
      .then(() => done())
  );

  /**
   * Get.
   */
  describe('#get /profile/:slug', () => {

    it('gets the user', (done) => {
      request(app)
        .get(`/profile/${user.username}`)
        .expect(200)
        .end((err, res) => {
          const body = res.body;
          expect(body.username).to.equal(user.username);
          done();
        })
    });

    it('gets the group', (done) => {
      request(app)
        .get(`/profile/${group.slug}`)
        .expect(200)
        .end((err, res) => {
          const body = res.body;
          expect(body.mission).to.equal(group.mission);
          done();
        })
    });

  });

});
