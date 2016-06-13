const app = require('../index');
const expect = require('chai').expect;
const Promise = require('bluebird');
const request = require('supertest-as-promised');
const sinon = require('sinon');
const utils = require('./utils')();
const roles = require('../server/constants/roles');
const badRequest = require('./lib/expectHelpers').badRequest;
const missingRequired = require('./lib/expectHelpers').missingRequired;
const paypalMock = require('./mocks/paypal');
const payMock = paypalMock.adaptive.payCompleted;
const preapprovalDetailsMock = Object.assign({}, paypalMock.adaptive.preapprovalDetails.completed);

const models = app.get('models');
const expense = utils.data('expense1');
const expense2 = utils.data('expense2');
const Activity = models.Activity;
const Expense = models.Expense;
const Transaction = models.Transaction;
const PaymentMethod = models.PaymentMethod;

describe('expenses.routes.test.js', () => {
  var application, user, group;

  beforeEach(() => utils.cleanAllDb().tap(a => application = a));

  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user = u));

  beforeEach(() => models.Group.create(utils.data('group1')).tap(g => group = g));

  beforeEach(() => group.addUserWithRole(user, roles.HOST));

  describe('WHEN expense does not exist', () => {
    var req;

    describe('#getOne', () => {
      beforeEach(() => {
        req = request(app)
          .get('/groups/' + group.id + '/expenses/123')
          .set('Authorization', `Bearer ${user.jwt(application)}`);
      });

      it('THEN returns 404', () => req.expect(404));
    });

    describe('#approve', () => {
      beforeEach(() => {
        req = request(app)
          .post('/groups/' + group.id + '/expenses/123/approve')
          .set('Authorization', `Bearer ${user.jwt(application)}`);
      });

      it('THEN returns 404', () => req.expect(404));
    });

    describe('#delete', () => {
      beforeEach(() => {
        req = request(app)
          .delete(`/groups/${group.id}/expenses/123`)
          .set('Authorization', `Bearer ${user.jwt(application)}`);
      });

      it('THEN returns 404', () => req.expect(404));
    });

    describe('#update', () => {
      beforeEach(() => {
        req = request(app)
          .put(`/groups/${group.id}/expenses/123`)
          .set('Authorization', `Bearer ${user.jwt(application)}`);
      });

      it('THEN returns 404', () => req.expect(404));
    });

  });

  describe('#create', () => {
    var createReq;

    beforeEach(() => {
      createReq = request(app).post(`/groups/${group.id}/expenses`);
    });

    describe('WHEN not authenticated but providing an expense', () => {
      beforeEach(() => {
        createReq = createReq.send({ expense });
      });

      it('THEN returns 200 with expense', () =>
        createReq
          .expect(200)
          .then(res => {
            expect(res.body.UserId).not.to.be.equal(user.id);
            expect(res.body.GroupId).to.be.equal(group.id);
            expect(res.body.title).to.be.equal(expense.title);
            expect(res.body.notes).to.be.equal(expense.notes);
            expect(res.body.category).to.be.equal(expense.category);
            expect(res.body.amount).to.be.equal(expense.amount);
            expect(res.body.currency).to.be.equal(expense.currency);
            expect(res.body.payoutMethod).to.be.equal(expense.payoutMethod);
          }));
    });

    describe('WHEN submitting expense with negative amount', () => {
      beforeEach(() => {
        createReq = createReq.send({ expense: Object.assign({}, expense, { amount: -1 }) });
      });

      it('THEN returns 400', () => createReq.expect(400, {
        error: {
          code: 400,
          type: 'validation_failed',
          message: 'Validation error: Validation min failed',
          fields: [ 'amount' ]
        }
      }));
    });

    // authenticate even though not required, so that we can make assertions on the userId
    describe('WHEN authenticated', () => {

      beforeEach(() => {
        createReq = createReq.set('Authorization', `Bearer ${user.jwt(application)}`);
      });

      describe('WHEN not providing expense', () =>
        it('THEN returns 400', () => missingRequired(createReq, 'expense')));

      describe('WHEN providing expense', () => {
        beforeEach(() => {
          createReq = createReq.send({ expense });
        });

        describe('THEN returns 200 and expense', () => {
          var actualExpense;

          beforeEach(() => createReq
            .expect(200)
            .then(res => actualExpense = res.body));

          it('THEN returns expense data', () => {
            expect(actualExpense.title).to.be.equal(expense.title);
            expect(actualExpense.notes).to.be.equal(expense.notes);
            expect(actualExpense.category).to.be.equal(expense.category);
            expect(actualExpense.amount).to.be.equal(expense.amount);
            expect(actualExpense.currency).to.be.equal(expense.currency);
            expect(actualExpense.status).to.be.equal('PENDING');
            expect(actualExpense.payoutMethod).to.be.equal(expense.payoutMethod);
          });

          it('THEN expense belongs to the group', () => expect(actualExpense.GroupId).to.be.equal(group.id));

          it('THEN expense belongs to the user', () => expect(actualExpense.UserId).to.be.equal(user.id));

          it('THEN a group.expense.created activity is created', () =>
            expectExpenseActivity('group.expense.created', actualExpense.id));

          describe('#getOne', () => {
            it('THEN returns 200', () => request(app)
              .get(`/groups/${group.id}/expenses/${actualExpense.id}`)
              .expect(200)
              .then(res => expect(res.body).to.have.property('id', actualExpense.id)));
          });

          describe('#list', () => {
            beforeEach(() => createExpense(group, user));
            beforeEach(() => createExpense(group, user));

            it('THEN returns 200', () => request(app)
              .get(`/groups/${group.id}/expenses`)
              .expect(200)
              .then(res => {
                const expenses = res.body;
                expect(expenses).to.have.length(3);
                expenses.forEach(e => expect(e.GroupId).to.equal(group.id));
              }));

            describe('WHEN specifying per_page', () => {
              var per_page = 2, response;

              beforeEach(() => request(app)
                .get(`/groups/${group.id}/expenses`)
                .send({ per_page })
                .expect(200)
                .then(res => response = res));

              it('THEN gets first page', () => {
                const expenses = response.body;
                expect(expenses.length).to.equal(per_page);
                expect(expenses[0].id).to.equal(1);

                var headers = response.headers;
                expect(headers).to.have.property('link');
                expect(headers.link).to.contain('next');
                expect(headers.link).to.contain('page=2');
                expect(headers.link).to.contain('current');
                expect(headers.link).to.contain('page=1');
                expect(headers.link).to.contain(`per_page=${per_page}`);
                expect(headers.link).to.contain(`/groups/${group.id}/expenses`);
                var tot = 3;
                expect(headers.link).to.contain(`/groups/${group.id}/expenses?page=${Math.ceil(tot/per_page)}&per_page=${per_page}>; rel="last"`);
              });
            });

            describe('WHEN getting page 2', () => {
              var page = 2, response;

              beforeEach(() => request(app)
                .get(`/groups/${group.id}/expenses`)
                .send({ page, per_page: 1 })
                .expect(200)
                .then(res => response = res));

              it('THEN gets 2nd page', () => {
                const expenses = response.body;
                expect(expenses.length).to.equal(1);
                expect(expenses[0].id).to.equal(2);

                var headers = response.headers;
                expect(headers).to.have.property('link');
                expect(headers.link).to.contain('next');
                expect(headers.link).to.contain('page=3');
                expect(headers.link).to.contain('current');
                expect(headers.link).to.contain('page=2');
              });
            });

            describe('WHEN specifying since_id', () => {
              var since_id = 2, response;

              beforeEach(() => request(app)
                .get(`/groups/${group.id}/expenses`)
                .send({ since_id })
                .expect(200)
                .then(res => response = res));

              it('THEN returns expenses above ID', () => {
                const expenses = response.body;
                expect(expenses.length).to.be.equal(1);
                expenses.forEach(e => expect(e.id >= since_id).to.be.true);
                const headers = response.headers;
                expect(headers.link).to.be.empty;
              });
            });
          });

          describe('#delete', () => {
            describe('WHEN not authenticated', () =>
              it('THEN returns 401', () => request(app)
                .delete(`/groups/${group.id}/expenses/${actualExpense.id}`)
                .expect(401)));

            describe('WHEN expense does not belong to group', () => {
              var otherExpense;

              beforeEach(() => createExpense().tap(e => otherExpense = e));

              it('THEN returns 403', () => request(app)
                .delete(`/groups/${group.id}/expenses/${otherExpense.id}`)
                .set('Authorization', `Bearer ${user.jwt(application)}`)
                .expect(403));
            });

            describe('WHEN user is not a host', () => {
              var user2;

              beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

              beforeEach(() => group.addUserWithRole(user2, roles.MEMBER));

              it('THEN returns 403', () => request(app)
                .delete(`/groups/${group.id}/expenses/${actualExpense.id}`)
                .set('Authorization', `Bearer ${user2.jwt(application)}`)
                .expect(403));
            });

            describe('success', () => {
              var response;

              beforeEach(() => request(app)
                .post(`/groups/${group.id}/expenses/${actualExpense.id}/approve`)
                .set('Authorization', `Bearer ${user.jwt(application)}`)
                .send({approved: false})
                .expect(200));
              
              beforeEach(() => request(app)
                .delete(`/groups/${group.id}/expenses/${actualExpense.id}`)
                .set('Authorization', `Bearer ${user.jwt(application)}`)
                .expect(200)
                .toPromise()
                .tap(res => response = res.body));

              it('THEN returns success:true', () => expect(response).to.have.property('success', true));

              it('THEN has deleted expense', () =>
                Expense.findById(actualExpense.id).tap(e => expect(e).to.not.exist));

              it('THEN a group.expense.deleted activity is created', () =>
                expectExpenseActivity('group.expense.deleted', actualExpense.id));
            });
          });

          describe('#update', () => {
            describe('WHEN not authenticated', () =>
              it('THEN returns 401', () => request(app)
                .put(`/groups/${group.id}/expenses/${actualExpense.id}`)
                .expect(401)));

            describe('WHEN expense does not belong to group', () => {
              var otherExpense;

              beforeEach(() => createExpense().tap(e => otherExpense = e));

              it('THEN returns 403', () => request(app)
                .put(`/groups/${group.id}/expenses/${otherExpense.id}`)
                .set('Authorization', `Bearer ${user.jwt(application)}`)
                .expect(403));
            });

            describe('WHEN not providing expense', () => {
              var updateReq;

              beforeEach(() => {
                updateReq = request(app)
                  .put(`/groups/${group.id}/expenses/${actualExpense.id}`)
                  .set('Authorization', `Bearer ${user.jwt(application)}`);
              });

              it('THEN returns 400', () => missingRequired(updateReq, 'expense'));
            });

            describe('success', () => {
              var response;

              beforeEach(() => request(app)
                .put(`/groups/${group.id}/expenses/${actualExpense.id}`)
                .set('Authorization', `Bearer ${user.jwt(application)}`)
                .send({expense: {title: 'new title'}})
                .expect(200)
                .then(res => response = res.body));

              it('THEN returns modified expense', () => {
                expect(response.title).to.be.equal('new title');
                expect(response.category).to.be.equal('Engineering');
              });

              it('THEN a group.expense.updated activity is created', () =>
                expectExpenseActivity('group.expense.updated', actualExpense.id));
            });
          });

          describe('#approve', () => {
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
                  PaymentMethod.create({
                    service: 'paypal',
                    UserId: user.id,
                    token: 'abc'
                  }));

                afterEach(() => app.paypalAdaptive.preapprovalDetails.restore());

                describe('WHEN funds are insufficient', () => {

                  beforeEach(setMaxFunds(119));

                  beforeEach(() => setExpenseApproval(true));

                  it('THEN returns 400', () =>
                    badRequest(createReq, 'Not enough funds (119 USD left) to approve transaction.'));
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
                    expect(expenses.rows[0].status).to.be.equal(approvalStatus);
                  });
            });

            describe('WHEN authenticated as a MEMBER', () => {

              beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

              beforeEach(() => group.addUserWithRole(user2, roles.MEMBER));

              beforeEach(() => {
                approveReq = approveReq.set('Authorization', `Bearer ${user2.jwt(application)}`);
              });

              describe('WHEN sending approved: false', () => {
                beforeEach(() => setExpenseApproval(false));

                it('THEN returns status: REJECTED', () => expectApprovalStatus('REJECTED'));
              });

              describe('WHEN sending approved: true', () => {

                beforeEach(() =>
                  PaymentMethod.create({
                    service: 'paypal',
                    UserId: user.id,
                    token: 'abc'
                  }));

                afterEach(() => app.paypalAdaptive.preapprovalDetails.restore());

                describe('WHEN funds are insufficient', () => {

                  beforeEach(setMaxFunds(119));

                  beforeEach(() => setExpenseApproval(true));

                  it('THEN returns 400', () =>
                    badRequest(createReq, 'Not enough funds (119 USD left) to approve transaction.'));
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
                    expect(expenses.rows[0].status).to.be.equal(approvalStatus);
                  });
            });
          });

          describe('#pay unapproved expense', () => {
            var payReq;

            beforeEach(() => {
              payReq = request(app)
                .post(`/groups/${group.id}/expenses/${actualExpense.id}/pay`)
                .set('Authorization', `Bearer ${user.jwt(application)}`)
                .send();
            });

            it('THEN returns 400', () => payReq.expect(400, {
              error: {
                code: 400,
                type: 'bad_request',
                message: `Expense ${actualExpense.id} status should be APPROVED.`
              }
            }));
          });

          describe('#pay non-manual expense', () => {

            beforeEach(() => {
              sinon
                .stub(app.paypalAdaptive, 'preapprovalDetails')
                .yields(null, preapprovalDetailsMock);
              return request(app)
                .post(`/groups/${group.id}/expenses/${actualExpense.id}/approve`)
                .set('Authorization', `Bearer ${user.jwt(application)}`)
                .send({approved: true})
                .expect(200);
            });

            afterEach(() => app.paypalAdaptive.preapprovalDetails.restore());

            var payReq;

            beforeEach(() => {
              payReq = request(app).post(`/groups/${group.id}/expenses/${actualExpense.id}/pay`);
            });

            describe('WHEN not authenticated', () =>
              it('THEN returns 401 unauthorized', () => payReq.expect(401)));

            describe('WHEN authenticated as host user', () => {

              beforeEach(() => {
                payReq = payReq.set('Authorization', `Bearer ${user.jwt(application)}`);
              });

              var payStub;

              beforeEach(() => {
                payStub = sinon.stub(app.paypalAdaptive, 'pay', (data, cb) => {
                  return cb(null, payMock);
                });
              });

              beforeEach(() => {
                payReq = payReq.send();
              });

              afterEach(() => payStub.restore());

              describe('WHEN user has no paymentMethod', () => {
                it('returns 400', () =>
                  badRequest(payReq, 'This user has no confirmed paymentMethod linked with this service.'));
              });

              describe('WHEN user has paymentMethod', () => {
                beforeEach(() => {
                  PaymentMethod.create({
                    service: 'paypal',
                    UserId: user.id,
                    confirmedAt: Date.now()
                  })
                });

                describe('THEN returns 200', () => {
                  beforeEach(() => payReq.expect(200));

                  var expense, transaction, paymentMethod;
                  beforeEach(() => expectOne(Expense).tap(e => expense = e));
                  beforeEach(() => expectOne(Transaction).tap(t => transaction = t));
                  beforeEach(() => expectOne(PaymentMethod).tap(pm => paymentMethod = pm));

                  it('THEN calls PayPal', () => expect(payStub.called).to.be.true);

                  it('THEN marks expense as paid', () => expect(expense.status).to.be.equal('PAID'));

                  it('THEN creates transaction', () => {
                    expectTransactionCreated(expense, transaction);
                    expect(transaction.PaymentMethodId).to.be.equal(paymentMethod.id);
                  });

                  it('THEN creates a transaction paid activity', () =>
                    expectTransactionPaidActivity(group, user, transaction)
                      .tap(activity => expect(activity.data.pay).to.deep.equal(payMock)));
                });
              });

              function expectTransactionCreated(expense, transaction) {
                expect(transaction).to.have.property('netAmountInGroupCurrency', -12000);
                expect(transaction).to.have.property('ExpenseId', expense.id);
                // TODO remove #postmigration, info redundant with joined tables?
                expect(transaction).to.have.property('amount', expense.amount);
                expect(transaction).to.have.property('currency', expense.currency);
                expect(transaction).to.have.property('description', expense.title);
                expect(transaction).to.have.property('status', 'REIMBURSED');
                expect(transaction.reimbursedAt).to.be.ok;
                expect(transaction).to.have.property('UserId', expense.UserId);
                expect(transaction).to.have.property('GroupId', expense.GroupId);
                expect(transaction).to.have.property('payoutMethod', expense.payoutMethod);
                // end TODO remove #postmigration
              }

              function expectTransactionPaidActivity(group, user, transaction) {
                return Activity
                  .findOne({ where: { type: 'group.transaction.paid' }})
                  .tap(activity => {
                    expect(activity.UserId).to.be.equal(user.id);
                    expect(activity.GroupId).to.be.equal(group.id);
                    expect(activity.TransactionId).to.be.equal(transaction.id);
                    expect(activity.data.user.id).to.be.equal(user.id);
                    expect(activity.data.group.id).to.be.equal(group.id);
                    expect(activity.data.transaction.id).to.be.equal(transaction.id);
                  });
              }
            });

            describe('WHEN authenticated as a MEMBER', () => {

              beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

              beforeEach(() => group.addUserWithRole(user2, roles.MEMBER));

              beforeEach(() => {
                payReq = payReq.set('Authorization', `Bearer ${user2.jwt(application)}`);
              });
              it('THEN returns 403', () => payReq.send()
                .expect(403));
            });
          });

          describe('#pay manual expense', () => {

            beforeEach(() => {
              return request(app)
                .post(`/groups/${group.id}/expenses`)
                .set('Authorization', `Bearer ${user.jwt(application)}`)
                .send({ expense: expense2 })
                .expect(200)
                .then(res => actualExpense = res.body);
            });

            beforeEach(() => {
              sinon
                .stub(app.paypalAdaptive, 'preapprovalDetails')
                .yields(null, preapprovalDetailsMock);
              return request(app)
                .post(`/groups/${group.id}/expenses/${actualExpense.id}/approve`)
                .set('Authorization', `Bearer ${user.jwt(application)}`)
                .send({approved: true})
                .expect(200);
            });

            afterEach(() => app.paypalAdaptive.preapprovalDetails.restore());

            var payReq;

            beforeEach(() => {
              payReq = request(app).post(`/groups/${group.id}/expenses/${actualExpense.id}/pay`);
            });

            describe('WHEN not authenticated', () =>
              it('THEN returns 401 unauthorized', () => payReq.expect(401)));

            describe('WHEN authenticated as host user', () => {

              beforeEach(() => {
                payReq = payReq.set('Authorization', `Bearer ${user.jwt(application)}`);
              });

              var payStub;

              beforeEach(() => {
                payStub = sinon.stub(app.paypalAdaptive, 'pay', (data, cb) => {
                  return cb(null, payMock);
                });
              });

              afterEach(() => payStub.restore());


              beforeEach(() => {
                payReq = payReq.send();
              });

              describe('THEN returns 200', () => {
                beforeEach(() => payReq.expect(200));

                var expense, transaction;
                beforeEach(() => expectTwo(Expense).tap(e => expense = e));
                beforeEach(() => expectOne(Transaction).tap(t => transaction = t));

                it('THEN does not call PayPal', () => expect(payStub.called).to.be.false);

                it('THEN marks expense as paid', () => expect(expense.status).to.be.equal('PAID'));

                it('THEN creates transaction', () => expectTransactionCreated(expense, transaction));

                it('THEN creates a transaction paid activity', () =>
                  expectTransactionPaidActivity(group, user, transaction)
                    .tap(activity => expect(activity.data.pay).to.be.undefined));
              });

              function expectTransactionCreated(expense, transaction) {
                expect(transaction).to.have.property('netAmountInGroupCurrency', -3700);
                expect(transaction).to.have.property('ExpenseId', expense.id);
                // TODO remove #postmigration, info redundant with joined tables?
                expect(transaction).to.have.property('amount', expense.amount);
                expect(transaction).to.have.property('currency', expense.currency);
                expect(transaction).to.have.property('description', expense.title);
                expect(transaction).to.have.property('status', 'REIMBURSED');
                expect(transaction.reimbursedAt).to.be.ok;
                expect(transaction).to.have.property('UserId', expense.UserId);
                expect(transaction).to.have.property('GroupId', expense.GroupId);
                expect(transaction).to.have.property('payoutMethod', expense.payoutMethod);
                // end TODO remove #postmigration
              }

              function expectTransactionPaidActivity(group, user, transaction) {
                return Activity
                  .findOne({ where: { type: 'group.transaction.paid' }})
                  .tap(activity => {
                    expect(activity.UserId).to.be.equal(user.id);
                    expect(activity.GroupId).to.be.equal(group.id);
                    expect(activity.TransactionId).to.be.equal(transaction.id);
                    expect(activity.data.user.id).to.be.equal(user.id);
                    expect(activity.data.group.id).to.be.equal(group.id);
                    expect(activity.data.transaction.id).to.be.equal(transaction.id);
                  });
              }
            });

            describe('WHEN authenticated as a MEMBER', () => {

              beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

              beforeEach(() => group.addUserWithRole(user2, roles.MEMBER));

              beforeEach(() => {
                payReq = payReq.set('Authorization', `Bearer ${user2.jwt(application)}`);
              });
              it('THEN returns 403', () => payReq.send()
                .expect(403));
            });
          });
        });
      });

    });
  });

  function expectOne(model) {
    return model.findAndCountAll()
      .tap(entities => expect(entities.count).to.be.equal(1))
      .then(entities => entities.rows[0]);
  }

  function expectTwo(model) {
    return model.findAndCountAll()
      .tap(entities => expect(entities.count).to.be.equal(2))
      .then(entities => entities.rows[1]);
  }

  function expectExpenseActivity(type, expenseId) {
    return Activity.findOne({ where: { type }})
      .then(activity => {
        expect(activity).to.be.ok;
        expect(activity.UserId).to.be.equal(user.id);
        expect(activity.GroupId).to.be.equal(group.id);
        expect(activity.data.user.id).to.be.equal(user.id);
        expect(activity.data.group.id).to.be.equal(group.id);
        expect(activity.data.expense.id).to.be.equal(expenseId);
      })
  }

  function createExpense(g, u) {
    var group, user;
    return (g ? Promise.resolve(g) : models.Group.create(utils.data('group2')))
      .tap(g => group = g)
      .then(() => u ? u : models.User.create(utils.data('user2'))
        .tap(user => group.addUserWithRole(user, roles.HOST)))
      .tap(u => user = u)
      .then(() => request(app)
        .post(`/groups/${group.id}/expenses`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .send({expense})
        .expect(200))
      .then(res => res.body);
  }
});
