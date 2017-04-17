import app from '../server/index';
import { expect } from 'chai';
import Promise from 'bluebird';
import request from 'supertest-as-promised';
import sinon from 'sinon';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import { missingRequired } from './lib/expectHelpers';
import paypalMock from './mocks/paypal';
import paypalAdaptive from '../server/gateways/paypalAdaptive';
import models from '../server/models';
import emailLib from '../server/lib/email';

const payMock = paypalMock.adaptive.pay;
const executePaymentMock = paypalMock.adaptive.executePayment;
const preapprovalDetailsMock = Object.assign({}, paypalMock.adaptive.preapprovalDetails.completed);

const application = utils.data('application');
const expense = utils.data('expense1');
const expense2 = utils.data('expense2');
const expense3 = utils.data('expense3');
const {
  Activity,
  Expense,
  Notification,
  Transaction,
  PaymentMethod,
  User
} = models;

describe('expenses.routes.test.js', () => {
  let sandbox, host, member, otherUser, expenseFiler, group, emailSendMessageSpy;

  before(() => {
    sandbox = sinon.sandbox.create();
    emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
  });

  after(() => sandbox.restore());

  // Create a stub for clearbit
  before(() => utils.clearbitStubBeforeEach(sandbox));

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(utils.data('user1')).tap(u => host = u));

  beforeEach(() => models.User.create(utils.data('user2')).tap(u => member = u));

  beforeEach(() => models.Group.create(utils.data('group1')).tap(g => group = g));

  beforeEach(() => models.User.create(utils.data('user3')).tap(u => otherUser = u));

  beforeEach(() => models.User.create(utils.data('user4')).tap(u => expenseFiler = u));

  beforeEach(() => group.addUserWithRole(host, roles.HOST));

  beforeEach(() => group.addUserWithRole(member, roles.MEMBER));

  describe('WHEN expense does not exist', () => {
    let req;

    describe('#getOne', () => {
      beforeEach(() => {
        req = request(app)
          .get(`/groups/${group.id}/expenses/123?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${host.jwt()}`);
      });

      it('THEN returns 404', () => req.expect(404));
    });

    describe('#approve', () => {
      beforeEach(() => {
        req = request(app)
          .post(`/groups/${group.id}/expenses/123/approve?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${host.jwt()}`);
      });

      it('THEN returns 404', () => req.expect(404));
    });

    describe('#delete', () => {
      beforeEach(() => {
        req = request(app)
          .delete(`/groups/${group.id}/expenses/123?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${host.jwt()}`);
      });

      it('THEN returns 404', () => req.expect(404));
    });

    describe('#update', () => {
      beforeEach(() => {
        req = request(app)
          .put(`/groups/${group.id}/expenses/123?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${host.jwt()}`);
      });

      it('THEN returns 404', () => req.expect(404));
    });

  });

  describe('#create', () => {
    let createReq;

    beforeEach(() => {
      createReq = request(app).post(`/groups/${group.id}/expenses?api_key=${application.api_key}`);
    });

    describe('WHEN not authenticated but providing an expense', () => {
      beforeEach(() => {
        createReq = createReq.send({ expense });
      });

      it('THEN returns 200 with expense', () =>
        createReq
          .expect(200)
          .then(res => {
            expect(res.body.UserId).not.to.be.equal(host.id);
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

    describe('WHEN submitting wrong payoutMethod', () => {
      beforeEach(() => {
        createReq = createReq.send({ expense: Object.assign({}, expense, { payoutMethod: 'lalala' }) });
      });

      it('THEN returns 400', () => createReq.expect(400, {
        error: {
          code: 400,
          type: 'validation_failed',
          message: 'Validation error: Must be paypal, manual or other',
          fields: [ 'payoutMethod' ]
        }
      }));
    });

    // authenticate even though not required, so that we can make assertions on the userId
    describe('WHEN authenticated', () => {

      beforeEach(() => {
        createReq = createReq.set('Authorization', `Bearer ${member.jwt()}`);
      });

      describe('WHEN not providing expense', () =>
        it('THEN returns 400', () => missingRequired(createReq, 'expense')));

      describe('WHEN providing expense', () => {
        beforeEach(() => {
          createReq = createReq.send({ expense, api_key: application.api_key });
        });

        describe('THEN returns 200 and expense', () => {
          let actualExpense;

          beforeEach('create expense', () => createReq
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

          it('THEN expense belongs to the user', () => expect(actualExpense.UserId).to.be.equal(member.id));

          it('THEN expense updated PayPal email of the user', (done) => {
            User.findById(actualExpense.UserId)
            .then(user => {
              expect(user.paypalEmail).to.be.equal(expense.paypalEmail.toLowerCase())
              done();
            });
          });

          it('THEN a group.expense.created activity is created', () =>
            expectExpenseActivity('group.expense.created', actualExpense.id));

          it('THEN an email notification is sent', (done) => {
            expect(emailSendMessageSpy.firstCall.args[1]).to.contain(actualExpense.title);
            expect(emailSendMessageSpy.firstCall.args[2]).to.contain(actualExpense.attachment);
            done();
          });

          describe('#getOne', () => {
            it('THEN returns the expense without the attachment if not logged in', () => request(app)
              .get(`/groups/${group.id}/expenses/${actualExpense.id}?api_key=${application.api_key}`)
              .expect(200)
              .then(res => {
                const expenseData = res.body;
                expect(expenseData).to.have.property('id', actualExpense.id)
                expect(expenseData).to.not.have.property('attachment');
              }));
            it('THEN returns the expense with the attachment if logged in', () => request(app)
              .get(`/groups/${group.id}/expenses/${actualExpense.id}?api_key=${application.api_key}`)
              .set('Authorization', `Bearer ${member.jwt()}`)
              .expect(200)
              .then(res => {
                const expenseData = res.body;
                expect(expenseData).to.have.property('attachment');
              }));
          });

          describe('#list', () => {
            beforeEach('create expense', () => createExpense(group, expenseFiler));
            beforeEach('create expense 2', () => createExpense(group, expenseFiler));
            beforeEach('create 1 comment', () => models.Comment.createMany([utils.data('comments')[0]], { UserId: 1, GroupId: group.id, ExpenseId: 1 }));
            beforeEach('create many comments', () => models.Comment.createMany(utils.data('comments'), { UserId: 1, GroupId: group.id, ExpenseId: 2 }));
            it('THEN returns all expenses without user.email', () => request(app)
              .get(`/groups/${group.id}/expenses?api_key=${application.api_key}`)
              .expect(200)
              .then(res => {
                const expenses = res.body;
                expect(expenses).to.have.length(3);
                expect(expenses[0].commentsCount).to.equal(1);
                expect(expenses[1].commentsCount).to.equal(3);
                expect(expenses[2].commentsCount).to.equal(0);
                expect(expenses[1].user.id).to.equal(expenseFiler.id);
                expect(expenses[0].user.email).to.not.exist;
                console.log("Expense user", expenses[0].user);
                expenses.forEach(e => expect(e.GroupId).to.equal(group.id));
              }));

            it('THEN returns 200 with all expenses with user.email and user.paypalEmail', () => request(app)
              .get(`/groups/${group.id}/expenses?api_key=${application.api_key}`)
              .set('Authorization', `Bearer ${host.jwt()}`)
              .expect(200)
              .then(res => {
                const expenses = res.body;
                expect(expenses).to.have.length(3);
                expect(expenses[1].user.id).to.equal(expenseFiler.id);
                expect(expenses[1].user.email).to.equal(expenseFiler.email);
                expect(expenses[1].user).to.have.property('paypalEmail');
              }));

            describe('WHEN specifying per_page', () => {
              const per_page = 2;
              let response;

              beforeEach(() => request(app)
                .get(`/groups/${group.id}/expenses?api_key=${application.api_key}`)
                .send({ per_page })
                .expect(200)
                .then(res => response = res));

              it('THEN gets first page', () => {
                const expenses = response.body;
                expect(expenses.length).to.equal(per_page);
                expect(expenses[0].id).to.equal(1);

                const { headers } = response;
                expect(headers).to.have.property('link');
                expect(headers.link).to.contain('next');
                expect(headers.link).to.contain('page=2');
                expect(headers.link).to.contain('current');
                expect(headers.link).to.contain('page=1');
                expect(headers.link).to.contain(`per_page=${per_page}`);
                expect(headers.link).to.contain(`/groups/${group.id}/expenses`);
                const tot = 3;
                expect(headers.link).to.contain(`/groups/${group.id}/expenses?page=${Math.ceil(tot/per_page)}&per_page=${per_page}>; rel="last"`);
              });
            });

            describe('WHEN getting page 2', () => {
              const page = 2;
              let response;

              beforeEach(() => request(app)
                .get(`/groups/${group.id}/expenses?api_key=${application.api_key}`)
                .send({ page, per_page: 1 })
                .expect(200)
                .then(res => response = res));

              it('THEN gets 2nd page', () => {
                const expenses = response.body;
                expect(expenses.length).to.equal(1);
                expect(expenses[0].id).to.equal(2);

                const { headers } = response;
                expect(headers).to.have.property('link');
                expect(headers.link).to.contain('next');
                expect(headers.link).to.contain('page=3');
                expect(headers.link).to.contain('current');
                expect(headers.link).to.contain('page=2');
              });
            });

            describe('WHEN specifying since_id', () => {
              const since_id = 2;
              let response;

              beforeEach(() => request(app)
                .get(`/groups/${group.id}/expenses?api_key=${application.api_key}`)
                .send({ since_id })
                .expect(200)
                .then(res => response = res));

              it('THEN returns expenses above ID', () => {
                const expenses = response.body;
                expect(expenses.length).to.be.equal(1);
                expenses.forEach(e => expect(e.id >= since_id).to.be.true);
                const { headers } = response;
                expect(headers.link).to.be.empty;
              });
            });
          });

          describe('#delete', () => {
            describe('WHEN not authenticated', () =>
              it('THEN returns 401', () => request(app)
                .delete(`/groups/${group.id}/expenses/${actualExpense.id}?api_key=${application.api_key}`)
                .expect(401)));

            describe('WHEN expense does not belong to group', () => {
              let otherExpense;

              beforeEach('create another expense', () => createExpense().tap(e => otherExpense = e));

              it('THEN returns 404', () => {
                return request(app)
                .delete(`/groups/${group.id}/expenses/${otherExpense.id}?api_key=${application.api_key}`)
                .set('Authorization', `Bearer ${host.jwt()}`)
                .expect(404);
              });
            });

            describe('WHEN user is not the host, not a member and not the author of the expense', () => {

              beforeEach('set status to rejected', () =>
                request(app).post(`/groups/${group.id}/expenses/${actualExpense.id}/approve?api_key=${application.api_key}`)
                .set('Authorization', `Bearer ${host.jwt()}`)
                .send({ approved: false })
                .expect(200)
              );

              it('THEN returns 403', () => request(app)
                .delete(`/groups/${group.id}/expenses/${actualExpense.id}?api_key=${application.api_key}`)
                .set('Authorization', `Bearer ${otherUser.jwt()}`)
                .expect(403));
            });

            describe('success', () => {
              let response;

              beforeEach('reject expense', () => request(app)
                .post(`/groups/${group.id}/expenses/${actualExpense.id}/approve?api_key=${application.api_key}`)
                .set('Authorization', `Bearer ${host.jwt()}`)
                .send({approved: false})
                .expect(200));

              beforeEach('delete expense', () => request(app)
                .delete(`/groups/${group.id}/expenses/${actualExpense.id}?api_key=${application.api_key}`)
                .set('Authorization', `Bearer ${host.jwt()}`)
                .expect(200)
                .toPromise()
                .tap(res => response = res.body ));

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
                .put(`/groups/${group.id}/expenses/${actualExpense.id}?api_key=${application.api_key}`)
                .expect(401)));

            describe('WHEN expense does not belong to group', () => {
              let otherExpense;

              beforeEach(() => createExpense().tap(e => otherExpense = e));

              it('THEN returns 404', () => request(app)
                .put(`/groups/${group.id}/expenses/${otherExpense.id}?api_key=${application.api_key}`)
                .set('Authorization', `Bearer ${host.jwt()}`)
                .expect(404));
            });

            describe('WHEN not providing expense', () => {
              let updateReq;

              beforeEach(() => {
                updateReq = request(app)
                  .put(`/groups/${group.id}/expenses/${actualExpense.id}?api_key=${application.api_key}`)
                  .set('Authorization', `Bearer ${host.jwt()}`);
              });

              it('THEN returns 400', () => missingRequired(updateReq, 'expense'));
            });

            describe('success', () => {
              let response;

              beforeEach(() => request(app)
                .put(`/groups/${group.id}/expenses/${actualExpense.id}?api_key=${application.api_key}`)
                .set('Authorization', `Bearer ${host.jwt()}`)
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
            let approveReq;

            beforeEach(() => {
              approveReq = request(app).post(`/groups/${group.id}/expenses/${actualExpense.id}/approve?api_key=${application.api_key}`);
            });

            beforeEach(() => Notification.create({type: 'group.expense.approved', GroupId: 1, UserId: host.id}));

            describe('WHEN not authenticated', () =>
              it('THEN returns 401 unauthorized', () => approveReq.expect(401)));

            describe('WHEN authenticated as host user', () => {

              beforeEach(() => {
                approveReq = approveReq.set('Authorization', `Bearer ${host.jwt()}`);
              });

              describe('WHEN sending approved: false', () => {

                it('THEN returns status: REJECTED', () => expectApprovalStatus(approveReq.send({approved: false}), 'REJECTED'));
              });

              describe('WHEN sending approved: true', () => {

                it('THEN returns status: APPROVED', done => {
                  expectApprovalStatus(approveReq.send({approved: true}), 'APPROVED')
                  .tap(() => expectExpenseActivity('group.expense.approved', actualExpense.id))
                  .tap(() => {
                    expect(emailSendMessageSpy.lastCall.args[1]).to.contain(`New expense approved on`);
                    done();
                  })
                });
              });

              const expectApprovalStatus = (approveReq, approvalStatus) =>
                approveReq
                  .expect(200)
                  .then(() => Expense.findAndCountAll())
                  .tap(expenses => {
                    expect(expenses.count).to.be.equal(1);
                    const expense = expenses.rows[0];
                    expect(expense.status).to.be.equal(approvalStatus);
                    expect(expense.lastEditedById).to.be.equal(host.id);
                  });
            });

            describe('WHEN authenticated as a MEMBER', () => {

              beforeEach(() => {
                approveReq = approveReq.set('Authorization', `Bearer ${member.jwt()}`);
              });

              describe('WHEN sending approved: false', () => {
                beforeEach(() => setExpenseApproval(false));

                it('THEN returns status: REJECTED', () => expectApprovalStatus('REJECTED'));
              });

              describe('WHEN sending approved: true', () => {
              
                beforeEach(() => setExpenseApproval(true));

                it('THEN returns status: APPROVED', () => expectApprovalStatus('APPROVED'));
              });

              const setExpenseApproval = approved => {
                approveReq = approveReq.send({approved, api_key: application.api_key});
              };

              const expectApprovalStatus = approvalStatus =>
                approveReq
                  .expect(200)
                  .then(() => Expense.findAndCountAll())
                  .tap(expenses => {
                    expect(expenses.count).to.be.equal(1);
                    const expense = expenses.rows[0];
                    expect(expense.status).to.be.equal(approvalStatus);
                    expect(expense.lastEditedById).to.be.equal(member.id);
                  });
            });
          });

          describe('#pay unapproved expense', () => {
            let payReq;

            beforeEach(() => {
              payReq = request(app)
                .post(`/groups/${group.id}/expenses/${actualExpense.id}/pay?api_key=${application.api_key}`)
                .set('Authorization', `Bearer ${host.jwt()}`)
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
                .stub(paypalAdaptive, 'preapprovalDetails',
                  () => Promise.resolve(preapprovalDetailsMock));

              return request(app)
                .post(`/groups/${group.id}/expenses/${actualExpense.id}/approve`)
                .set('Authorization', `Bearer ${host.jwt()}`)
                .send({approved: true, api_key:application.api_key})
                .expect(200);
            });

            afterEach(() => paypalAdaptive.preapprovalDetails.restore());

            let payReq;

            beforeEach(() => {
              payReq = request(app).post(`/groups/${group.id}/expenses/${actualExpense.id}/pay?api_key=${application.api_key}`);
            });

            describe('WHEN not authenticated', () =>
              it('THEN returns 401 unauthorized', () => payReq.expect(401)));

            describe('WHEN authenticated as host user', () => {

              beforeEach(() => {
                payReq = payReq.set('Authorization', `Bearer ${host.jwt()}`);
              });

              let payStub, executePaymentStub;

              beforeEach(() => {
                payStub = sinon.stub(paypalAdaptive, 'pay', 
                  () => Promise.resolve(payMock));
              });

              beforeEach(() => {
                executePaymentStub = sinon.stub(paypalAdaptive, 'executePayment',
                  () => Promise.resolve(executePaymentMock));
              });

              beforeEach(() => {
                payReq = payReq.send({api_key:application.api_key});
              });

              afterEach(() => payStub.restore());

              afterEach(() => executePaymentStub.restore());

              describe('WHEN group has insufficient funds', () => {
                it('THEN returns 400', () => payReq.expect(400, {
                  error: {
                    code: 400,
                    type: 'bad_request',
                    message: 'Not enough funds in this collective to pay this request. Please add funds first.',
                  }
                }));
              });

              describe('WHEN group has sufficient funds for expense but not for fees', () => {

                // add just enough money that fees can't be paid
                beforeEach('create a transaction', () => {
                  return request(app)
                    .post(`/groups/${group.id}/transactions`)
                    .set('Authorization', `Bearer ${host.jwt()}`)
                    .send({ api_key: application.api_key, transaction: {netAmountInGroupCurrency: 12000}})
                    .expect(200);
                })

                it('THEN returns 400', () => payReq.expect(400, {
                  error: {
                    code: 400,
                    type: 'bad_request',
                    message: 'Not enough funds in this collective to pay this request. Please add funds first.',
                  }
                }));
              })

              describe('WHEN group has sufficient funds', () => {
                
                // add some money, so collective has some funds
                beforeEach('create a transaction', () => {
                  return request(app)
                    .post(`/groups/${group.id}/transactions`)
                    .set('Authorization', `Bearer ${host.jwt()}`)
                    .send({ api_key: application.api_key, transaction: {netAmountInGroupCurrency: 12500}})
                    .expect(200);
                })

                describe('WHEN user has no paymentMethod', () => {
                  it('returns 400', () => payReq.expect(400, {
                    error: {
                      code: 400,
                      type: 'bad_request',
                      message: 'No payment method found',
                    }
                  }));
                });

                describe('WHEN user has paymentMethod', () => {
                  beforeEach(() => {
                    PaymentMethod.create({
                      service: 'paypal',
                      UserId: host.id,
                      confirmedAt: Date.now()
                    })
                  });

                  describe('THEN returns 200', () => {
                    beforeEach(() => payReq.expect(200));

                    let expense, transaction, paymentMethod;
                    beforeEach(() => expectOne(Expense).tap(e => expense = e));
                    beforeEach(() => expectTwo(Transaction).tap(t => transaction = t));
                    beforeEach(() => expectOne(PaymentMethod).tap(pm => paymentMethod = pm));

                    it('THEN calls PayPal pay', () => expect(payStub.called).to.be.true);

                    it('THEN calls PayPal executePayment', () => expect(executePaymentStub.called).to.be.true);

                    it('THEN marks expense as paid', () => expect(expense.status).to.be.equal('PAID'));

                    it('THEN creates transaction', () => {
                      expectTransactionCreated(expense, transaction);
                      expect(transaction.PaymentMethodId).to.be.equal(paymentMethod.id);
                    });

                    it('THEN creates a transaction paid activity', () =>
                      expectTransactionPaidActivity(group, member, transaction)
                        .tap(activity => expect(activity.data.paymentResponses).to.deep.equal({ 
                          createPaymentResponse: payMock, 
                          executePaymentResponse: executePaymentMock 
                        })));
                  });
                });

                function expectTransactionCreated(expense, transaction) {
                  expect(transaction).to.have.property('amountInTxnCurrency', -12000)
                  expect(transaction).to.have.property('paymentProcessorFeeInTxnCurrency', 378)
                  expect(transaction).to.have.property('netAmountInGroupCurrency', -12378);
                  expect(transaction).to.have.property('txnCurrency', expense.currency);
                  expect(transaction).to.have.property('txnCurrencyFxRate', 1)
                  expect(transaction).to.have.property('ExpenseId', expense.id);
                  expect(transaction).to.have.property('amount', -12000);
                  expect(transaction).to.have.property('currency', expense.currency);
                  expect(transaction).to.have.property('description', expense.title);
                  expect(transaction).to.have.property('UserId', expense.UserId);
                  expect(transaction).to.have.property('GroupId', expense.GroupId);
                }

                function expectTransactionPaidActivity(group, user, transaction) {
                  return Activity
                    .findOne({ where: { type: 'group.expense.paid' }})
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
            });

            describe('WHEN authenticated as a MEMBER', () => {

              beforeEach(() => {
                payReq = payReq.set('Authorization', `Bearer ${member.jwt()}`);
              });
              it('THEN returns 403', () => payReq.send()
                .expect(403));
            });
          });

          describe('#pay manual expense', () => {

            beforeEach('create an expense', () => {
              return request(app)
                .post(`/groups/${group.id}/expenses`)
                .set('Authorization', `Bearer ${host.jwt()}`)
                .send({ api_key: application.api_key, expense: expense2 })
                .expect(200)
                .then(res => actualExpense = res.body);
            });

            beforeEach(() => {
              sinon
                .stub(paypalAdaptive, 'preapprovalDetails')
                .yields(null, preapprovalDetailsMock);
              return request(app)
                .post(`/groups/${group.id}/expenses/${actualExpense.id}/approve?api_key=${application.api_key}`)
                .set('Authorization', `Bearer ${host.jwt()}`)
                .send({approved: true})
                .expect(200);
            });

            afterEach(() => paypalAdaptive.preapprovalDetails.restore());

            let payReq;

            beforeEach(() => {
              payReq = request(app).post(`/groups/${group.id}/expenses/${actualExpense.id}/pay?api_key=${application.api_key}`);
            });

            describe('WHEN not authenticated', () =>
              it('THEN returns 401 unauthorized', () => payReq.expect(401)));

            describe('WHEN authenticated as host user', () => {

              beforeEach(() => {
                payReq = payReq.set('Authorization', `Bearer ${host.jwt()}`);
              });

              let payStub, executePaymentStub;

              beforeEach(() => {
                payStub = sinon.stub(paypalAdaptive, 'pay', 
                  () => Promise.resolve(payMock));
              });

              beforeEach(() => {
                executePaymentStub = sinon.stub(paypalAdaptive, 'executePayment',
                  () => Promise.resolve(executePaymentMock));
              });

              afterEach(() => payStub.restore());

              afterEach(() => executePaymentStub.restore());

              beforeEach(() => {
                payReq = payReq.send();
              });

              describe('WHEN group has insufficient funds', () => {
                it('THEN returns 400', () => payReq.expect(400, {
                    error: {
                      code: 400,
                      type: 'bad_request',
                      message: 'Not enough funds in this collective to pay this request. Please add funds first.',
                    }
                  }));
              });

              describe('WHEN group has sufficient funds', () => {

                // add some money, so we can approve a manual expense against it
                beforeEach('create a transaction', () => {
                  return request(app)
                    .post(`/groups/${group.id}/transactions`)
                    .set('Authorization', `Bearer ${host.jwt()}`)
                    .send({ api_key: application.api_key, transaction: {netAmountInGroupCurrency: 10000}})
                    .expect(200);
                })

                describe('THEN returns 200', () => {
                  beforeEach(() => payReq.expect(200));

                  let expense, transaction;
                  beforeEach(() => expectTwo(Expense).tap(e => expense = e));
                  beforeEach(() => expectTwo(Transaction).tap(t => transaction = t));

                  it('THEN does not call PayPal pay', () => expect(payStub.called).to.be.false);

                  it('THEN does not call PayPal executePayment', () => expect(executePaymentStub.called).to.be.false);

                  it('THEN marks expense as paid', () => expect(expense.status).to.be.equal('PAID'));

                  it('THEN creates transaction', () => expectTransactionCreated(expense, transaction));

                  it('THEN creates a transaction paid activity', () =>
                    expectTransactionPaidActivity(group, host, transaction)
                      .tap(activity => expect(activity.data.paymentResponses).to.be.undefined));
                });

                function expectTransactionCreated(expense, transaction) {
                  expect(transaction).to.have.property('amountInTxnCurrency', -3737)
                  expect(transaction).to.have.property('paymentProcessorFeeInTxnCurrency', 0)
                  expect(transaction).to.have.property('netAmountInGroupCurrency', -3737);
                  expect(transaction).to.have.property('txnCurrency', expense.currency);
                  expect(transaction).to.have.property('txnCurrencyFxRate', 1)
                  expect(transaction).to.have.property('ExpenseId', expense.id);
                  expect(transaction).to.have.property('amount', -expense.amount);
                  expect(transaction).to.have.property('currency', expense.currency);
                  expect(transaction).to.have.property('description', expense.title);
                  expect(transaction).to.have.property('UserId', expense.UserId);
                  expect(transaction).to.have.property('GroupId', expense.GroupId);
                }

                function expectTransactionPaidActivity(group, user, transaction) {
                  return Activity
                    .findOne({ where: { type: 'group.expense.paid' }})
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
            });

            describe('WHEN authenticated as a MEMBER', () => {

              beforeEach(() => {
                payReq = payReq.set('Authorization', `Bearer ${member.jwt()}`);
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
        expect(activity.UserId).to.be.equal(member.id);
        expect(activity.GroupId).to.be.equal(group.id);
        expect(activity.data.user.id).to.be.equal(member.id);
        expect(activity.data.group.id).to.be.equal(group.id);
        expect(activity.data.expense.id).to.be.equal(expenseId);
      })
  }

  function createExpense(g, u) {
    let group, user;
    return (g ? Promise.resolve(g) : models.Group.create(utils.data('group2')))
      .tap(g => group = g)
      .then(() => u ? u : expenseFiler)
      .tap(u => user = u)
      .then(() => request(app)
        .post(`/groups/${group.id}/expenses`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({expense: expense3, api_key: application.api_key})
        .expect(200))
      .then(res => res.body);
  }
});
