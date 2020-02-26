import { expect } from 'chai';
import { fakeExpense, fakeUser, fakeCollective } from '../../../test-helpers/fake-data';
import { makeRequest } from '../../../utils';
import {
  canSeeExpenseAttachments,
  canSeeExpensePayoutMethod,
  canSeeExpenseInvoiceInfo,
  canSeeExpensePayeeLocation,
} from '../../../../server/graphql/common/expenses';

describe('server/graphql/common/expenses', () => {
  let expense, collective, collectiveAdmin, hostAdmin, expenseOwner, randomUser;
  let publicReq, randomUserReq, collectiveAdminReq, hostAdminReq, expenseOwnerReq;

  before(async () => {
    randomUser = await fakeUser();
    collectiveAdmin = await fakeUser();
    hostAdmin = await fakeUser();
    expenseOwner = await fakeUser();
    collective = await fakeCollective();
    expense = await fakeExpense({ CollectiveId: collective.id, FromCollectiveId: expenseOwner.CollectiveId });
    await collective.addUserWithRole(collectiveAdmin, 'ADMIN');
    await collective.host.addUserWithRole(hostAdmin, 'ADMIN');

    await collectiveAdmin.populateRoles();
    await hostAdmin.populateRoles();

    publicReq = makeRequest();
    randomUserReq = makeRequest(randomUser);
    collectiveAdminReq = makeRequest(collectiveAdmin);
    hostAdminReq = makeRequest(hostAdmin);
    expenseOwnerReq = makeRequest(expenseOwner);
  });

  describe('canSeeExpenseAttachments', () => {
    it('can see only if owner, collective admin or host admin', async () => {
      expect(await canSeeExpenseAttachments(publicReq, expense)).to.be.false;
      expect(await canSeeExpenseAttachments(randomUserReq, expense)).to.be.false;
      expect(await canSeeExpenseAttachments(collectiveAdminReq, expense)).to.be.true;
      expect(await canSeeExpenseAttachments(hostAdminReq, expense)).to.be.true;
      expect(await canSeeExpenseAttachments(expenseOwnerReq, expense)).to.be.true;
    });
  });

  describe('canSeeExpensePayoutMethod', () => {
    it('can see only if owner or host admin', async () => {
      expect(await canSeeExpensePayoutMethod(publicReq, expense)).to.be.false;
      expect(await canSeeExpensePayoutMethod(randomUserReq, expense)).to.be.false;
      expect(await canSeeExpensePayoutMethod(collectiveAdminReq, expense)).to.be.false;
      expect(await canSeeExpensePayoutMethod(hostAdminReq, expense)).to.be.true;
      expect(await canSeeExpensePayoutMethod(expenseOwnerReq, expense)).to.be.true;
    });
  });

  describe('canSeeExpenseInvoiceInfo', () => {
    it('can see only if owner or host admin', async () => {
      expect(await canSeeExpenseInvoiceInfo(publicReq, expense)).to.be.false;
      expect(await canSeeExpenseInvoiceInfo(randomUserReq, expense)).to.be.false;
      expect(await canSeeExpenseInvoiceInfo(collectiveAdminReq, expense)).to.be.false;
      expect(await canSeeExpenseInvoiceInfo(hostAdminReq, expense)).to.be.true;
      expect(await canSeeExpenseInvoiceInfo(expenseOwnerReq, expense)).to.be.true;
    });
  });

  describe('canSeeExpensePayeeLocation', () => {
    it('can see only if owner or host admin', async () => {
      expect(await canSeeExpensePayeeLocation(publicReq, expense)).to.be.false;
      expect(await canSeeExpensePayeeLocation(randomUserReq, expense)).to.be.false;
      expect(await canSeeExpensePayeeLocation(collectiveAdminReq, expense)).to.be.false;
      expect(await canSeeExpensePayeeLocation(hostAdminReq, expense)).to.be.true;
      expect(await canSeeExpensePayeeLocation(expenseOwnerReq, expense)).to.be.true;
    });
  });
});
