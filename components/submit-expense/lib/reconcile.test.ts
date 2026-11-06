/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmpty } from 'lodash-es';

import { Currency, ExpenseLockableFields, ExpenseType } from '../../../lib/graphql/types/v2/graphql';
import { NEW_PAYOUT_METHOD_ID, PAYEE_SLUG_VENDOR } from '../../expenses/lib/constants';

import { existingExpense } from '../testing/expense-form-fixtures';

import { applyExchangeRates, type ReconcileContext, reconcileExpenseForm } from './reconcile';
import type { ExpenseFormOptions, ExpenseFormValues } from './types';
import { InviteeAccountType, YesNoOption } from './types';

const values = (overrides: Partial<ExpenseFormValues> = {}): ExpenseFormValues => ({
  accountSlug: 'collective',
  payeeSlug: 'jane',
  payoutMethodId: 'pm-usd',
  payoutMethodNameDiscrepancyReason: '',
  title: '',
  expenseTypeOption: ExpenseType.INVOICE,
  hasInvoiceOption: YesNoOption.YES,
  inviteeAccountType: InviteeAccountType.INDIVIDUAL,
  inviteeNewIndividual: {},
  inviteeNewOrganization: { organization: {} },
  newPayoutMethod: { data: {} },
  additionalAttachments: [],
  hasTax: false,
  tax: null,
  expenseItems: [{ description: '', amount: { valueInCents: 0, currency: 'USD', exchangeRate: null } }],
  ...overrides,
});

const PM_USD = { id: 'pm-usd', type: 'BANK_ACCOUNT', data: { currency: 'USD' } };
const PM_EUR = { id: 'pm-eur', type: 'BANK_ACCOUNT', data: { currency: 'EUR' } };

const options = (overrides: Record<string, any> = {}): ExpenseFormOptions =>
  ({
    schema: null,
    host: { slug: 'host-one' },
    taxType: undefined,
    payoutProfiles: [{ id: 'jane-id', slug: 'jane', type: 'INDIVIDUAL' }],
    payoutMethods: [PM_USD, PM_EUR],
    allowDifferentItemCurrency: true,
    supportedExpenseTypes: [ExpenseType.INVOICE, ExpenseType.RECEIPT],
    availableReferenceCurrencies: [Currency.USD],
    expenseCurrency: Currency.USD,
    accountingCategories: [{ id: 'cat-1' }],
    ...overrides,
  }) as ExpenseFormOptions;

const context = (overrides: Partial<ReconcileContext> = {}): ReconcileContext => ({
  phase: 'ready',
  hydrated: false,
  itemCurrencyChosen: false,
  titleEdited: false,
  accountChosen: false,
  startOptions: {},
  ...overrides,
});

type Step = { values?: Partial<ExpenseFormValues>; options?: Record<string, any>; context?: Partial<ReconcileContext> };

/**
 * Settles the form on the base step (running reconcile until it changes nothing, like the hook does),
 * applies each change the same way, and returns the result of the first run after the last change.
 */
const afterChange = (base: Step, ...changes: Step[]) => {
  let state = null;
  let currentValues = values(base.values);
  let step = base;
  const run = () => {
    const result = reconcileExpenseForm(state, currentValues, options(step.options), context(step.context));
    state = result.state;
    currentValues = { ...currentValues, ...result.patch };
    return result;
  };
  const settle = () => {
    for (let i = 0; i < 10 && !isEmpty(run().patch); i++) {
      // Keep running until the values are consistent
    }
  };

  settle();
  let result;
  changes.forEach((change, i) => {
    step = { options: { ...step.options, ...change.options }, context: { ...step.context, ...change.context } };
    currentValues = { ...currentValues, ...change.values };
    if (i < changes.length - 1) {
      settle();
    } else {
      result = run();
    }
  });
  return result;
};

const firstRun = (v: Partial<ExpenseFormValues> = {}, o: Record<string, any> = {}, c: Partial<ReconcileContext> = {}) =>
  reconcileExpenseForm(null, values(v), options(o), context(c));

describe('reconcileExpenseForm', () => {
  it('changes nothing on consistent values', () => {
    expect(firstRun().patch).toEqual({});
  });

  describe('hydrateFromExpense', () => {
    it('loads the values of an existing expense once', () => {
      const expense = existingExpense({ tags: ['a'], privateMessage: 'p' });
      const result = firstRun(
        { payeeSlug: undefined },
        { expense },
        { phase: 'loading', startOptions: { expenseId: 555 } },
      );
      expect(result.hydrated).toBe(true);
      expect(result.touched).toEqual(expect.objectContaining({ title: true, expenseItems: true }));
      expect(result.patch).toEqual(
        expect.objectContaining({ title: 'Existing expense', payeeSlug: 'jane', tags: ['a'], privateMessage: 'p' }),
      );

      const again = reconcileExpenseForm(null, values(), options({ expense }), context({ hydrated: true }));
      expect(again.hydrated).toBe(false);
    });

    it('loads a draft invitee', () => {
      const expense = existingExpense({
        status: 'DRAFT',
        payee: null,
        longDescription: 'Note',
        draft: { payee: { name: 'Org admin', organization: { name: 'Org' } }, items: [] },
      });
      const { patch } = firstRun({ payeeSlug: undefined }, { expense }, { phase: 'loading' });
      expect(patch).toEqual(
        expect.objectContaining({
          inviteeAccountType: InviteeAccountType.ORGANIZATION,
          inviteeNewOrganization: { name: 'Org admin', organization: { name: 'Org' } },
          inviteNote: 'Note',
        }),
      );
    });
  });

  describe('defaults', () => {
    const recentlySubmittedExpenses = {
      nodes: [
        { account: { slug: 'last-account' }, payee: { id: 'org-id', slug: 'org' }, payoutMethod: { id: 'pm-eur' } },
      ],
    };
    const payoutProfiles = [
      { id: 'jane-id', slug: 'jane', type: 'INDIVIDUAL' },
      { id: 'org-id', slug: 'org', type: 'ORGANIZATION' },
    ];

    it.each([
      ['the last submitted account', { accountSlug: undefined }, {}, { accountSlug: 'last-account' }],
      ['no account when the submitter picked one', { accountSlug: undefined }, { accountChosen: true }, {}],
      ['the last used payee profile', { payeeSlug: undefined }, {}, { payeeSlug: 'org' }],
    ])('selects %s', (_, v, c, expected) => {
      const { patch } = firstRun({ payoutMethodId: 'pm-eur', ...v }, { recentlySubmittedExpenses, payoutProfiles }, c);
      expect(patch).toEqual(expect.objectContaining(expected));
      if (!Object.keys(expected).length) {
        expect(patch).not.toHaveProperty('accountSlug');
      }
    });

    it('selects the personal profile without recent expenses', () => {
      expect(firstRun({ payeeSlug: undefined }, { payoutProfiles }).patch.payeeSlug).toBe('jane');
    });

    it('selects the last used payout method, or the first one', () => {
      expect(
        firstRun(
          { payoutMethodId: undefined },
          { recentlySubmittedExpenses: { nodes: [{ payee: { slug: 'jane' }, payoutMethod: { id: 'pm-eur' } }] } },
        ).patch.payoutMethodId,
      ).toBe('pm-eur');
      expect(firstRun({ payoutMethodId: undefined }).patch.payoutMethodId).toBe('pm-usd');
    });

    it('waits for the payout methods to load before selecting one', () => {
      expect(
        firstRun({ payoutMethodId: 'pm-unknown' }, { payoutMethods: undefined }, { phase: 'loading' }).patch,
      ).not.toHaveProperty('payoutMethodId');
    });

    it('keeps the payout method of the expense being edited', () => {
      const expense = { id: 'e', payee: { slug: 'jane' }, payoutMethod: { id: 'pm-old' } };
      const result = firstRun(
        { payoutMethodId: 'pm-old' },
        { expense, payoutMethods: [PM_USD, { id: 'pm-old' }] },
        { hydrated: true },
      );
      expect(result.patch).not.toHaveProperty('payoutMethodId');
    });

    it('selects "New payout method" when an invited payee confirms a draft', () => {
      const { patch } = firstRun(
        { payoutMethodId: undefined },
        { expense: { status: 'DRAFT' }, loggedInAccount: null, payoutMethods: undefined },
        { hydrated: true },
      );
      expect(patch.payoutMethodId).toBe(NEW_PAYOUT_METHOD_ID);
    });
  });

  it('replaces a Vendor payee when the new Host does not have that Vendor', () => {
    const vendor = { slug: 'vendor' };
    const result = afterChange(
      { values: { payeeSlug: 'vendor' }, options: { vendorsForAccount: [vendor] } },
      { values: { accountSlug: 'elsewhere' }, options: { host: { slug: 'host-two' }, vendorsForAccount: [] } },
    );
    // Cleared; the payee default then applies on the next run
    expect(result.patch.payeeSlug).toBeNull();
  });

  it('clears the vendor picker when the Host loads without vendors', () => {
    expect(firstRun({ payeeSlug: PAYEE_SLUG_VENDOR }, { vendorsForAccount: [] }).patch.payeeSlug).toBeNull();
  });

  it('clears an Expense type that the account does not support', () => {
    expect(firstRun({}, { supportedExpenseTypes: [ExpenseType.RECEIPT] }).patch.expenseTypeOption).toBeNull();
    expect(
      firstRun({}, { supportedExpenseTypes: [ExpenseType.RECEIPT], expense: { id: 'e' } }, { hydrated: true }).patch,
    ).not.toHaveProperty('expenseTypeOption');
    expect(
      firstRun({}, { supportedExpenseTypes: [ExpenseType.RECEIPT] }, { phase: 'loading' }).patch,
    ).not.toHaveProperty('expenseTypeOption');
  });

  describe('attachmentsFollowExpenseType', () => {
    it('keeps the attachments of an expense being loaded', () => {
      const expense = existingExpense({ items: [{ ...existingExpense().items[0], url: 'item.pdf' }] });
      const { patch } = firstRun({ expenseTypeOption: undefined }, { expense }, { phase: 'loading' });
      expect(patch.expenseItems[0].attachment).toBe('item.pdf');
      expect(patch).not.toHaveProperty('invoiceFile');
    });

    it('moves a single receipt to the invoice file', () => {
      const result = afterChange(
        {
          values: {
            expenseTypeOption: ExpenseType.RECEIPT,
            hasInvoiceOption: YesNoOption.NO,
            expenseItems: [{ attachment: 'r.pdf', amount: { currency: 'USD' } }],
          },
        },
        { values: { expenseTypeOption: ExpenseType.INVOICE } },
      );
      expect(result.patch).toEqual(
        expect.objectContaining({ invoiceFile: 'r.pdf', hasInvoiceOption: YesNoOption.YES }),
      );
      expect(result.patch.expenseItems[0].attachment).toBeNull();
    });

    it('moves several receipts to the additional attachments', () => {
      const items = [
        { attachment: 'a.pdf', amount: { currency: 'USD' } },
        { attachment: 'b.pdf', amount: { currency: 'USD' } },
      ];
      const result = afterChange(
        { values: { expenseTypeOption: ExpenseType.RECEIPT, expenseItems: items, additionalAttachments: ['x.pdf'] } },
        { values: { expenseTypeOption: ExpenseType.INVOICE } },
      );
      expect(result.patch.additionalAttachments).toEqual(['x.pdf', 'a.pdf', 'b.pdf']);
      expect(result.patch.expenseItems.map(i => i.attachment)).toEqual([null, null]);
    });

    it('moves the invoice file to the item receipts', () => {
      const result = afterChange(
        { values: { invoiceFile: 'i.pdf' } },
        { values: { expenseTypeOption: ExpenseType.RECEIPT } },
      );
      expect(result.patch.invoiceFile).toBeNull();
      expect(result.patch.expenseItems[0].attachment).toBe('i.pdf');
    });
  });

  describe('tax', () => {
    it('drops the tax when the account does not support it', () => {
      expect(firstRun({ hasTax: true, tax: { rate: 0.2, idNumber: 'x' } }).patch).toEqual({ hasTax: false, tax: null });
    });

    it('pre-fills the Vendor tax ID when enabling tax', () => {
      const vendorsForAccount = [{ slug: 'vendor', vendorInfo: { taxType: 'VAT', taxId: 'FR123' } }];
      const result = afterChange(
        { values: { payeeSlug: 'vendor' }, options: { taxType: 'VAT', vendorsForAccount } },
        { values: { hasTax: true } },
      );
      expect(result.patch.tax).toEqual({ idNumber: 'FR123', rate: 0 });
    });
  });

  it.each([
    [
      'the accounting category when the Host has none',
      { accountingCategoryId: 'cat-1' },
      { accountingCategories: [] },
      { accountingCategoryId: null },
    ],
    ['an unavailable reference currency', { referenceCurrency: Currency.GBP }, {}, { referenceCurrency: null }],
  ])('clears %s', (_, v, o, expected) => {
    expect(firstRun(v, o).patch).toEqual(expect.objectContaining(expected));
  });

  describe('item currencies', () => {
    it('use the only available currency', () => {
      const { patch } = firstRun(
        { expenseItems: [{ amount: { valueInCents: 1 } }] },
        {
          availableReferenceCurrencies: [Currency.EUR],
          expenseCurrency: Currency.EUR,
          allowDifferentItemCurrency: false,
        },
      );
      expect(patch.expenseItems[0].amount.currency).toBe('EUR');
    });

    it('use the expense currency when missing', () => {
      const items = [{ amount: { valueInCents: 1, currency: 'USD' } }, { amount: { valueInCents: 1 } }];
      const { patch } = firstRun(
        { expenseItems: items },
        { availableReferenceCurrencies: [Currency.USD, Currency.EUR] },
      );
      expect(patch.expenseItems[1].amount.currency).toBe('USD');
    });

    it('follow the payout method currency', () => {
      const result = afterChange({}, { values: { payoutMethodId: 'pm-eur' } });
      expect(result.patch.expenseItems[0].amount.currency).toBe('EUR');
    });

    it.each([
      ['the submitter picked a currency', {}, { itemCurrencyChosen: true }],
      ['editing inline', {}, { startOptions: { isInlineEdit: true } }],
      ['the items come from an existing expense', { expense: { id: 'e', status: 'PENDING' } }, {}],
      [
        'completing a draft with a currency',
        { expense: { id: 'e', status: 'DRAFT', draft: { items: [{ currency: 'USD' }] } } },
        {},
      ],
    ])('do not follow the payout method currency when %s', (_, o, c) => {
      const result = afterChange(
        { options: o, context: { hydrated: true, ...c } },
        { values: { payoutMethodId: 'pm-eur' } },
      );
      expect(result.patch.expenseItems).toBeUndefined();
    });
  });

  describe('title', () => {
    it('defaults to the single item description', () => {
      const result = afterChange(
        {},
        { values: { expenseItems: [{ description: 'Laptop', amount: { currency: 'USD', exchangeRate: null } }] } },
      );
      expect(result.patch.title).toBe('Laptop');
    });

    it.each([
      ['the title was edited', {}, { titleEdited: true }, {}],
      ['the title is locked', { lockedFields: [ExpenseLockableFields.DESCRIPTION] }, {}, {}],
      [
        'the expense is a Grant',
        { supportedExpenseTypes: [ExpenseType.GRANT] },
        {},
        { expenseTypeOption: ExpenseType.GRANT },
      ],
    ])('is not changed when %s', (_, o, c, v) => {
      const result = afterChange(
        { values: v, options: o, context: c },
        { values: { expenseItems: [{ description: 'Laptop', amount: { currency: 'USD', exchangeRate: null } }] } },
      );
      expect(result.patch).not.toHaveProperty('title');
    });

    it('is not overwritten while the submitter types it', () => {
      const result = afterChange(
        { values: { expenseItems: [{ description: 'Laptop', amount: { currency: 'USD' } }] } },
        { values: { title: 'My t' } },
      );
      expect(result.patch).not.toHaveProperty('title');
    });
  });

  it('resets the name-discrepancy reason when the payout method changes', () => {
    const result = afterChange(
      {},
      { values: { payoutMethodNameDiscrepancyReason: 'Joint' } },
      { values: { payoutMethodId: 'pm-eur' } },
    );
    expect(result.patch.payoutMethodNameDiscrepancyReason).toBe('');
    expect(result.touched).toEqual({ payoutMethodNameDiscrepancyReason: false });
  });

  describe('exchange rates', () => {
    const items = [
      { incurredAt: '2025-03-01', amount: { valueInCents: 1, currency: 'USD', exchangeRate: { value: 1 } } },
      { incurredAt: '2025-03-01', amount: { valueInCents: 1, currency: 'EUR' } },
    ];

    it('lists the rates to fetch and drops rates of items in the expense currency', () => {
      const result = firstRun(
        { expenseItems: items as any },
        { availableReferenceCurrencies: [Currency.USD, Currency.EUR] },
      );
      expect(result.exchangeRateRequests).toEqual([
        { fromCurrency: 'EUR', toCurrency: 'USD', date: new Date('2025-03-01') },
      ]);
      expect(result.patch.expenseItems[0].amount.exchangeRate).toBeNull();
    });

    it('keeps listing the rates to fetch until the items change', () => {
      const result = afterChange({ values: { expenseItems: items as any } }, { values: { title: 'x' } });
      expect(result.exchangeRateRequests).toHaveLength(1);
    });

    it('applies fetched rates', () => {
      const rate = {
        value: 1.1,
        source: 'OPENCOLLECTIVE',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        date: '2025-03-01T00:00:00Z',
      };
      const updated = applyExchangeRates(values({ expenseItems: items as any }), Currency.USD, [rate]);
      expect(updated.expenseItems[1].amount.exchangeRate).toEqual(rate);
      expect(updated.expenseItems[1].amount.referenceExchangeRate).toEqual(rate);
    });

    it('leaves the values untouched without rates', () => {
      const v = values({ expenseItems: items as any });
      expect(applyExchangeRates(v, Currency.USD, [])).toBe(v);
    });
  });

  it('runs a rule again only when its dependencies changed', () => {
    // The tax is dropped when the tax type goes away...
    const first = firstRun({}, { taxType: undefined });
    // ...but enabling it again without a change of tax type is left to the submitter
    const second = reconcileExpenseForm(first.state, values({ hasTax: true }), options(), context());
    expect(second.patch).not.toHaveProperty('hasTax');
  });
});
