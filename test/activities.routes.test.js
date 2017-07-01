import _ from 'lodash';
import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import Promise from 'bluebird';
import models from '../server/models';

const application = utils.data('application');
const groupData = utils.data('group1');
const activitiesData = utils.data('activities1').activities;

describe('activities.routes.test.js', () => {

  let user;
  let user2;
  let user3;
  let group;

  before(() => utils.resetTestDB());

  // Create users.
  before('create user1', () => models.User.create(utils.data('user1')).tap(u => user = u));
  before('create user2', () => models.User.create(utils.data('user2')).tap(u => user2 = u));
  before('create user3', () => models.User.create(utils.data('user3')).tap(u => user3 = u));

  before('create group', () => models.Group.create(groupData).tap(g => group = g));

  before('add user as host', () => group.addUserWithRole(user, roles.HOST));
  before('add user3 as backer', () => group.addUserWithRole(user3, roles.BACKER));

  before('create activities', () => Promise.map(activitiesData, a => models.Activity.create(a)));

  /**
   * Get group's activities.
   */
  describe('#group', () => {

    const getActivitiesForGroup = (groupid) => request(app).get(`/groups/${groupid}/activities?api_key=${application.api_key}`);

    it('fails getting activities if not member of the group', (done) => {
      getActivitiesForGroup(group.id)
        .set('Authorization', `Bearer ${user2.jwt()}`)
        .expect(403)
        .end(done);
    });

    it('successfully get a group\'s activities', (done) => {
      getActivitiesForGroup(group.id)
        .set('Authorization', `Bearer ${user.jwt()}`)
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
        getActivitiesForGroup(group.id)
          .send({
            per_page: perPage,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body.length).to.equal(3);
            const ids = res.body.map(r => r.id).sort();
            expect(ids[0]).to.equal(4);

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
        getActivitiesForGroup(group.id)
          .send({
            per_page: perPage,
            page,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt()}`)
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

        getActivitiesForGroup(group.id)
          .send({
            since_id: sinceId,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt()}`)
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
        getActivitiesForGroup(group.id)
          .send({
            sort: 'createdAt',
            direction: 'desc'
          })
          .set('Authorization', `Bearer ${user.jwt()}`)
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

    it('should be able to get another user\'s activities', (done) => {
      request(app)
        .get(`/users/${user.id}/activities?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user2.jwt()}`)
        .expect(200)
        .end(done);
    });

    it('successfully get a user\'s activities', (done) => {
      request(app)
        .get(`/users/${user.id}/activities?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
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
