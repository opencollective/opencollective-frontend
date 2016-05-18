const Bluebird = require('bluebird');
const app = require('../index');
const expect = require('chai').expect;
const request = require('supertest-as-promised');
const sinon = require('sinon');
const utils = require('./utils')();
const roles = require('../server/constants/roles');

const models = app.set('models');
const Expense = models.Expense;

describe('expenses.routes.test.js: GIVEN an application, group, and host user', () => {
  var application, user, group;

  beforeEach(done => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  beforeEach(done => Bluebird.props({
      user: models.User.create(utils.data('user1')),
      group: models.Group.create(utils.data('group1'))
    })
    .then(props => {
      user = props.user;
      group = props.group;

      return group.addUserWithRole(user, roles.HOST);
    })
    .then(() => done()));

  describe('WHEN no expense exists', () => {

    describe('WHEN calling approve route', () => {
      var req;

      beforeEach(done => {
        req = request(app)
          .post('/groups/' + group.id + '/expenses/123/approve')
          .set('Authorization', `Bearer ${user.jwt(application)}`);
        done();
      });

      it('THEN returns 404', done => req.expect(404).end(done));
    });
  });

  describe('WHEN calling expense route', () => {
    var expenseReq;

    beforeEach(() => {
      expenseReq = request(app).post(`/groups/${group.id}/expenses`);
    });

    describe('WHEN not authenticated but providing an expense', () => {
      beforeEach(() => {
        expenseReq = expenseReq.send({expense: utils.data('expense1')});
      });

      it('THEN returns 200', done => expenseReq.expect(200).end(done));
    });

    // authenticate even though not required, so that we can make assertions on the userId
    describe('WHEN authenticated', () => {
      beforeEach(() => {
        expenseReq = expenseReq.set('Authorization', `Bearer ${user.jwt(application)}`);
      });

      describe('WHEN not providing expense', () =>
        it('THEN returns 400 bad request', done => expenseReq.expect(400).end(done)));

      describe('WHEN providing expense', () => {
        beforeEach(() => {
          expenseReq = expenseReq.send({expense: utils.data('expense1')});
        });

        describe('THEN returns 200 and expense', () => {
          var expense;

          beforeEach(done => expenseReq
            .expect(200)
            .then(res => expense = res.body)
            .then(() => done()));

          it('THEN expense belongs to the group', () => expect(expense.GroupId).to.be.equal(group.id));

          it('THEN expense belongs to the user', () => expect(expense.UserId).to.be.equal(user.id));

          it('THEN a group.expense.created activity is created', done => {
            models.Activity.findAndCountAll()
              .then(res => {
                expect(res.count).to.be.equal(1);
                const activity = res.rows[0];

                expect(activity.type).to.be.equal('group.expense.created');
                expect(activity.UserId).to.be.equal(user.id);
                expect(activity.GroupId).to.be.equal(group.id);
                expect(activity.data.user.id).to.be.equal(user.id);
                expect(activity.data.group.id).to.be.equal(group.id);
                expect(activity.data.expense.id).to.be.equal(expense.id);
              })
              .then(() => done())
              .catch(done);
          });

          describe('WHEN calling approve route', () => {
            var approveReq;

            beforeEach(() => {
              approveReq = request(app).post(`/groups/${group.id}/expenses/${expense.id}/approve`);
            });

            describe('WHEN not authenticated', () =>
              it('THEN returns 401 unauthorized', done => approveReq.expect(401).end(done)));

            describe('WHEN authenticated as host user', () => {

              beforeEach(() => {
                approveReq = approveReq.set('Authorization', `Bearer ${user.jwt(application)}`);
              });

              describe('WHEN sending approved: false', () => {
                beforeEach(done => setExpenseApproval(false).end(done));

                it('THEN returns status: REJECTED', done => expectApprovalStatus('REJECTED', done));
              });

              describe('WHEN sending approved: true', () => {
                // TODO set up test data

                beforeEach(done => setExpenseApproval(true).end(done));

                xit('THEN returns status: APPROVED', done => expectApprovalStatus('APPROVED', done));
              });

              function setExpenseApproval(approved) {
                return approveReq
                  .send({approved})
                  .expect(200);
              }

              function expectApprovalStatus(approvalStatus, done) {
                Expense.findAndCountAll()
                  .then(expenses => {
                    expect(expenses.count).to.be.equal(1);
                    const expense = expenses.rows[0];
                    expect(expense.status).to.be.equal(approvalStatus);
                  })
                  .then(() => done())
                  .catch(done);
              }
            });
          });
        });
      });
    });
  });
});
