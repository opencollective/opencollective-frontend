/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExpenseLockableFields, ExpenseType, PayoutMethodType } from '../../../lib/graphql/types/v2/graphql';
import {
  NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID,
  NEW_PAYOUT_METHOD_ID,
  PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER,
  PAYEE_SLUG_INVITE,
} from '../../expenses/lib/constants';

import {
  collective,
  existingExpense,
  host,
  individual,
  loggedInAccount,
  payoutMethod,
  vendor,
} from '../testing/expense-form-fixtures';
import { mockLoggedInUser } from '../testing/expense-form-test-utils';

import { deriveFormOptions } from './form-options';
import type { ExpenseFormStartOptions, ExpenseFormValues } from './types';
import { InviteeAccountType } from './types';

const BANK_USD = payoutMethod();
const BANK_EUR = payoutMethod({ id: 'pm-bank-eur', data: { currency: 'EUR' } });

const values = (overrides: Partial<ExpenseFormValues> = {}): ExpenseFormValues => ({
  accountSlug: 'collective',
  payeeSlug: 'jane',
  expenseTypeOption: ExpenseType.INVOICE,
  inviteeAccountType: InviteeAccountType.INDIVIDUAL,
  inviteeNewIndividual: {},
  inviteeNewOrganization: { organization: {} },
  newPayoutMethod: { data: {} },
  expenseItems: [{ amount: { valueInCents: 0 } }],
  ...overrides,
});

const me = loggedInAccount({ slug: 'jane', payoutMethods: [BANK_USD, BANK_EUR] });

const derive = (
  data: Record<string, any>,
  v: Partial<ExpenseFormValues> = {},
  startOptions: ExpenseFormStartOptions = {},
  user = mockLoggedInUser({ slug: 'jane' }),
) =>
  deriveFormOptions(
    {
      data: {
        account: collective(),
        payee: individual({ slug: 'jane', payoutMethods: me.payoutMethods }),
        loggedInAccount: me,
        ...data,
      } as any,
    },
    values(v),
    startOptions,
    user,
  );

describe('deriveFormOptions', () => {
  describe('payout methods', () => {
    it('offers the payout methods of an administered payee', () => {
      const options = derive({});
      expect(options.isAdminOfPayee).toBe(true);
      expect(options.payoutMethods.map(pm => pm.id)).toEqual(['pm-bank-usd', 'pm-bank-eur']);
    });

    it('offers no payout methods for a payee the submitter does not administer', () => {
      expect(derive({ payee: individual({ slug: 'bob' }) }, { payeeSlug: 'bob' }).payoutMethods).toBeUndefined();
    });

    it('offers the account balance for a payee under the same Host', () => {
      const sibling = collective({ slug: 'sibling' });
      const options = derive(
        { payee: sibling, loggedInAccount: loggedInAccount({ slug: 'jane' }, [sibling]) },
        { payeeSlug: 'sibling' },
      );
      expect(options.supportedPayoutMethods).toEqual([PayoutMethodType.ACCOUNT_BALANCE]);
      expect(options.payoutMethods.map(pm => pm.id)).toEqual([NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID]);
    });

    it('offers the recipient Host payout methods for a cross-host payee administered through its Host', () => {
      const recipientHost = host({
        id: 'host-2',
        slug: 'host-two',
        payoutMethods: [payoutMethod({ id: 'pm-host-two' })],
      });
      const options = derive(
        {
          payee: collective({ slug: 'other', host: recipientHost }),
          loggedInAccount: loggedInAccount({ slug: 'jane' }, [{ ...recipientHost, __typename: 'Organization' }]),
        },
        { payeeSlug: 'other' },
      );
      expect(options.isAdminOfPayeeHost).toBe(true);
      expect(options.payoutMethods.map(pm => pm.id)).toEqual(['pm-host-two']);
    });

    it('offers the Vendor payout methods', () => {
      const options = derive(
        { payee: vendor({ payoutMethods: [payoutMethod({ id: 'pm-vendor' })] }) },
        { payeeSlug: 'vendor' },
      );
      expect(options.payoutMethods.map(pm => pm.id)).toEqual(['pm-vendor']);
    });

    it('resolves the selected payout method, or the new one being typed', () => {
      expect(derive({}, { payoutMethodId: 'pm-bank-eur' }).payoutMethod).toEqual(BANK_EUR);
      const newPayoutMethod = { type: PayoutMethodType.OTHER, data: { currency: 'USD' } };
      expect(derive({}, { payoutMethodId: NEW_PAYOUT_METHOD_ID, newPayoutMethod }).payoutMethod).toBe(newPayoutMethod);
    });

    it('offers every supported type for new payout methods, except account balance and Stripe', () => {
      expect(derive({}).newPayoutMethodTypes).toEqual([
        PayoutMethodType.BANK_ACCOUNT,
        PayoutMethodType.OTHER,
        PayoutMethodType.PAYPAL,
      ]);
    });
  });

  describe('Expense types', () => {
    it('exposes the account supported types', () => {
      const options = derive({});
      expect(options.supportedExpenseTypes).toEqual(['INVOICE', 'RECEIPT']);
      expect(options.hasInvalidAccount).toBeUndefined();
    });

    it('flags accounts that do not support invoices nor reimbursements', () => {
      expect(derive({ account: collective({ supportedExpenseTypes: ['GRANT'] }) }).hasInvalidAccount).toBe(true);
    });
  });

  describe('currencies', () => {
    it('defaults to the account and payout method currencies', () => {
      const options = derive({}, { payoutMethodId: 'pm-bank-eur' });
      expect(options.availableReferenceCurrencies).toEqual(['USD', 'EUR']);
      expect(options.expenseCurrency).toBeUndefined();
    });

    it('uses the item currencies when set, and the reference currency among them', () => {
      const expenseItems = [
        { amount: { valueInCents: 1, currency: 'EUR' } },
        { amount: { valueInCents: 1, currency: 'GBP' } },
      ];
      const options = derive({}, { expenseItems, referenceCurrency: 'GBP' as any });
      expect(options.availableReferenceCurrencies).toEqual(['EUR', 'GBP']);
      expect(options.expenseCurrency).toBe('GBP');
    });

    it('uses the only available currency', () => {
      expect(derive({}).expenseCurrency).toBe('USD');
    });

    it('keeps Grants in the account currency, unless the submitter is a host admin', () => {
      const account = collective({ currency: 'EUR' });
      const grant = { expenseTypeOption: ExpenseType.GRANT, payoutMethodId: 'pm-bank-usd' };
      expect(derive({ account }, grant).availableReferenceCurrencies).toEqual(['EUR']);
      const hostAdmin = mockLoggedInUser({ slug: 'jane', adminOf: ['host-one'] });
      expect(derive({ account }, grant, {}, hostAdmin).availableReferenceCurrencies).toEqual(['EUR', 'USD']);
    });

    it('keeps the expense currency when the amount is locked', () => {
      const expense = existingExpense({ currency: 'EUR', lockedFields: [ExpenseLockableFields.AMOUNT] });
      const options = derive({ expense }, {}, { expenseId: 555 });
      expect(options.lockedFields).toEqual([ExpenseLockableFields.AMOUNT]);
      expect(options.availableReferenceCurrencies).toEqual(['EUR']);
    });

    it('ignores locked fields when duplicating', () => {
      const expense = existingExpense({ lockedFields: [ExpenseLockableFields.AMOUNT] });
      expect(derive({ expense }, {}, { expenseId: 555, duplicateExpense: true }).lockedFields).toBeUndefined();
    });
  });

  describe('per-type flags', () => {
    it.each([
      [
        ExpenseType.INVOICE,
        {
          isLongFormItemDescription: false,
          hasExpenseItemDate: true,
          canSetupRecurrence: true,
          allowExpenseItemAttachment: false,
        },
      ],
      [
        ExpenseType.RECEIPT,
        {
          isLongFormItemDescription: false,
          hasExpenseItemDate: true,
          canSetupRecurrence: true,
          allowExpenseItemAttachment: true,
        },
      ],
      [
        ExpenseType.CHARGE,
        {
          isLongFormItemDescription: false,
          hasExpenseItemDate: true,
          canSetupRecurrence: true,
          allowExpenseItemAttachment: true,
        },
      ],
      [
        ExpenseType.GRANT,
        {
          isLongFormItemDescription: true,
          hasExpenseItemDate: false,
          canSetupRecurrence: false,
          allowExpenseItemAttachment: false,
          allowDifferentItemCurrency: false,
        },
      ],
    ])('sets the flags for %s', (expenseTypeOption, flags) => {
      expect(derive({}, { expenseTypeOption })).toEqual(expect.objectContaining(flags));
    });
  });

  describe('tax type', () => {
    it.each([
      ['an account with its own VAT', { account: collective({ settings: { VAT: { type: 'OWN' } } }) }, 'VAT'],
      ['a Host with GST', { account: collective({ host: host({ settings: { GST: { number: '123' } } }) }) }, 'GST'],
      ['an account without tax', {}, undefined],
    ])('uses the tax type of %s', (_, data, taxType) => {
      expect(derive(data).taxType).toBe(taxType);
    });

    it('keeps the tax type of an existing expense', () => {
      const expense = existingExpense({ taxes: [{ type: 'GST', rate: 0.15, idNumber: '1' }] });
      expect(derive({ expense }, {}, { expenseId: 555 }).taxType).toBe('GST');
    });

    it('only applies to invoices', () => {
      const account = collective({ settings: { VAT: { type: 'OWN' } } });
      expect(derive({ account }, { expenseTypeOption: ExpenseType.RECEIPT }).taxType).toBeUndefined();
    });
  });

  describe('invites', () => {
    it('allows invites, except for inline edits and drafts', () => {
      expect(derive({}).allowInvite).toBe(true);
      expect(derive({}, {}, { isInlineEdit: true }).allowInvite).toBe(false);
      const draft = existingExpense({ status: 'DRAFT', draft: {} });
      expect(derive({ expense: draft }, {}, { expenseId: 555 }).allowInvite).toBe(false);
    });

    it('exposes the invitee being typed', () => {
      const options = derive({ payee: null }, { payeeSlug: PAYEE_SLUG_INVITE, inviteeNewIndividual: { name: 'N' } });
      expect(options.invitee).toEqual({ name: 'N' });
    });

    it('exposes the draft invitee to a logged-out payee', () => {
      const draft = existingExpense({ status: 'DRAFT', payee: null, draft: { payee: { name: 'Invitee' } } });
      const options = derive(
        { expense: draft, loggedInAccount: null, payee: null },
        { payeeSlug: undefined },
        { expenseId: 555 },
        null,
      );
      expect(options.invitee).toEqual({ name: 'Invitee' });
      expect(options.canChangeAccount).toBe(false);
    });
  });

  describe('administered payees', () => {
    it('treats the administered-account pickers as administered', () => {
      expect(derive({ payee: null }, { payeeSlug: PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER }).isAdminOfPayee).toBe(true);
    });
  });

  it('computes the invoiced total in the expense currency', () => {
    const expenseItems = [
      { amount: { valueInCents: 1000, currency: 'USD' } },
      { amount: { valueInCents: 500, currency: 'USD' } },
    ];
    expect(derive({}, { expenseItems }).totalInvoicedInExpenseCurrency).toBe(1500);
  });

  it('derives empty options before the query answered', () => {
    const options = deriveFormOptions({}, values(), {}, null);
    expect(options.account).toBeUndefined();
    expect(options.payee).toBeUndefined();
    expect(options.payoutMethods).toBeUndefined();
    expect(options.availableReferenceCurrencies).toEqual([]);
  });
});
