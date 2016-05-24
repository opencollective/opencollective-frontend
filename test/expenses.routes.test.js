const Bluebird = require('bluebird');
const app = require('../index');
const expect = require('chai').expect;
const request = require('supertest-as-promised');
const sinon = require('sinon');
const utils = require('./utils')();
const roles = require('../server/constants/roles');
const preapprovalDetailsMock = Object.assign({}, require('./mocks/paypal').adaptive.preapprovalDetails.completed);

const models = app.get('models');
const Expense = models.Expense;
const expense = utils.data('expense1');

describe('expenses.routes.test.js: GIVEN an application, group, and host user', () => {
  var application, user, group;

  beforeEach(done => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  beforeEach(() => Bluebird.props({
      user: models.User.create(utils.data('user1')),
      group: models.Group.create(utils.data('group1'))
    })
    .then(props => {
      user = props.user;
      group = props.group;

      return group.addUserWithRole(user, roles.HOST);
    }));

  describe('WHEN no expense exists', () => {

    describe('WHEN calling approve route', () => {
      var req;

      beforeEach(() => {
        req = request(app)
          .post('/groups/' + group.id + '/expenses/123/approve')
          .set('Authorization', `Bearer ${user.jwt(application)}`);
      });

      it('THEN returns 404', () => req.expect(404));
    });
  });

  describe('WHEN calling expense route', () => {
    var expenseReq;

    beforeEach(() => {
      expenseReq = request(app).post(`/groups/${group.id}/expenses`);
    });

    describe('WHEN not authenticated but providing an expense', () => {
      beforeEach(() => {
        expenseReq = expenseReq.send({ expense });
      });

      describe('THEN returns 200 and expense', () => {
        var expense;

        beforeEach(() => expenseReq
          .expect(200)
          .then(res => expense = res.body));

        it('THEN expense does not belong to the user', () => expect(expense.UserId).not.to.be.equal(user.id));


      });

      it('THEN returns 200 with expense', () =>
        expenseReq
          .expect(200)
          .then(res => {
            expect(res.body.UserId).not.to.be.equal(user.id);
            expect(res.body.GroupId).to.be.equal(group.id);
            expect(res.body.description).to.be.equal(expense.description);
            expect(res.body.amount).to.be.equal(expense.amount);
            expect(res.body.currency).to.be.equal(expense.currency);
          }));
    });

    // authenticate even though not required, so that we can make assertions on the userId
    describe('WHEN authenticated', () => {

      beforeEach(() => {
        expenseReq = expenseReq.set('Authorization', `Bearer ${user.jwt(application)}`);
      });

      describe('WHEN not providing expense', () =>
        it('THEN returns 400 bad request', () => expenseReq.expect(400)));

      describe('WHEN providing expense', () => {
        beforeEach(() => {
          expenseReq = expenseReq.send({ expense });
        });

        describe('THEN returns 200 and expense', () => {
          var actualExpense;

          beforeEach(() => expenseReq
            .expect(200)
            .then(res => actualExpense = res.body));

          it('THEN returns expense data', () => {
            expect(actualExpense.description).to.be.equal(expense.description);
            expect(actualExpense.amount).to.be.equal(expense.amount);
            expect(actualExpense.currency).to.be.equal(expense.currency);
            expect(actualExpense.isPending).to.be.true;
          });

          it('THEN expense belongs to the group', () => expect(actualExpense.GroupId).to.be.equal(group.id));

          it('THEN expense belongs to the user', () => expect(actualExpense.UserId).to.be.equal(user.id));

          it('THEN a group.expense.created activity is created', () => {
            models.Activity.findAndCountAll()
              .then(res => {
                expect(res.count).to.be.equal(1);
                const activity = res.rows[0];
                expect(activity.type).to.be.equal('group.expense.created');
                expect(activity.UserId).to.be.equal(user.id);
                expect(activity.GroupId).to.be.equal(group.id);
                expect(activity.data.user.id).to.be.equal(user.id);
                expect(activity.data.group.id).to.be.equal(group.id);
                expect(activity.data.expense.id).to.be.equal(actualExpense.id);
              });
          });

          describe('WHEN calling approve route', () => {
            var approveReq;

            beforeEach(() => {
              approveReq = request(app).post(`/groups/${group.id}/expenses/${actualExpense.id}/approve`);
            });

            describe('WHEN not authenticated', () =>
              it('THEN returns 401 unauthorized', () => approveReq.expect(401)));

            describe('WHEN authenticated as host user', () => {

              beforeEach(() => {
                approveReq = approveReq.set('Authorization', `Bearer ${user.jwt(application)}`);
              });

              describe('WHEN sending approved: false', () => {
                beforeEach(() => setExpenseApproval(false));

                it('THEN returns status: REJECTED', () => expectApprovalStatus('REJECTED'));
              });

              describe('WHEN sending approved: true', () => {

                beforeEach(() =>
                  models.PaymentMethod.create({
                    service: 'paypal',
                    UserId: user.id,
                    token: 'abc'
                  }));

                afterEach(() => app.paypalAdaptive.preapprovalDetails.restore());

                describe('WHEN funds are insufficient', () => {

                  beforeEach(setMaxFunds(119));

                  beforeEach(() => setExpenseApproval(true));

                  it('THEN returns 400', () => approveReq.expect(400));
                });

                describe('WHEN funds are sufficient', () => {

                  beforeEach(setMaxFunds(121));

                  beforeEach(() => setExpenseApproval(true));

                  it('THEN returns status: APPROVED', () => expectApprovalStatus('APPROVED'));
                });
              });

              function setMaxFunds(maxAmount) {
                return () => {
                  preapprovalDetailsMock.maxTotalAmountOfAllPayments = maxAmount;
                  sinon
                    .stub(app.paypalAdaptive, 'preapprovalDetails')
                    .yields(null, preapprovalDetailsMock);
                };
              }

              const setExpenseApproval = approved => {
                approveReq = approveReq.send({approved});
              };

              const expectApprovalStatus = approvalStatus =>
                approveReq
                  .expect(200)
                  .then(() => Expense.findAndCountAll())
                  .tap(expenses => {
                    expect(expenses.count).to.be.equal(1);
                    const expense = expenses.rows[0];
                    expect(expense.status).to.be.equal(approvalStatus);
                  });
            });
          });
        });
      });
    });
  });
});
