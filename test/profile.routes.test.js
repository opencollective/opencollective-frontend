import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';
import models from '../server/models';

const application = utils.data('application');
const userData = utils.data('user1');
const collectiveData = utils.data('collective1');

describe('profile.routes.test.js', () => {

  let user, collective;

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(userData).tap(u => user = u));
  beforeEach(() =>
    models.Collective
      .create(collectiveData).tap(g => {
        collective = g;
        return collective.addUserWithRole(user, 'HOST');
      })
  );

  /**
   * Get.
   */
  describe('#get /profile/:slug', () => {

    it('gets the user', () =>
      request(app)
        .get(`/profile/${user.username}?api_key=${application.api_key}`)
        .expect(200)
        .toPromise()
        .then(res => {
          const { body } = res;
          expect(body.username).to.equal(user.username);
        })
    );

    it('gets the collective', (done) => {
      request(app)
        .get(`/profile/${collective.slug}?api_key=${application.api_key}`)
        .expect(200)
        .end((err, res) => {
          const { body } = res;
          expect(body.mission).to.equal(collective.mission);
          done();
        })
    });

  });

});
