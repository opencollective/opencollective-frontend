/**
 * Dependencies.
 */
var app = require('../index');
var expect = require('chai').expect;
var request = require('supertest-as-promised');
var utils = require('../test/utils.js')();

/**
 * Variables.
 */
var userData = utils.data('user1');
var groupData = utils.data('group1');
var models = app.set('models');

/**
 * Tests.
 */
describe('homepage.routes.test.js', () => {

  var user, group;

  beforeEach(() => utils.cleanAllDb().tap(a => application = a));

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
  describe('#get /homepage', () => {

    it('gets the homepage data', (done) => {
      request(app)
        .get('/homepage')
        .expect(200)
        .end((err, res) => {
          const body = res.body;
          expect(body.stats).to.have.property('totalCollectives');
          expect(body.collectives).to.have.property('opensource');
          expect(body.collectives).to.have.property('meetup');
          expect(body.collectives.opensource.length).to.equal(1);
          expect(body.collectives.opensource[0].slug).to.equal('scouts');
          done();
        })
    });

  });

});
