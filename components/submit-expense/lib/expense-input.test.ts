import { TaxType } from '@opencollective/taxes';
import dayjs from 'dayjs';

import { CollectiveType } from '../../../lib/constants/collectives';
import { Currency, ExpenseStatus, ExpenseType, PayoutMethodType } from '../../../lib/graphql/types/v2/graphql';
import {
  NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID,
  NEW_PAYOUT_METHOD_ID,
  PAYEE_SLUG_INVITE,
  PAYEE_SLUG_INVITE_EXISTING_USER,
} from '../../expenses/lib/constants';

import { getExpenseEditInputSlice, planExpenseSubmission } from './expense-input';
import type { ExpenseFormOptions, ExpenseFormValues } from './types';
import { InviteeAccountType, RecurrenceFrequencyOption, YesNoOption } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

const values = (overrides: Partial<ExpenseFormValues> = {}): ExpenseFormValues => ({
  accountSlug: 'collective',
  payeeSlug: 'jane',
  title: 'Design work',
  expenseTypeOption: ExpenseType.INVOICE,
  payoutMethodId: 'pm-1',
  inviteeAccountType: InviteeAccountType.INDIVIDUAL,
  inviteeNewIndividual: {},
  inviteeNewOrganization: { organization: {} },
  newPayoutMethod: { data: {} },
  hasInvoiceOption: YesNoOption.YES,
  invoiceFile: 'https://e.x/invoice.pdf',
  invoiceNumber: 'INV-1',
  additionalAttachments: [],
  recurrenceFrequency: RecurrenceFrequencyOption.NONE,
  expenseItems: [
    {
      id: 'item-1',
      description: 'Design work',
      incurredAt: '2025-03-01',
      amount: { valueInCents: 1000, currency: 'USD' },
    },
  ],
  ...overrides,
});

const options = (overrides: Partial<ExpenseFormOptions> = {}): ExpenseFormOptions =>
  ({
    schema: null,
    account: { slug: 'collective', name: 'Collective' },
    payee: { slug: 'jane', name: 'Jane', type: CollectiveType.USER },
    payoutProfiles: [{ slug: 'jane' }],
    expenseCurrency: Currency.USD,
    ...overrides,
  }) as unknown as ExpenseFormOptions;

const plan = (v: Partial<ExpenseFormValues> = {}, o: Partial<ExpenseFormOptions> = {}, startOptions = {}) =>
  planExpenseSubmission(values(v), options(o), startOptions) as any;

const input = (...args: Parameters<typeof plan>) => {
  const p = plan(...args);
  return p.variables.expenseCreateInput ?? p.variables.expenseInviteInput ?? p.variables.expenseEditInput;
};

describe('planExpenseSubmission', () => {
  describe('submission kind', () => {
    it.each([
      ['an administered payee', {}, {}, {}, 'create'],
      ['a Vendor', { payeeSlug: 'vendor' }, { payee: { slug: 'vendor', type: CollectiveType.VENDOR } }, {}, 'create'],
      ['an invited payee', { payeeSlug: PAYEE_SLUG_INVITE }, { payee: null }, {}, 'invite'],
      ['an existing expense', {}, { expense: { id: 'e1' } }, { expenseId: 1 }, 'edit'],
      ['a duplicated expense', {}, { expense: { id: 'e1' } }, { expenseId: 1, duplicateExpense: true }, 'create'],
    ])('plans %s as %s', (_, v, o, startOptions, kind) => {
      expect(plan(v as any, o as any, startOptions).kind).toBe(kind);
    });
  });

  it('maps a new expense to the create mutation variables', () => {
    expect(plan({}, {}, {}).variables).toEqual({
      account: { slug: 'collective' },
      expenseCreateInput: {
        description: 'Design work',
        reference: 'INV-1',
        payee: { slug: 'jane' },
        payeeLocation: undefined,
        payoutMethod: { id: 'pm-1' },
        type: ExpenseType.INVOICE,
        accountingCategory: null,
        attachedFiles: [],
        currency: 'USD',
        customData: undefined,
        invoiceInfo: null,
        invoiceFile: { url: 'https://e.x/invoice.pdf' },
        items: [
          {
            id: 'item-1',
            description: 'Design work',
            amountV2: { valueInCents: 1000, currency: 'USD', exchangeRate: null },
            incurredAt: new Date('2025-03-01'),
            url: null,
          },
        ],
        longDescription: null,
        privateMessage: null,
        tags: undefined,
        tax: [],
      },
    });
  });

  it('passes custom data through', () => {
    const p = planExpenseSubmission(values(), options(), {}, { customData: { source: 'x' } }) as any;
    expect(p.variables.expenseCreateInput.customData).toEqual({ source: 'x' });
  });

  describe('payout method', () => {
    it.each([
      ['a saved payout method', { payoutMethodId: 'pm-1' }, { id: 'pm-1' }],
      [
        'a new payout method',
        {
          payoutMethodId: NEW_PAYOUT_METHOD_ID,
          newPayoutMethod: { type: PayoutMethodType.OTHER, data: { currency: 'USD' } },
        },
        { type: PayoutMethodType.OTHER, data: { currency: 'USD' }, isSaved: false },
      ],
      ['no payout method', { payoutMethodId: null, newPayoutMethod: { data: {} } }, { data: {}, isSaved: false }],
      [
        'a new account balance',
        { payoutMethodId: NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID },
        { type: PayoutMethodType.ACCOUNT_BALANCE, data: {} },
      ],
    ])('references %s', (_, v, expected) => {
      expect(input(v as any).payoutMethod).toEqual(expected);
    });
  });

  describe('tax', () => {
    it('sends the tax with the tax type', () => {
      expect(input({ hasTax: true, tax: { rate: 0.2, idNumber: 'FR1' } }, { taxType: TaxType.VAT }).tax).toEqual([
        { rate: 0.2, type: TaxType.VAT, idNumber: 'FR1' },
      ]);
    });

    // An empty list (not `null`) so that editing an expense removes its existing taxes
    it('sends an empty tax list when tax is disabled', () => {
      expect(input({ hasTax: false }).tax).toEqual([]);
    });

    it('sends an empty tax list when the account has no tax type', () => {
      expect(input({ hasTax: true, tax: { rate: 0.2, idNumber: 'FR1' } }, { taxType: undefined }).tax).toEqual([]);
    });
  });

  describe('invoice', () => {
    it.each([
      ['an uploaded invoice URL', { invoiceFile: 'https://e.x/a.pdf' }, { url: 'https://e.x/a.pdf' }, 'INV-1'],
      [
        'an uploaded invoice object',
        { invoiceFile: { url: 'https://e.x/b.pdf' } },
        { url: 'https://e.x/b.pdf' },
        'INV-1',
      ],
      ['a generated invoice', { hasInvoiceOption: YesNoOption.NO }, null, null],
      ['a missing invoice', { invoiceFile: null }, undefined, 'INV-1'],
    ])('sends %s', (_, v, invoiceFile, reference) => {
      const i = input(v as any);
      expect(i.invoiceFile).toEqual(invoiceFile);
      expect(i.reference).toEqual(reference);
    });

    it('sends no reference for reimbursements', () => {
      expect(input({ expenseTypeOption: ExpenseType.RECEIPT }).reference).toBeNull();
    });
  });

  describe('items', () => {
    it('sends the exchange rate, dated from the item when the rate has no date', () => {
      const [item] = input({
        expenseItems: [
          {
            description: 'x',
            incurredAt: '2025-03-01',
            amount: {
              valueInCents: 100,
              currency: 'EUR',
              exchangeRate: { value: 1.1, source: 'OPENCOLLECTIVE', fromCurrency: 'EUR', toCurrency: 'USD' },
            },
          },
        ],
      }).items;
      expect(item.amountV2.exchangeRate).toEqual({
        value: 1.1,
        source: 'OPENCOLLECTIVE',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        date: '2025-03-01T00:00:00Z',
      });
    });

    it('sends item URLs for the types whose items carry receipts only', () => {
      const items = [
        {
          description: 'a',
          incurredAt: '2025-03-01',
          amount: { valueInCents: 1, currency: 'USD' },
          attachment: 'https://e.x/a',
        },
        {
          description: 'b',
          incurredAt: '2025-03-01',
          amount: { valueInCents: 1, currency: 'USD' },
          attachment: { url: 'https://e.x/b' },
        },
      ];
      expect(input({ expenseTypeOption: ExpenseType.RECEIPT, expenseItems: items }).items.map(i => i.url)).toEqual([
        'https://e.x/a',
        'https://e.x/b',
      ]);
      expect(input({ expenseTypeOption: ExpenseType.CHARGE, expenseItems: items }).items.map(i => i.url)).toEqual([
        'https://e.x/a',
        'https://e.x/b',
      ]);
      expect(input({ expenseTypeOption: ExpenseType.INVOICE, expenseItems: items }).items.map(i => i.url)).toEqual([
        null,
        null,
      ]);
    });

    it('dates Grant items at submission time', () => {
      const before = Date.now();
      const [item] = input({
        expenseTypeOption: ExpenseType.GRANT,
        expenseItems: [{ amount: { valueInCents: 1, currency: 'USD' } }],
      }).items;
      expect(item.incurredAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  it('sends attachments as URLs', () => {
    expect(input({ additionalAttachments: ['https://e.x/a', { url: 'https://e.x/b' }] }).attachedFiles).toEqual([
      { url: 'https://e.x/a' },
      { url: 'https://e.x/b' },
    ]);
  });

  describe('recurrence', () => {
    it.each([
      ['no recurrence', RecurrenceFrequencyOption.NONE, undefined, undefined],
      ['an open-ended recurrence', RecurrenceFrequencyOption.MONTH, undefined, { interval: 'month', endsAt: null }],
      ['a cleared end date', RecurrenceFrequencyOption.MONTH, '', { interval: 'month', endsAt: null }],
      [
        'an end date',
        RecurrenceFrequencyOption.QUARTER,
        '2125-09-29',
        { interval: 'quarter', endsAt: dayjs('2125-09-29').toDate() },
      ],
      // `dayjs(undefined).toDate()` is the current time: invalid dates must not end the recurrence now
      // (https://github.com/opencollective/opencollective/issues/8907)
      ['an invalid end date', RecurrenceFrequencyOption.MONTH, 'not-a-date', { interval: 'month', endsAt: null }],
    ])('submits %s', (_, recurrenceFrequency, recurrenceEndAt, recurring) => {
      expect(plan({ recurrenceFrequency, recurrenceEndAt }).variables.recurring).toEqual(recurring);
    });
  });

  describe('Grant title', () => {
    it('is generated from the account and payee when empty', () => {
      expect(input({ expenseTypeOption: ExpenseType.GRANT, title: '' }).description).toBe('Collective - Jane');
    });

    it('is generated from the invitee when there is no payee', () => {
      const i = input(
        { expenseTypeOption: ExpenseType.GRANT, title: '', payeeSlug: PAYEE_SLUG_INVITE },
        { payee: null, invitee: { name: 'Invitee' } },
      );
      expect(i.description).toBe('Collective - Invitee');
    });

    it('keeps a title that was set', () => {
      expect(input({ expenseTypeOption: ExpenseType.GRANT, title: 'Research' }).description).toBe('Research');
    });
  });

  describe('invitee', () => {
    it('invites a new individual with the invitation note', () => {
      const p = plan(
        {
          payeeSlug: PAYEE_SLUG_INVITE,
          inviteeNewIndividual: { name: 'N', email: 'n@e.x' },
          inviteNote: 'Hello',
        },
        { payee: null },
      );
      expect(p.variables.account).toEqual({ slug: 'collective' });
      expect(p.variables.expenseInviteInput.payee).toEqual({ name: 'N', email: 'n@e.x', isInvite: true });
      expect(p.variables.expenseInviteInput.recipientNote).toBe('Hello');
    });

    it('invites a new organization', () => {
      const org = { name: 'N', email: 'n@e.x', organization: { name: 'Org', slug: 'org' } };
      const p = plan(
        {
          payeeSlug: PAYEE_SLUG_INVITE,
          inviteeAccountType: InviteeAccountType.ORGANIZATION,
          inviteeNewOrganization: org,
        },
        { payee: null },
      );
      expect(p.variables.expenseInviteInput.payee).toEqual({ ...org, isInvite: true });
    });

    it('invites an existing user', () => {
      const p = plan(
        { payeeSlug: PAYEE_SLUG_INVITE_EXISTING_USER, inviteeExistingAccount: 'bob' },
        { payee: { slug: 'bob', type: CollectiveType.USER } as any },
      );
      expect(p.kind).toBe('invite');
      expect(p.variables.expenseInviteInput.payee).toEqual({ slug: 'bob', isInvite: true });
    });
  });

  describe('edit', () => {
    it('slices the edit input for the fields an edit sub-form edits', () => {
      const p = plan({ hasTax: false }, { expense: { id: 'e1' } as any }, { expenseId: 1 });
      expect(getExpenseEditInputSlice(p, ['payoutMethod', 'tax'])).toEqual({ payoutMethod: { id: 'pm-1' }, tax: [] });
    });

    it('refuses to slice a plan that is not an edit', () => {
      expect(() => getExpenseEditInputSlice(plan(), ['payoutMethod'])).toThrow('Expected an edit submission');
    });

    it('edits the expense with the draft key', () => {
      const p = plan({}, { expense: { id: 'e1' } as any }, { expenseId: 1, draftKey: 'key' });
      expect(p.variables.draftKey).toBe('key');
      expect(p.variables.expenseEditInput).toEqual(expect.objectContaining({ id: 'e1', payee: { slug: 'jane' } }));
    });

    it('sends the invitee details when an invited payee confirms a draft', () => {
      const p = plan(
        { inviteeNewIndividual: { name: 'Typed', email: 't@e.x' } },
        { payee: null, expense: { id: 'e1', status: ExpenseStatus.DRAFT, draft: { payee: { name: 'Draft' } } } as any },
        { expenseId: 1 },
      );
      expect(p.variables.expenseEditInput.payee).toEqual({ name: 'Typed', email: 't@e.x' });
    });
  });
});
