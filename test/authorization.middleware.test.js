import * as aZ from '../server/middleware/security/authorization';
import { expect } from 'chai';
import moment from 'moment-timezone';
import models, {sequelize} from '../server/models';
import * as utils from '../test/utils';
const userData = utils.data('user3');

const expect401Callback = done => err => {
  expect(err).to.exist;
  expect(err.code).to.be.equal(401);
  expect(err.type).to.be.equal("unauthorized");
  done();
};
const expectNoErrCallback = done => err => {
  expect(err).not.to.exist;
  done();
};

describe('authorization.middleware.test.js', () => {

  let user, req;

  beforeEach(() => utils.cleanAllDb());

  beforeEach((done) => {
    models.User.create(userData)
      .then(u => {
        user = u;
        req = {user: {id: user.id}};
      })
      .then(() => done())
      .catch(done);
  });

  describe('authorizeAccessToUserWithRecentDonation', () => {

    it('fails when user has no donation', done => {
      aZ.authorizeAccessToUserWithRecentDonation(req, undefined, expect401Callback(done));
    });

    it('fails when user has an 11 minutes old donation', done => {
      testWithOldDonation(11, expect401Callback(done));
    });

    it('succeeds when user has a 9 minutes old donation', done => {
      testWithOldDonation(9, expectNoErrCallback(done));
    });
  });

  function testWithOldDonation(ageInMinutes, callback) {
    const updatedAt = moment().add(-ageInMinutes, 'minutes').format();

    models.Donation.create({
        UserId: user.id,
        currency: 'USD',
        amount: 100
      })
      .then(() => sequelize.query(`UPDATE "Donations" set "updatedAt" = '${updatedAt}' WHERE "UserId" = ${user.id}`))
      .then(() => aZ.authorizeAccessToUserWithRecentDonation(req, undefined, callback));
  }
});
