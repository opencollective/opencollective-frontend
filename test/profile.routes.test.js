import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';
import models from '../server/models';

const userData = utils.data('user1');
const groupData = utils.data('group1');

describe('profile.routes.test.js', () => {

  let user, group;

  beforeEach(() => utils.cleanAllDb());

  beforeEach(() => models.User.create(userData).tap(u => user = u));
  beforeEach(() =>
    models.Group
      .create(groupData).tap(g => {
        group = g;
        return group.addUserWithRole(user, 'HOST');
      })
  );

  /**
   * Get.
   */
  describe('#get /profile/:slug', () => {

    it('gets the user', () =>
      request(app)
        .get(`/profile/${user.username}`)
        .expect(200)
        .toPromise()
        .then(res => {
          const { body } = res;
          expect(body.username).to.equal(user.username);
        })
    );

    it('gets the group', (done) => {
      request(app)
        .get(`/profile/${group.slug}`)
        .expect(200)
        .end((err, res) => {
          const { body } = res;
          expect(body.mission).to.equal(group.mission);
          done();
        })
    });

  });

});
