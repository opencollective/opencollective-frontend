/* eslint-disable @typescript-eslint/no-explicit-any */
import { TaxType } from '@opencollective/taxes';
import dayjs from 'dayjs';
import { set } from 'lodash-es';
import { createIntl } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { Currency, ExpenseType } from '../../../lib/graphql/types/v2/graphql';
import { PAYEE_SLUG_INVITE, PAYEE_SLUG_INVITE_EXISTING_USER } from '../../expenses/lib/constants';

import { getCustomZodErrorMap } from '../../FormikZod';

import { buildFormSchema, isValidRecurrenceEndAt } from './form-schema';
import type { ExpenseFormOptions, ExpenseFormValues } from './types';
import { InviteeAccountType, RecurrenceFrequencyOption, YesNoOption } from './types';

const INVALID_URL = 'This URL is not valid, make sure it starts with its protocol (e.g., https://)';

const intl = createIntl({ locale: 'en' });

const options = (overrides: Partial<ExpenseFormOptions> = {}): Omit<ExpenseFormOptions, 'schema'> =>
  ({
    account: { slug: 'collective', type: CollectiveType.COLLECTIVE, supportedExpenseTypes: ['INVOICE', 'RECEIPT'] },
    payee: { slug: 'jane', type: CollectiveType.USER, payoutMethods: [{ id: 'pm-1' }] },
    loggedInAccount: { slug: 'jane' },
    isAdminOfPayee: true,
    supportedExpenseTypes: [ExpenseType.INVOICE, ExpenseType.RECEIPT],
    availableReferenceCurrencies: [Currency.USD],
    expenseCurrency: Currency.USD,
    ...overrides,
  }) as any;

const validInvoice = (overrides: Partial<ExpenseFormValues> = {}): ExpenseFormValues => ({
  accountSlug: 'collective',
  payeeSlug: 'jane',
  payoutMethodId: 'pm-1',
  title: 'Design',
  expenseTypeOption: ExpenseType.INVOICE,
  hasInvoiceOption: YesNoOption.YES,
  invoiceFile: 'https://e.x/invoice.pdf',
  inviteeAccountType: InviteeAccountType.INDIVIDUAL,
  inviteeNewIndividual: {},
  inviteeNewOrganization: { organization: {} },
  newPayoutMethod: { data: {} },
  additionalAttachments: [],
  hasTax: false,
  tax: null,
  expenseItems: [
    {
      description: 'Design',
      incurredAt: '2025-03-01',
      amount: { valueInCents: 100, currency: 'USD', exchangeRate: null },
    },
  ],
  ...overrides,
});

/** Validates the values and returns the errors the way the form reports them */
const errorsFor = (schemaOptions: Omit<ExpenseFormOptions, 'schema'>, values: ExpenseFormValues, pick?) => {
  const result = buildFormSchema(schemaOptions, intl, pick).safeParse(values, { errorMap: getCustomZodErrorMap(intl) });
  const errors = {};
  if (!result.success) {
    result.error.issues.forEach(issue => set(errors, issue.path, issue.message));
  }
  return errors;
};

describe('buildFormSchema', () => {
  it('validates the additional attachment URLs', () => {
    const values = validInvoice({ additionalAttachments: ['https://e.x/a.pdf', { url: 'not a url' }, 'nope'] });
    expect(errorsFor(options(), values)).toEqual({
      additionalAttachments: [undefined, { url: INVALID_URL }, INVALID_URL],
    });
  });

  it('accepts a valid invoice', () => {
    expect(errorsFor(options(), validInvoice())).toEqual({});
  });

  it('validates the values it is given rather than the values it was built with', () => {
    const schema = buildFormSchema(options(), intl);
    expect(schema.safeParse(validInvoice()).success).toBe(true);
    expect(schema.safeParse(validInvoice({ title: '' })).success).toBe(false);
    expect(schema.safeParse(validInvoice({ title: '', payeeSlug: PAYEE_SLUG_INVITE })).success).toBe(false); // Invitee required
  });

  it.each([
    ['a title', { title: '' }, { title: 'Required' }],
    ['a short title', { title: 'x'.repeat(256) }, { title: 'Expense description is too long (max 255 characters).' }],
    ['an invoice file when uploading one', { invoiceFile: null }, { invoiceFile: 'Required' }],
    ['a payee', { payeeSlug: '__findAccountIAdminister' }, { payeeSlug: 'Required' }],
    [
      'different payer and payee',
      { payeeSlug: 'collective' },
      {
        accountSlug: 'The account paying and the account getting paid must be different.',
        payeeSlug: 'The account paying and the account getting paid must be different.',
      },
    ],
    [
      'a future recurrence end date',
      { recurrenceFrequency: RecurrenceFrequencyOption.MONTH, recurrenceEndAt: '2020-01-01' },
      { recurrenceEndAt: 'End date must be in the future' },
    ],
  ])('requires %s', (_, values, errors) => {
    expect(errorsFor(options(), validInvoice(values as any))).toEqual(errors);
  });

  it.each([
    ['for invites', { payeeSlug: PAYEE_SLUG_INVITE_EXISTING_USER, inviteeExistingAccount: 'bob' }],
    ['for Grants', { expenseTypeOption: ExpenseType.GRANT }],
  ])('does not require a title %s', (_, values) => {
    const grantOptions = options({ supportedExpenseTypes: [ExpenseType.GRANT, ExpenseType.INVOICE] });
    expect(errorsFor(grantOptions, validInvoice({ title: '', ...values }))).not.toHaveProperty('title');
  });

  it('does not require an invoice file when it is generated', () => {
    expect(errorsFor(options(), validInvoice({ invoiceFile: null, hasInvoiceOption: YesNoOption.NO }))).toEqual({});
  });

  it('requires receipts on reimbursement items', () => {
    const values = validInvoice({ expenseTypeOption: ExpenseType.RECEIPT });
    expect(errorsFor(options(), values)).toEqual({ expenseItems: [{ attachment: 'Required' }] });
  });

  it('rejects an account that does not support the expense type', () => {
    expect(errorsFor(options({ supportedExpenseTypes: [ExpenseType.GRANT] }), validInvoice())).toEqual({
      accountSlug: 'The selected account does not support expense submissions.',
    });
  });

  it('rejects a payout method that is not one of the payee', () => {
    expect(errorsFor(options(), validInvoice({ payoutMethodId: 'pm-other' }))).toEqual({ payoutMethodId: 'Required' });
  });

  describe('invitees', () => {
    it('requires the new individual name and a valid email', () => {
      const values = validInvoice({ payeeSlug: PAYEE_SLUG_INVITE, inviteeNewIndividual: { email: 'nope' } });
      expect(errorsFor(options({ payee: null }), values)).toEqual({
        inviteeNewIndividual: { name: 'Required', email: 'This email address is not valid' },
      });
    });

    it('requires the new organization details', () => {
      const values = validInvoice({
        payeeSlug: PAYEE_SLUG_INVITE,
        inviteeAccountType: InviteeAccountType.ORGANIZATION,
        inviteeNewOrganization: { name: 'Admin', email: 'admin@example.com', organization: { name: 'Org' } },
      });
      expect(errorsFor(options({ payee: null }), values)).toEqual({
        inviteeNewOrganization: { organization: { slug: 'Required', description: 'Required' } },
      });
    });
  });

  describe('currencies', () => {
    it('requires a reference currency when several are available', () => {
      const multiCurrency = options({ availableReferenceCurrencies: [Currency.USD, Currency.EUR] });
      expect(errorsFor(multiCurrency, validInvoice())).toEqual({ referenceCurrency: 'Required' });
      expect(errorsFor(multiCurrency, validInvoice({ referenceCurrency: Currency.EUR }))).toEqual({});
    });

    it('requires an exchange rate for items in another currency', () => {
      const values = validInvoice();
      values.expenseItems[0].amount.currency = 'EUR';
      expect(errorsFor(options(), values)).toEqual({
        expenseItems: [{ amount: { exchangeRate: { value: 'Missing exchange rate' } } }],
      });
    });
  });

  describe('tax', () => {
    it('validates VAT numbers and rates', () => {
      const values = validInvoice({ hasTax: true, tax: { rate: 1.5, idNumber: 'invalid' } });
      expect(errorsFor(options({ taxType: TaxType.VAT }), values)).toEqual({
        tax: { rate: 'Value must be between 0% and 100%', idNumber: 'Invalid VAT Number' },
      });
    });

    it('only accepts the GST rates', () => {
      const values = validInvoice({ hasTax: true, tax: { rate: 0.1, idNumber: '1' } });
      expect(errorsFor(options({ taxType: TaxType.GST }), values)).toEqual({
        tax: { rate: 'Must be one of: 0%, 15%' },
      });
    });
  });

  describe('policies', () => {
    it('requires acknowledging the account invoice policy', () => {
      const account = { ...options().account, policies: { EXPENSE_POLICIES: { invoicePolicy: 'Read me' } } };
      expect(errorsFor(options({ account } as any), validInvoice())).toEqual({
        acknowledgedCollectiveInvoiceExpensePolicy: 'Required',
      });
      expect(
        errorsFor(options({ account } as any), validInvoice({ acknowledgedCollectiveInvoiceExpensePolicy: true })),
      ).toEqual({});
    });
  });

  it('only validates the picked fields', () => {
    const values = validInvoice({
      title: '',
      expenseItems: [{ amount: { valueInCents: 0, currency: 'USD', exchangeRate: null } }],
    });
    expect(errorsFor(options(), values, ['title'])).toEqual({ title: 'Required' });
  });
});

describe('isValidRecurrenceEndAt', () => {
  it('accepts an empty end date (open-ended recurrence)', () => {
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, undefined)).toBe(true);
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, null)).toBe(true);
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, '')).toBe(true);
  });

  it('accepts any end date when recurrence is disabled', () => {
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.NONE, '2020-01-01')).toBe(true);
    expect(isValidRecurrenceEndAt(undefined, '2020-01-01')).toBe(true);
  });

  it('only accepts end dates that are valid dates in the future', () => {
    const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, tomorrow)).toBe(true);
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, yesterday)).toBe(false);
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, 'not-a-date')).toBe(false);
  });
});
