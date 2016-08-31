/**
 * Dependencies.
 */
import _ from 'lodash';
import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import Promise from 'bluebird';

/**
 * Variables.
 */
const groupData = utils.data('group1');
const activitiesData = utils.data('activities1').activities;
const models = app.set('models');

/**
 * Tests.
 */
describe('activities.routes.test.js', () => {

  let application;
  let user;
  let user2;
  let user3;
  let group;

  beforeEach(() => utils.cleanAllDb().tap(a => application = a));

  // Create users.
  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user = u));

  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

  beforeEach(() => models.User.create(utils.data('user3')).tap(u => user3 = u));

  // Create group.
  beforeEach(() => models.Group.create(groupData).tap(g => group = g));

  // Add an host to the group.
  beforeEach(() => group.addUserWithRole(user, roles.HOST));

  // Add an backer to the group.
  beforeEach(() => group.addUserWithRole(user3, roles.BACKER));

  // Create activities.
  beforeEach(() => Promise.map(activitiesData, a => models.Activity.create(a)));

  /**
   * Get group's activities.
   */
  describe('#group', () => {

    it('fails getting activities if not member of the group', (done) => {
      request(app)
        .get(`/groups/${group.id}/activities`)
        .set('Authorization', `Bearer ${user2.jwt(application)}`)
        .expect(403)
        .end(done);
    });

    it('successfully get a group\'s activities', (done) => {
      request(app)
        .get(`/groups/${group.id}/activities`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;

          const activities = res.body;
          expect(activities.length).to.equal(12);
          activities.forEach((a) => {
            expect(a.GroupId).to.equal(group.id);
          });
          done();

        });
    });

    describe('Pagination', () => {

      const perPage = 3;

      it('successfully get a group\'s activities with per_page', (done) => {
        request(app)
          .get(`/groups/${group.id}/activities`)
          .send({
            per_page: perPage,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt(application)}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body.length).to.equal(3);
            expect(res.body[0].id).to.equal(4);

            // Check pagination header.
            const { headers } = res;
            expect(headers).to.have.property('link');
            expect(headers.link).to.contain('next');
            expect(headers.link).to.contain('page=2');
            expect(headers.link).to.contain('current');
            expect(headers.link).to.contain('page=1');
            expect(headers.link).to.contain(`per_page=${perPage}`);
            expect(headers.link).to.contain(`/groups/${group.id}/activities`);
            const tot = _.reduce(activitiesData, (memo, el) => {
              return memo + ((el.GroupId === group.id) ? 1 : 0);
            }, 0);
            expect(headers.link).to.contain(`/groups/1/activities?page=${Math.ceil(tot / perPage)}&per_page=${perPage}>; rel="last"`);

            done();
          });
      });

      it('successfully get the second page of a group\'s activities', (done) => {
        const page = 2;
        request(app)
          .get(`/groups/${group.id}/activities`)
          .send({
            per_page: perPage,
            page,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt(application)}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body.length).to.equal(3);
            expect(res.body[0].id).to.equal(7);

            // Check pagination header.
            const { headers } = res;
            expect(headers.link).to.contain('page=3');
            expect(headers.link).to.contain('page=2');
            done();
          });
      });

      it('successfully get a group\'s activities using since_id', (done) => {
        const sinceId = 8;

        request(app)
          .get(`/groups/${group.id}/activities`)
          .send({
            since_id: sinceId,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt(application)}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            const activities = res.body;
            expect(activities[0].id > sinceId).to.be.true;
            const last = 0;
            _.each(activities, (a) => {
              expect(a.id >= last).to.be.true;
            });

            // Check pagination header.
            const { headers } = res;
            expect(headers.link).to.be.empty;
            done();
          });

      });

    });

    describe('Sorting', () => {

      it('successfully get a group\'s activities with sorting', (done) => {
        request(app)
          .get(`/groups/${group.id}/activities`)
          .send({
            sort: 'createdAt',
            direction: 'desc'
          })
          .set('Authorization', `Bearer ${user.jwt(application)}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            const activities = res.body;
            let last = new Date();
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
        .get(`/users/${user.id}/activities`)
        .set('Authorization', `Bearer ${user2.jwt(application)}`)
        .expect(403)
        .end(done);
    });

    it('successfully get a user\'s activities', (done) => {
      request(app)
        .get(`/users/${user.id}/activities`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;

          const activities = res.body;
          expect(activities.length).to.equal(6);
          activities.forEach((a) => {
            expect(a.UserId).to.equal(user.id);
          });
          done();

        });
    });

  });

});
