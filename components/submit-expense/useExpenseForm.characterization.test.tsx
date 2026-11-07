/**
 * Characterization tests for the Expense form, through the public interface of `useExpenseForm`.
 * They record today's behaviour so the form model can be refactored safely
 * (https://github.com/opencollective/opencollective/issues/9073).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type LoggedInUser from '../../lib/LoggedInUser';

let mockedLoggedInUser: LoggedInUser | null = null;
jest.mock('../../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ LoggedInUser: mockedLoggedInUser, refetchLoggedInUser: jest.fn() }),
}));

import { act } from '@testing-library/react';

import { ExpenseLockableFields, ExpenseType, PayoutMethodType } from '../../lib/graphql/types/v2/graphql';
import {
  NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID,
  NEW_PAYOUT_METHOD_ID,
  PAYEE_SLUG_CREATE_LEGAL_ENTITY,
  PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER,
  PAYEE_SLUG_INVITE,
  PAYEE_SLUG_INVITE_EXISTING_USER,
  PAYEE_SLUG_INVITE_SOMEONE,
  PAYEE_SLUG_NEW_VENDOR,
  PAYEE_SLUG_VENDOR,
} from '../expenses/lib/constants';

import {
  collective,
  existingExpense,
  expenseItem,
  host,
  individual,
  loggedInAccount,
  payoutMethod,
  vendor,
} from './testing/expense-form-fixtures';
import type { ExpenseFormWorld } from './testing/expense-form-test-utils';
import {
  answerFormQuery,
  createMockApolloClient,
  mockLoggedInUser,
  mutationResult,
  renderExpenseFormHook,
  settle,
  setValues,
  silenceApolloMissingFieldErrors,
  submit,
  waitForFormReady,
} from './testing/expense-form-test-utils';
import type { ExpenseFormValues } from './useExpenseForm';
import { InviteeAccountType, RecurrenceFrequencyOption, YesNoOption } from './useExpenseForm';

silenceApolloMissingFieldErrors();

const INVALID_URL = 'This URL is not valid, make sure it starts with its protocol (e.g., https://)';
const BANK_USD = payoutMethod();
const BANK_EUR = payoutMethod({
  id: 'pm-bank-eur',
  name: 'EUR bank',
  data: { currency: 'EUR', accountHolderName: 'Jane Doe' },
});

const newExpenseValues = (overrides: Partial<ExpenseFormValues> = {}): ExpenseFormValues => ({
  accountSlug: 'collective',
  payeeSlug: 'jane',
  title: '',
  expenseTypeOption: ExpenseType.INVOICE,
  inviteeAccountType: InviteeAccountType.INDIVIDUAL,
  expenseItems: [{ key: 'initial', amount: { valueInCents: 0 }, description: '' }],
  additionalAttachments: [],
  recurrenceFrequency: RecurrenceFrequencyOption.NONE,
  hasInvoiceOption: YesNoOption.YES,
  inviteeNewIndividual: {},
  inviteeNewOrganization: { organization: {} },
  newPayoutMethod: { data: {} },
  ...overrides,
});

/** Values used by the edit dialog sub-forms (see `EditExpenseDialog`). */
const inlineEditValues = (overrides: Partial<ExpenseFormValues> = {}): ExpenseFormValues => ({
  inviteeAccountType: InviteeAccountType.INDIVIDUAL,
  expenseItems: [{ amount: { valueInCents: 0, currency: 'USD' }, description: '' }],
  additionalAttachments: [],
  hasInvoiceOption: YesNoOption.YES,
  inviteeNewIndividual: {},
  inviteeNewOrganization: { organization: {} },
  newPayoutMethod: { data: {} },
  ...overrides,
});

const defaultWorld = (overrides: Partial<ExpenseFormWorld> = {}): ExpenseFormWorld => {
  const me = loggedInAccount({ slug: 'jane', payoutMethods: [BANK_USD, BANK_EUR] });
  return {
    loggedInAccount: me,
    accounts: {
      collective: collective(),
      jane: individual({ slug: 'jane', name: 'Jane Doe', payoutMethods: me.payoutMethods }),
      bob: individual({ slug: 'bob', name: 'Bob', id: 'bob-id' }),
    },
    ...overrides,
  };
};

async function setup(opts: {
  world?: ExpenseFormWorld;
  values?: ExpenseFormValues;
  startOptions?: Parameters<typeof renderExpenseFormHook>[1]['startOptions'];
  onSubmit?: jest.Mock;
  customData?: Record<string, unknown>;
  exchangeRates?: (vars: any) => any;
  waitForReady?: boolean;
}) {
  const world = opts.world ?? defaultWorld();
  const mock = createMockApolloClient({
    ExpenseFormSchema: answerFormQuery(world),
    CreateExpenseFromDashboard: () => mutationResult(1),
    InviteExpenseFromDashboard: () => mutationResult(2),
    EditExpenseFromDashboard: () => mutationResult(3),
    ExpenseFormExchangeRates:
      opts.exchangeRates ??
      (vars => ({
        currencyExchangeRate: vars.exchangeRateRequests.map(r => ({
          __typename: 'CurrencyExchangeRate',
          value: 1.1,
          source: 'OPENCOLLECTIVE',
          fromCurrency: r.fromCurrency,
          toCurrency: r.toCurrency,
          date: new Date(r.date).toISOString(),
          isApproximate: false,
        })),
      })),
  });
  const onSuccess = jest.fn();
  const onError = jest.fn();
  const rendered = renderExpenseFormHook(mock.client, {
    initialValues: opts.values ?? newExpenseValues(),
    startOptions: opts.startOptions ?? {},
    ...(opts.onSubmit ? { onSubmit: opts.onSubmit } : { onSuccess, onError, customData: opts.customData }),
  });
  if (opts.waitForReady !== false) {
    await waitForFormReady(rendered.result);
  }
  return { ...rendered, form: rendered.result, mock, onSuccess, onError };
}

/** Fills the fields required to submit an invoice for a single item. */
const validInvoiceItem = {
  'expenseItems.0.description': 'Design work',
  'expenseItems.0.amount.valueInCents': 15000,
  'expenseItems.0.incurredAt': '2025-03-01',
  invoiceFile: 'https://example.com/invoice.pdf',
};

const lastVariables = (mock: ReturnType<typeof createMockApolloClient>, name: string) =>
  mock.operationsNamed(name).at(-1)?.variables;

describe('useExpenseForm (characterization)', () => {
  beforeEach(() => {
    mockedLoggedInUser = mockLoggedInUser({ slug: 'jane' });
  });

  describe('options', () => {
    it('derives payout methods, currencies and flags for a collective with a Host', async () => {
      const { form } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }) });
      const { options } = form.current;
      expect(options.account.slug).toBe('collective');
      expect(options.host.slug).toBe('host-one');
      expect(options.payee.slug).toBe('jane');
      expect(options.isAdminOfPayee).toBe(true);
      expect(options.isHostAdmin).toBe(false);
      expect(options.payoutMethods.map(pm => pm.id)).toEqual(['pm-bank-usd', 'pm-bank-eur']);
      const expectedTypes = [PayoutMethodType.BANK_ACCOUNT, PayoutMethodType.OTHER, PayoutMethodType.PAYPAL];
      expect(options.supportedPayoutMethods).toEqual(expectedTypes);
      expect(options.newPayoutMethodTypes).toEqual(expectedTypes);
      expect(options.expenseCurrency).toBe('USD');
      expect(options.availableReferenceCurrencies).toEqual(['USD']);
      expect(options.allowInvite).toBe(true);
      expect(options.canChangeAccount).toBe(true);
      expect(options.allowExpenseItemAttachment).toBe(false);
      expect(options.isLongFormItemDescription).toBe(false);
      expect(options.hasExpenseItemDate).toBe(true);
      expect(options.canSetupRecurrence).toBe(true);
      expect(options.allowDifferentItemCurrency).toBe(true);
      expect(options.taxType).toBeUndefined();
      expect(options.hasInvalidAccount).toBeUndefined();
    });

    it('offers the account balance when the payee is under the same Host (self-hosted)', async () => {
      const world = defaultWorld();
      const sibling = collective({ slug: 'sibling', name: 'Sibling' });
      world.accounts.sibling = sibling;
      world.loggedInAccount = loggedInAccount({ slug: 'jane', payoutMethods: [BANK_USD] }, [sibling]);
      const { form, mock } = await setup({ world, values: newExpenseValues({ payeeSlug: 'sibling' }) });

      expect(form.current.options.supportedPayoutMethods).toEqual([PayoutMethodType.ACCOUNT_BALANCE]);
      expect(form.current.options.payoutMethods.map(pm => pm.id)).toEqual([NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID]);

      await setValues(form, { payoutMethodId: NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID, ...validInvoiceItem });
      await submit(form);
      expect(lastVariables(mock, 'CreateExpenseFromDashboard').expenseCreateInput.payoutMethod).toEqual({
        type: PayoutMethodType.ACCOUNT_BALANCE,
        data: {},
      });
    });

    it('offers the recipient Host payout methods when completing a cross-host draft as its admin', async () => {
      const recipientHost = host({
        id: 'host-2',
        slug: 'host-two',
        name: 'Host Two',
        payoutMethods: [payoutMethod({ id: 'pm-host-two', data: { currency: 'EUR' } })],
      });
      const world = defaultWorld();
      world.accounts.other = collective({ slug: 'other', host: recipientHost });
      world.loggedInAccount = loggedInAccount({ slug: 'jane' }, [{ ...recipientHost, __typename: 'Organization' }]);
      const { form } = await setup({ world, values: newExpenseValues({ payeeSlug: 'other' }) });

      expect(form.current.options.isAdminOfPayeeHost).toBe(true);
      expect(form.current.options.payoutMethods.map(pm => pm.id)).toEqual(['pm-host-two']);
    });

    it('flags an account that only supports Grants as invalid for expenses', async () => {
      const world = defaultWorld();
      world.accounts.collective = collective({ supportedExpenseTypes: ['GRANT'] });
      const { form } = await setup({ world });
      expect(form.current.options.supportedExpenseTypes).toEqual(['GRANT']);
      expect(form.current.options.hasInvalidAccount).toBe(true);
    });

    it('uses VAT when the account has VAT settings and the expense is an invoice', async () => {
      const world = defaultWorld();
      world.accounts.collective = collective({ settings: { VAT: { type: 'OWN', number: 'FRXX999999999' } } });
      const { form } = await setup({ world });
      expect(form.current.options.taxType).toBe('VAT');
    });
  });

  describe('submitting a new expense', () => {
    it('creates an expense with the mapped input', async () => {
      const { form, mock, onSuccess } = await setup({
        values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }),
        customData: { source: 'test' },
      });
      await setValues(form, {
        ...validInvoiceItem,
        invoiceNumber: 'INV-1',
        tags: ['design'],
        privateMessage: 'Thanks',
        invoiceInfo: 'Some info',
        additionalAttachments: ['https://example.com/extra.pdf'],
      });
      await submit(form);

      expect(form.current.errors).toEqual({});
      expect(lastVariables(mock, 'CreateExpenseFromDashboard')).toEqual({
        account: { slug: 'collective' },
        expenseCreateInput: {
          description: 'Design work',
          reference: 'INV-1',
          payee: { slug: 'jane' },
          payeeLocation: undefined,
          payoutMethod: { id: 'pm-bank-usd' },
          type: ExpenseType.INVOICE,
          accountingCategory: null,
          attachedFiles: [{ url: 'https://example.com/extra.pdf' }],
          currency: 'USD',
          customData: { source: 'test' },
          invoiceInfo: 'Some info',
          invoiceFile: { url: 'https://example.com/invoice.pdf' },
          items: [
            {
              id: undefined,
              description: 'Design work',
              amountV2: { valueInCents: 15000, currency: 'USD', exchangeRate: null },
              incurredAt: new Date('2025-03-01'),
              url: null,
            },
          ],
          longDescription: null,
          privateMessage: 'Thanks',
          tags: ['design'],
          tax: [],
        },
      });
      expect(onSuccess).toHaveBeenCalledWith(expect.anything(), 'new');
    });

    it('sends a new payout method as unsaved', async () => {
      const { form, mock } = await setup({ values: newExpenseValues({ payoutMethodId: NEW_PAYOUT_METHOD_ID }) });
      await setValues(form, {
        ...validInvoiceItem,
        newPayoutMethod: {
          type: PayoutMethodType.OTHER,
          name: 'Other',
          data: { currency: 'USD', content: 'Pay me in cash' },
        },
      });
      await submit(form);
      expect(lastVariables(mock, 'CreateExpenseFromDashboard').expenseCreateInput.payoutMethod).toEqual({
        type: PayoutMethodType.OTHER,
        name: 'Other',
        data: { currency: 'USD', content: 'Pay me in cash' },
        isSaved: false,
      });
    });

    it('sends receipt item URLs and drops the invoice reference for receipts', async () => {
      const { form, mock } = await setup({
        values: newExpenseValues({ payoutMethodId: 'pm-bank-usd', expenseTypeOption: ExpenseType.RECEIPT }),
      });
      await setValues(form, {
        'expenseItems.0.description': 'Train ticket',
        'expenseItems.0.amount.valueInCents': 4200,
        'expenseItems.0.incurredAt': '2025-03-02',
        'expenseItems.0.attachment': { url: 'https://example.com/receipt.jpg', name: 'receipt.jpg' },
        invoiceNumber: 'ignored',
      });
      await submit(form);

      const input = lastVariables(mock, 'CreateExpenseFromDashboard').expenseCreateInput;
      expect(input.type).toBe(ExpenseType.RECEIPT);
      expect(input.reference).toBeNull();
      expect(input.invoiceFile).toBeUndefined();
      expect(input.items[0].url).toBe('https://example.com/receipt.jpg');
    });

    it('sends no invoice file when the submitter generates the invoice', async () => {
      const { form, mock } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }) });
      await setValues(form, { ...validInvoiceItem, hasInvoiceOption: YesNoOption.NO, invoiceNumber: 'INV-2' });
      await submit(form);
      const input = lastVariables(mock, 'CreateExpenseFromDashboard').expenseCreateInput;
      expect(input.invoiceFile).toBeNull();
      expect(input.reference).toBeNull();
    });

    it('submits a recurring expense with an interval and an end date, or an open end', async () => {
      const { form, mock } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }) });
      await setValues(form, {
        ...validInvoiceItem,
        recurrenceFrequency: RecurrenceFrequencyOption.MONTH,
        recurrenceEndAt: '2125-01-31',
      });
      await submit(form);
      expect(lastVariables(mock, 'CreateExpenseFromDashboard').recurring).toEqual({
        interval: 'month',
        endsAt: new Date('2125-01-31'),
      });

      await setValues(form, { recurrenceEndAt: '' });
      await submit(form);
      expect(lastVariables(mock, 'CreateExpenseFromDashboard').recurring).toEqual({ interval: 'month', endsAt: null });
    });

    it('rejects a recurrence end date in the past', async () => {
      const { form, mock } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }) });
      await setValues(form, {
        ...validInvoiceItem,
        recurrenceFrequency: RecurrenceFrequencyOption.MONTH,
        recurrenceEndAt: '2020-01-01',
      });
      await submit(form);
      expect(form.current.errors.recurrenceEndAt).toBe('End date must be in the future');
      expect(mock.operationsNamed('CreateExpenseFromDashboard')).toHaveLength(0);
    });

    it('invites a new individual as a draft with the invitation note', async () => {
      const { form, mock, onSuccess } = await setup({ values: newExpenseValues({ payeeSlug: PAYEE_SLUG_INVITE }) });
      await setValues(form, {
        inviteeNewIndividual: { name: 'Newbie', email: 'newbie@example.com' },
        inviteNote: 'Please fill in your details',
        'expenseItems.0.description': 'Consulting',
        'expenseItems.0.amount.valueInCents': 5000,
      });
      await submit(form);

      expect(form.current.errors).toEqual({});
      const vars = lastVariables(mock, 'InviteExpenseFromDashboard');
      expect(vars.account).toEqual({ slug: 'collective' });
      expect(vars.expenseInviteInput.payee).toEqual({ name: 'Newbie', email: 'newbie@example.com', isInvite: true });
      expect(vars.expenseInviteInput.recipientNote).toBe('Please fill in your details');
      expect(vars.expenseInviteInput.payoutMethod).toEqual({ data: {}, isSaved: false });
      expect(vars.expenseInviteInput.description).toBe('Consulting');
      expect(onSuccess).toHaveBeenCalledWith(expect.anything(), 'invite');
    });

    it('invites a new organization', async () => {
      const { form, mock } = await setup({
        values: newExpenseValues({ payeeSlug: PAYEE_SLUG_INVITE, inviteeAccountType: InviteeAccountType.ORGANIZATION }),
      });
      const invitee = {
        name: 'Org admin',
        email: 'admin@org.example',
        organization: { name: 'New Org', slug: 'new-org', description: 'An org', website: 'https://org.example' },
      };
      await setValues(form, {
        inviteeNewOrganization: invitee,
        'expenseItems.0.description': 'Consulting',
        'expenseItems.0.amount.valueInCents': 5000,
      });
      await submit(form);
      expect(lastVariables(mock, 'InviteExpenseFromDashboard').expenseInviteInput.payee).toEqual({
        ...invitee,
        isInvite: true,
      });
    });

    it('requires the invitee details', async () => {
      const { form, mock } = await setup({ values: newExpenseValues({ payeeSlug: PAYEE_SLUG_INVITE }) });
      await setValues(form, { 'expenseItems.0.description': 'x', 'expenseItems.0.amount.valueInCents': 5000 });
      await submit(form);
      expect(form.current.errors.inviteeNewIndividual).toEqual({ name: 'Required', email: 'Required' });
      expect(mock.operationsNamed('InviteExpenseFromDashboard')).toHaveLength(0);
    });

    it('invites an existing user by slug', async () => {
      const { form, mock } = await setup({
        values: newExpenseValues({ payeeSlug: PAYEE_SLUG_INVITE_EXISTING_USER, inviteeExistingAccount: 'bob' }),
      });
      expect(form.current.options.payee.slug).toBe('bob');
      await setValues(form, { 'expenseItems.0.description': 'x', 'expenseItems.0.amount.valueInCents': 5000 });
      await submit(form);
      expect(lastVariables(mock, 'InviteExpenseFromDashboard').expenseInviteInput.payee).toEqual({
        slug: 'bob',
        isInvite: true,
      });
    });

    it('creates an expense for a Vendor payee', async () => {
      const world = defaultWorld();
      world.accounts.vendor = vendor({ payoutMethods: [payoutMethod({ id: 'pm-vendor' })] });
      const { form, mock, onSuccess } = await setup({
        world,
        values: newExpenseValues({ payeeSlug: 'vendor', payoutMethodId: 'pm-vendor' }),
      });
      expect(form.current.options.payoutMethods.map(pm => pm.id)).toEqual(['pm-vendor']);
      await setValues(form, validInvoiceItem);
      await submit(form);
      expect(lastVariables(mock, 'CreateExpenseFromDashboard').expenseCreateInput.payee).toEqual({ slug: 'vendor' });
      expect(onSuccess).toHaveBeenCalledWith(expect.anything(), 'new');
    });

    it('generates the Grant title and keeps Grant items in the account currency', async () => {
      const world = defaultWorld();
      world.accounts.collective = collective({ currency: 'EUR', supportedExpenseTypes: ['GRANT'] });
      const { form, mock } = await setup({
        world,
        values: newExpenseValues({ expenseTypeOption: ExpenseType.GRANT, hasInvoiceOption: YesNoOption.NO }),
      });
      expect(form.current.options.allowDifferentItemCurrency).toBe(false);
      expect(form.current.options.availableReferenceCurrencies).toEqual(['EUR']);
      expect(form.current.values.expenseItems[0].amount.currency).toBe('EUR');

      await setValues(form, {
        payoutMethodId: 'pm-bank-usd',
        'expenseItems.0.description': 'Research',
        'expenseItems.0.amount.valueInCents': 100000,
      });
      expect(form.current.values.title).toBe('');
      await submit(form);

      const input = lastVariables(mock, 'CreateExpenseFromDashboard').expenseCreateInput;
      expect(input.description).toBe('collective - Jane Doe');
      expect(input.currency).toBe('EUR');
      expect(input.items[0].amountV2.currency).toBe('EUR');
      expect(input.items[0].incurredAt).toBeInstanceOf(Date);
    });

    it('lets a host admin pick a Grant currency', async () => {
      mockedLoggedInUser = mockLoggedInUser({ slug: 'jane', adminOf: ['host-one'] });
      const world = defaultWorld();
      world.accounts.collective = collective({ currency: 'EUR', supportedExpenseTypes: ['GRANT'] });
      const { form } = await setup({ world, values: newExpenseValues({ expenseTypeOption: ExpenseType.GRANT }) });
      expect(form.current.options.isHostAdmin).toBe(true);
      expect(form.current.options.allowDifferentItemCurrency).toBe(true);
    });

    it('delegates the submission plan to the caller submit callback', async () => {
      const onSubmit = jest.fn();
      const { form } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }), onSubmit });
      await setValues(form, validInvoiceItem);
      await submit(form);
      expect(onSubmit).toHaveBeenCalledTimes(1);
      const [plan] = onSubmit.mock.calls[0];
      expect(plan.kind).toBe('create');
      expect(plan.variables.expenseCreateInput.payoutMethod).toEqual({ id: 'pm-bank-usd' });
      expect(plan.variables.expenseCreateInput.payee).toEqual({ slug: 'jane' });
    });

    it('reports mutation errors to onError', async () => {
      const world = defaultWorld();
      const mock = createMockApolloClient({
        ExpenseFormSchema: answerFormQuery(world),
        CreateExpenseFromDashboard: () => {
          throw new Error('Boom');
        },
      });
      const onError = jest.fn();
      const { result } = renderExpenseFormHook(mock.client, {
        initialValues: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }),
        startOptions: {},
        onSuccess: jest.fn(),
        onError,
      });
      await waitForFormReady(result);
      await setValues(result, validInvoiceItem);
      await submit(result);
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('validation', () => {
    it('requires the paying Account and the Payee to be different', async () => {
      const world = defaultWorld();
      world.loggedInAccount = loggedInAccount({ slug: 'jane' }, [collective()]);
      const { form } = await setup({ world, values: newExpenseValues({ payeeSlug: 'collective' }) });
      const message = 'The account paying and the account getting paid must be different.';
      expect(form.current.errors.accountSlug).toBe(message);
      expect(form.current.errors.payeeSlug).toBe(message);
    });

    it('reports the missing fields of an empty invoice', async () => {
      const { form } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }) });
      await submit(form);
      expect(form.current.errors).toEqual({
        title: 'Required',
        invoiceFile: 'Required',
        expenseItems: [
          {
            description: 'Required',
            incurredAt: 'Required',
            amount: { valueInCents: 'Value must be greater than or equal to 1' },
          },
        ],
      });
    });

    it('requires receipts on reimbursement items', async () => {
      const { form } = await setup({
        values: newExpenseValues({ payoutMethodId: 'pm-bank-usd', expenseTypeOption: ExpenseType.RECEIPT }),
      });
      await setValues(form, {
        'expenseItems.0.description': 'Train',
        'expenseItems.0.amount.valueInCents': 100,
        'expenseItems.0.incurredAt': '2025-03-01',
      });
      expect(form.current.errors.expenseItems?.[0]).toEqual({ attachment: 'Required' });
    });

    it('requires a new payout method type and currency', async () => {
      const { form } = await setup({ values: newExpenseValues({ payoutMethodId: NEW_PAYOUT_METHOD_ID }) });
      await setValues(form, validInvoiceItem);
      expect(form.current.errors.newPayoutMethod).toEqual(
        expect.objectContaining({ type: 'Required', data: expect.objectContaining({ currency: 'Required' }) }),
      );
    });

    it('validates additional attachment URLs', async () => {
      const { form } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }) });
      await setValues(form, { ...validInvoiceItem, additionalAttachments: ['not a url'] });
      expect(form.current.errors).toEqual({ additionalAttachments: [INVALID_URL] });
    });

    it('keeps the same schema while the options do not change', async () => {
      const { form } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }) });
      const schema = form.current.options.schema;
      await setValues(form, { title: 'A title', privateMessage: 'Hello' });
      expect(form.current.options.schema).toBe(schema);
      await setValues(form, { payoutMethodId: 'pm-bank-eur' }); // Changes the expense currency
      expect(form.current.options.schema).not.toBe(schema);
    });

    it('shows errors for the values that were just entered', async () => {
      const { form } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }) });
      await setValues(form, validInvoiceItem);
      expect(form.current.errors).toEqual({});
      await setValues(form, { 'expenseItems.0.description': '', title: '' });
      expect(form.current.errors.expenseItems?.[0]).toEqual(expect.objectContaining({ description: 'Required' }));
      expect(form.current.errors.title).toBe('Required');
    });
  });

  describe('dependent fields', () => {
    it('defaults the title to the single item description until the title is edited', async () => {
      const { form } = await setup({ values: newExpenseValues() });
      await setValues(form, { 'expenseItems.0.description': 'Laptop' });
      expect(form.current.values.title).toBe('Laptop');

      await act(async () => {
        await form.current.setFieldTouched('title', true);
      });
      await setValues(form, { title: 'My title', 'expenseItems.0.description': 'Laptop stand' });
      expect(form.current.values.title).toBe('My title');
    });

    it('does not default the title from the item for Grants', async () => {
      const world = defaultWorld();
      world.accounts.collective = collective({ supportedExpenseTypes: ['GRANT'] });
      const { form } = await setup({ world, values: newExpenseValues({ expenseTypeOption: ExpenseType.GRANT }) });
      await setValues(form, { 'expenseItems.0.description': 'Research' });
      expect(form.current.values.title).toBe('');
    });

    it('moves a single receipt to the invoice file when switching to an invoice', async () => {
      const { form } = await setup({
        values: newExpenseValues({ expenseTypeOption: ExpenseType.RECEIPT, hasInvoiceOption: YesNoOption.NO }),
      });
      await setValues(form, { 'expenseItems.0.attachment': 'https://example.com/r.pdf' });
      await setValues(form, { expenseTypeOption: ExpenseType.INVOICE });
      expect(form.current.values.invoiceFile).toBe('https://example.com/r.pdf');
      expect(form.current.values.expenseItems[0].attachment).toBeNull();
      expect(form.current.values.hasInvoiceOption).toBe(YesNoOption.YES);
    });

    it('moves several receipts to additional attachments when switching to an invoice', async () => {
      const { form } = await setup({ values: newExpenseValues({ expenseTypeOption: ExpenseType.RECEIPT }) });
      await setValues(form, {
        expenseItems: [
          { key: 'a', description: 'a', amount: { valueInCents: 1, currency: 'USD' }, attachment: 'https://e.x/a' },
          { key: 'b', description: 'b', amount: { valueInCents: 1, currency: 'USD' }, attachment: 'https://e.x/b' },
        ],
        additionalAttachments: ['https://e.x/existing'],
      });
      await setValues(form, { expenseTypeOption: ExpenseType.INVOICE });
      expect(form.current.values.additionalAttachments).toEqual([
        'https://e.x/existing',
        'https://e.x/a',
        'https://e.x/b',
      ]);
      expect(form.current.values.expenseItems.map(i => i.attachment)).toEqual([null, null]);
    });

    it('moves the invoice file to every item receipt when switching to a reimbursement', async () => {
      const { form } = await setup({ values: newExpenseValues() });
      await setValues(form, {
        expenseItems: [
          { key: 'a', description: 'a', amount: { valueInCents: 1, currency: 'USD' } },
          { key: 'b', description: 'b', amount: { valueInCents: 1, currency: 'USD' } },
        ],
        invoiceFile: 'https://e.x/invoice',
      });
      await setValues(form, { expenseTypeOption: ExpenseType.RECEIPT });
      expect(form.current.values.invoiceFile).toBeNull();
      expect(form.current.values.expenseItems.map(i => i.attachment)).toEqual([
        'https://e.x/invoice',
        'https://e.x/invoice',
      ]);
    });

    it('drops tax fields when the account does not support tax', async () => {
      const { form } = await setup({ values: newExpenseValues({ hasTax: true, tax: { rate: 0.2, idNumber: 'X' } }) });
      expect(form.current.values.hasTax).toBe(false);
      expect(form.current.values.tax).toBeNull();
    });

    it('pre-fills the Vendor tax ID when enabling tax', async () => {
      const world = defaultWorld();
      const taxVendor = vendor({
        payoutMethods: [payoutMethod({ id: 'pm-vendor' })],
        vendorInfo: { __typename: 'VendorInfo', taxId: 'FRXX999999999', taxType: 'VAT' },
      });
      world.accounts.vendor = taxVendor;
      world.accounts.collective = collective({
        settings: { VAT: { type: 'OWN' } },
        host: host({ vendorsForAccount: { __typename: 'VendorCollection', nodes: [taxVendor] } }),
      });
      const { form } = await setup({ world, values: newExpenseValues({ payeeSlug: 'vendor' }) });
      expect(form.current.options.taxType).toBe('VAT');

      await setValues(form, { hasTax: true });
      expect(form.current.values.tax).toEqual({ idNumber: 'FRXX999999999', rate: 0 });

      await setValues(form, { hasTax: false });
      expect(form.current.values.tax).toBeNull();
    });

    it('clears an Expense type that the newly selected account does not support', async () => {
      const world = defaultWorld();
      world.accounts['receipts-only'] = collective({ slug: 'receipts-only', supportedExpenseTypes: ['RECEIPT'] });
      const { form } = await setup({ world });
      await setValues(form, { accountSlug: 'receipts-only' });
      expect(form.current.values.expenseTypeOption).toBeNull();
    });

    it('clears the accounting category when the Host has none', async () => {
      const { form } = await setup({ values: newExpenseValues({ accountingCategoryId: 'cat-1' }) });
      expect(form.current.values.accountingCategoryId).toBeNull();
    });

    it('keeps an initial accounting category when the Host has categories', async () => {
      const world = defaultWorld();
      world.accounts.collective = collective({
        host: host({
          accountingCategories: {
            __typename: 'AccountingCategoryCollection',
            nodes: [{ __typename: 'AccountingCategory', id: 'cat-1', code: '1', name: 'Cat', kind: 'EXPENSE' }],
          },
        }),
      });
      const { form } = await setup({ world, values: newExpenseValues({ accountingCategoryId: 'cat-1' }) });
      expect(form.current.values.accountingCategoryId).toBe('cat-1');
    });

    it('clears the reference currency when it is no longer available', async () => {
      const { form } = await setup({ values: newExpenseValues() });
      await setValues(form, { referenceCurrency: 'GBP' });
      expect(form.current.values.referenceCurrency).toBeNull();
    });

    it('follows the payout method currency for items until the submitter picks a currency', async () => {
      const { form } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-eur' }) });
      expect(form.current.values.expenseItems[0].amount.currency).toBe('EUR');

      await setValues(form, { payoutMethodId: 'pm-bank-usd' });
      expect(form.current.values.expenseItems[0].amount.currency).toBe('USD');

      await act(async () => {
        form.current.setItemCurrency(0, 'GBP');
      });
      await settle();
      await setValues(form, { payoutMethodId: 'pm-bank-eur' });
      expect(form.current.values.expenseItems[0].amount.currency).toBe('GBP');
    });

    it('keeps changes made while exchange rates are loading', async () => {
      let releaseRates: () => void;
      const ratesLoaded = new Promise<void>(resolve => (releaseRates = resolve));
      const { form } = await setup({
        values: newExpenseValues({ payoutMethodId: 'pm-bank-usd', expenseTypeOption: ExpenseType.RECEIPT }),
        exchangeRates: async vars => {
          await ratesLoaded;
          return {
            currencyExchangeRate: vars.exchangeRateRequests.map(r => ({
              __typename: 'CurrencyExchangeRate',
              value: 1.1,
              source: 'OPENCOLLECTIVE',
              fromCurrency: r.fromCurrency,
              toCurrency: r.toCurrency,
              date: new Date(r.date).toISOString(),
              isApproximate: false,
            })),
          };
        },
      });
      await setValues(form, {
        referenceCurrency: 'USD',
        expenseItems: [
          { key: 'a', description: 'a', incurredAt: '2025-03-01', amount: { valueInCents: 100, currency: 'USD' } },
          { key: 'b', description: 'b', incurredAt: '2025-03-01', amount: { valueInCents: 100, currency: 'EUR' } },
        ],
      });

      // A receipt finishes uploading right before the rates load, before React re-renders
      await act(async () => {
        form.current.setFieldValue('expenseItems.1.attachment', 'https://e.x/receipt.jpg');
        releaseRates();
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      await settle();

      expect(form.current.values.expenseItems[1].attachment).toBe('https://e.x/receipt.jpg');
      expect(form.current.values.expenseItems[1].amount.exchangeRate).toEqual(expect.objectContaining({ value: 1.1 }));
    });

    it('fetches and applies exchange rates for items in another currency', async () => {
      const { form, mock } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }) });
      await setValues(form, {
        expenseItems: [
          { key: 'a', description: 'a', incurredAt: '2025-03-01', amount: { valueInCents: 100, currency: 'USD' } },
          { key: 'b', description: 'b', incurredAt: '2025-03-01', amount: { valueInCents: 100, currency: 'EUR' } },
        ],
      });
      expect(form.current.options.availableReferenceCurrencies).toEqual(['USD', 'EUR']);
      expect(form.current.errors.referenceCurrency).toBe('Required');

      await setValues(form, { referenceCurrency: 'USD' });
      expect(form.current.options.expenseCurrency).toBe('USD');
      expect(lastVariables(mock, 'ExpenseFormExchangeRates').exchangeRateRequests).toEqual([
        { fromCurrency: 'EUR', toCurrency: 'USD', date: new Date('2025-03-01') },
      ]);
      expect(form.current.values.expenseItems[1].amount.exchangeRate).toEqual(
        expect.objectContaining({ value: 1.1, source: 'OPENCOLLECTIVE', fromCurrency: 'EUR', toCurrency: 'USD' }),
      );
      expect(form.current.values.expenseItems[0].amount.exchangeRate).toBeNull();
      expect(form.current.errors.expenseItems).toBeUndefined();
    });

    it('requires an exchange rate for items in another currency', async () => {
      const { form } = await setup({
        values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }),
        exchangeRates: () => ({ currencyExchangeRate: [] }),
      });
      await setValues(form, {
        referenceCurrency: 'USD',
        expenseItems: [
          { key: 'a', description: 'a', incurredAt: '2025-03-01', amount: { valueInCents: 100, currency: 'USD' } },
          { key: 'b', description: 'b', incurredAt: '2025-03-01', amount: { valueInCents: 100, currency: 'EUR' } },
        ],
      });
      // No rate is found, so the rate stays undefined and fails the type check before the "Missing exchange rate" rule
      expect(form.current.errors.expenseItems?.[1]).toEqual({ amount: { exchangeRate: 'This field is required' } });
    });

    it('resets the payout-method name-discrepancy reason when the payout method changes', async () => {
      const { form } = await setup({ values: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }) });
      await setValues(form, { payoutMethodNameDiscrepancyReason: 'Joint account' });
      expect(form.current.values.payoutMethodNameDiscrepancyReason).toBe('Joint account');
      await setValues(form, { payoutMethodId: 'pm-bank-eur' });
      expect(form.current.values.payoutMethodNameDiscrepancyReason).toBe('');
    });

    it('replaces a payout method that is not available for the payee, once payout methods have loaded', async () => {
      let release: () => void;
      const gate = new Promise<void>(resolve => (release = resolve));
      const world = defaultWorld();
      const answer = answerFormQuery(world);
      const mock = createMockApolloClient({ ExpenseFormSchema: async vars => (await gate, answer(vars)) });
      const { result } = renderExpenseFormHook(mock.client, {
        initialValues: newExpenseValues({ payoutMethodId: 'pm-unknown' }),
        startOptions: {},
        onSuccess: jest.fn(),
        onError: jest.fn(),
      });
      await settle();
      expect(result.current.values.payoutMethodId).toBe('pm-unknown');

      release();
      await waitForFormReady(result);
      expect(result.current.values.payoutMethodId).toBe('pm-bank-usd'); // The first available one
    });

    it('replaces a Vendor payee when switching to an account under a Host without that Vendor', async () => {
      const world = defaultWorld();
      const hostVendor = vendor();
      world.accounts.vendor = hostVendor;
      world.accounts.collective = collective({
        host: host({ vendorsForAccount: { __typename: 'VendorCollection', nodes: [hostVendor] } }),
      });
      world.accounts.elsewhere = collective({ slug: 'elsewhere', host: host({ id: 'host-2', slug: 'host-two' }) });
      const { form } = await setup({ world, values: newExpenseValues({ payeeSlug: 'vendor' }) });
      expect(form.current.values.payeeSlug).toBe('vendor');

      await setValues(form, { accountSlug: 'elsewhere' });
      expect(form.current.values.payeeSlug).toBe('jane'); // The submitter's own profile
    });
  });

  describe('defaults', () => {
    const recentWorld = () => {
      const world = defaultWorld();
      const org = { ...collective({ slug: 'org', name: 'Org' }), __typename: 'Organization', type: 'ORGANIZATION' };
      world.accounts.org = org;
      world.accounts['last-collective'] = collective({ slug: 'last-collective' });
      world.loggedInAccount = loggedInAccount({ slug: 'jane', payoutMethods: [BANK_USD, BANK_EUR] }, [org]);
      world.recentlySubmittedExpenses = [
        {
          account: world.accounts['last-collective'],
          payee: { ...world.loggedInAccount, slug: 'jane', id: world.loggedInAccount.id },
          payoutMethod: { id: 'pm-bank-eur' },
        },
      ];
      return world;
    };

    it('selects the last submitted account, the last used profile and its last payout method', async () => {
      const { form } = await setup({
        world: recentWorld(),
        values: newExpenseValues({ accountSlug: undefined, payeeSlug: undefined }),
      });
      expect(form.current.values.accountSlug).toBe('last-collective');
      expect(form.current.values.payeeSlug).toBe('jane');
      expect(form.current.values.payoutMethodId).toBe('pm-bank-eur');
    });

    it('keeps the account picked by the submitter', async () => {
      const { form } = await setup({ world: recentWorld(), values: newExpenseValues() });
      expect(form.current.values.accountSlug).toBe('collective');
    });

    it('selects the personal profile without recent expenses', async () => {
      const { form } = await setup({ values: newExpenseValues({ payeeSlug: undefined }) });
      expect(form.current.values.payeeSlug).toBe('jane');
      expect(form.current.values.payoutMethodId).toBe('pm-bank-usd');
    });
  });

  describe('payee choices', () => {
    it.each([
      [PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER, null],
      [PAYEE_SLUG_CREATE_LEGAL_ENTITY, null],
      [PAYEE_SLUG_INVITE, null],
      [PAYEE_SLUG_INVITE_SOMEONE, null],
      [PAYEE_SLUG_VENDOR, null],
      [PAYEE_SLUG_NEW_VENDOR, null],
      ['jane', 'jane'],
    ])('queries the payee for %s as %s', async (payeeSlug, queriedSlug) => {
      const { mock } = await setup({ values: newExpenseValues({ payeeSlug }) });
      const vars = mock.operationsNamed('ExpenseFormSchema')[0].variables;
      expect(vars.payeeSlug).toBe(queriedSlug);
      expect(vars.hasPayeeSlug).toBe(Boolean(queriedSlug));
    });

    it('queries the invited existing user', async () => {
      const { mock } = await setup({
        values: newExpenseValues({ payeeSlug: PAYEE_SLUG_INVITE_EXISTING_USER, inviteeExistingAccount: 'bob' }),
      });
      expect(lastVariables(mock, 'ExpenseFormSchema')).toEqual(
        expect.objectContaining({ payeeSlug: 'bob', hasPayeeSlug: true }),
      );
    });

    it('does not query a sentinel paying account slug', async () => {
      const { mock } = await setup({ values: newExpenseValues({ accountSlug: '__somewhere' }) });
      expect(lastVariables(mock, 'ExpenseFormSchema')).toEqual(
        expect.objectContaining({ collectiveSlug: null, hasCollectiveSlug: false }),
      );
    });

    it('marks administered-account pickers as administered payees', async () => {
      const { form } = await setup({ values: newExpenseValues({ payeeSlug: PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER }) });
      expect(form.current.options.isAdminOfPayee).toBe(true);
      expect(form.current.errors.payeeSlug).toBe('Required');
    });

    it('exposes the invitee being typed', async () => {
      const { form } = await setup({ values: newExpenseValues({ payeeSlug: PAYEE_SLUG_INVITE }) });
      await setValues(form, { inviteeNewIndividual: { name: 'N', email: 'n@example.com' } });
      expect(form.current.options.invitee).toEqual({ name: 'N', email: 'n@example.com' });
    });
  });

  describe('editing an existing expense', () => {
    it('hydrates the values from the expense and submits an edit', async () => {
      const world = defaultWorld({
        expense: existingExpense({
          description: 'Existing expense',
          tags: ['tag'],
          privateMessage: 'Private',
          reference: 'REF-1',
          invoiceFile: {
            __typename: 'FileInfo',
            id: 'f',
            url: 'https://e.x/invoice.pdf',
            name: 'i',
            type: 'pdf',
            size: 1,
          },
          attachedFiles: [{ id: 'af', url: 'https://e.x/attached.pdf', info: null }],
          taxes: [],
        }),
      });
      const { form, mock, onSuccess } = await setup({
        world,
        values: newExpenseValues({ accountSlug: undefined, payeeSlug: undefined }),
        startOptions: { expenseId: 555 },
      });

      expect(form.current.values).toEqual(
        expect.objectContaining({
          accountSlug: 'collective',
          payeeSlug: 'jane',
          payoutMethodId: 'pm-bank-usd',
          title: 'Existing expense',
          tags: ['tag'],
          privateMessage: 'Private',
          hasTax: false,
          invoiceFile: 'https://e.x/invoice.pdf',
          hasInvoiceOption: YesNoOption.YES,
          invoiceNumber: 'REF-1',
          additionalAttachments: ['https://e.x/attached.pdf'],
          expenseItems: [
            {
              id: 'item-1',
              key: 'item-1',
              attachment: null,
              description: 'Item one',
              incurredAt: '2025-03-01',
              amount: { valueInCents: 10000, currency: 'USD', exchangeRate: null },
            },
          ],
        }),
      );
      expect(form.current.options.canChangeAccount).toBe(true);

      await submit(form);
      expect(form.current.errors).toEqual({});
      expect(lastVariables(mock, 'EditExpenseFromDashboard')).toEqual({
        draftKey: undefined,
        expenseEditInput: expect.objectContaining({
          id: 'expense-1',
          description: 'Existing expense',
          payee: { slug: 'jane' },
          payoutMethod: { id: 'pm-bank-usd' },
          reference: 'REF-1',
          invoiceFile: { url: 'https://e.x/invoice.pdf' },
          attachedFiles: [{ url: 'https://e.x/attached.pdf' }],
          currency: 'USD',
          items: [
            {
              id: 'item-1',
              description: 'Item one',
              amountV2: { valueInCents: 10000, currency: 'USD', exchangeRate: null },
              incurredAt: new Date('2025-03-01'),
              url: null,
            },
          ],
        }),
      });
      expect(onSuccess).toHaveBeenCalledWith(expect.anything(), 'edit');
    });

    it('hydrates taxes from the expense', async () => {
      const world = defaultWorld({
        expense: existingExpense({ taxes: [{ id: 't', type: 'VAT', rate: 0.2, idNumber: 'FRXX999999999' }] }),
      });
      world.accounts.collective = collective({ settings: { VAT: { type: 'OWN' } } });
      world.expense.account = world.accounts.collective;
      const { form, mock } = await setup({
        world,
        values: newExpenseValues({ accountSlug: undefined, payeeSlug: undefined }),
        startOptions: { expenseId: 555 },
      });
      expect(form.current.options.taxType).toBe('VAT');
      expect(form.current.values.hasTax).toBe(true);
      expect(form.current.values.tax).toEqual({ idNumber: 'FRXX999999999', rate: 0.2 });

      // Removing the tax sends an empty list, which the API reads as "remove taxes" (`null` would keep them)
      await setValues(form, { hasTax: false });
      await submit(form);
      expect(lastVariables(mock, 'EditExpenseFromDashboard').expenseEditInput.tax).toEqual([]);
    });

    it('keeps locked fields and the expense currency', async () => {
      const world = defaultWorld({
        expense: existingExpense({
          currency: 'EUR',
          lockedFields: [ExpenseLockableFields.AMOUNT, ExpenseLockableFields.DESCRIPTION],
          items: [
            expenseItem({ amount: { __typename: 'Amount', currency: 'EUR', valueInCents: 500, exchangeRate: null } }),
          ],
        }),
      });
      const { form } = await setup({
        world,
        values: newExpenseValues({ accountSlug: undefined, payeeSlug: undefined }),
        startOptions: { expenseId: 555 },
      });
      expect(form.current.options.lockedFields).toEqual([
        ExpenseLockableFields.AMOUNT,
        ExpenseLockableFields.DESCRIPTION,
      ]);
      expect(form.current.options.availableReferenceCurrencies).toEqual(['EUR']);
      expect(form.current.options.expenseCurrency).toBe('EUR');
      // Choosing a payout method in another currency does not change the locked items
      await setValues(form, { payoutMethodId: 'pm-bank-usd' });
      expect(form.current.values.expenseItems[0].amount.currency).toBe('EUR');

      await setValues(form, { 'expenseItems.0.description': 'Changed' });
      expect(form.current.values.title).toBe('Existing expense');
    });

    it('creates a new expense when duplicating', async () => {
      const world = defaultWorld({
        expense: existingExpense({
          attachedFiles: [{ id: 'af', url: 'https://e.x/attached.pdf', info: null }],
          invoiceFile: {
            __typename: 'FileInfo',
            id: 'f',
            url: 'https://e.x/invoice.pdf',
            name: 'i',
            type: 'pdf',
            size: 1,
          },
        }),
      });
      const { form, mock } = await setup({
        world,
        values: newExpenseValues({ accountSlug: undefined, payeeSlug: undefined }),
        startOptions: { expenseId: 555, duplicateExpense: true },
      });
      expect(form.current.values.expenseItems[0]).toEqual(
        expect.objectContaining({ attachment: null, incurredAt: null, description: 'Item one' }),
      );
      expect(form.current.values.expenseItems[0].id).toBeUndefined();
      expect(form.current.values.additionalAttachments).toEqual([]);
      expect(form.current.values.invoiceFile).toBeUndefined();

      await setValues(form, { 'expenseItems.0.incurredAt': '2025-04-01', invoiceFile: 'https://e.x/new.pdf' });
      await submit(form);
      expect(mock.operationsNamed('EditExpenseFromDashboard')).toHaveLength(0);
      expect(lastVariables(mock, 'CreateExpenseFromDashboard').expenseCreateInput.items[0].id).toBeUndefined();
    });
  });

  describe('drafts', () => {
    const draftExpense = (overrides = {}) =>
      existingExpense({
        status: 'DRAFT',
        payee: null,
        payoutMethod: null,
        longDescription: 'Please submit',
        items: [],
        draft: {
          payee: { name: 'Invitee', email: 'invitee@example.com' },
          recipientNote: 'Please submit',
          items: [
            {
              id: 'draft-item',
              description: 'Drafted',
              url: null,
              incurredAt: '2025-03-05T00:00:00Z',
              amountV2: { valueInCents: 2500, currency: 'EUR' },
            },
          ],
        },
        ...overrides,
      });

    it('lets an invited payee confirm the draft with a new payout method', async () => {
      mockedLoggedInUser = null;
      const world = defaultWorld({ loggedInAccount: null, expense: draftExpense() });
      const { form, mock } = await setup({
        world,
        values: newExpenseValues({ accountSlug: undefined, payeeSlug: undefined }),
        startOptions: { expenseId: 555, draftKey: 'draft-key' },
      });

      expect(form.current.values.payoutMethodId).toBe(NEW_PAYOUT_METHOD_ID);
      expect(form.current.values.inviteeAccountType).toBe(InviteeAccountType.INDIVIDUAL);
      expect(form.current.values.inviteNote).toBe('Please submit');
      expect(form.current.values.expenseItems).toEqual([
        {
          id: 'draft-item',
          key: 'draft-item',
          attachment: null,
          description: 'Drafted',
          incurredAt: '2025-03-05',
          amount: expect.objectContaining({ valueInCents: 2500, currency: 'EUR', exchangeRate: null }),
        },
      ]);
      expect(form.current.options.invitee).toEqual({ name: 'Invitee', email: 'invitee@example.com' });
      expect(form.current.options.allowInvite).toBe(false);
      expect(form.current.options.canChangeAccount).toBe(false);

      await setValues(form, {
        newPayoutMethod: { type: PayoutMethodType.OTHER, data: { currency: 'EUR', content: 'Cash' } },
      });
      await submit(form);
      const vars = lastVariables(mock, 'EditExpenseFromDashboard');
      expect(vars.draftKey).toBe('draft-key');
      expect(vars.expenseEditInput.payee).toEqual({
        name: 'Invitee',
        email: 'invitee@example.com',
      });
      expect(vars.expenseEditInput.payoutMethod).toEqual({
        type: PayoutMethodType.OTHER,
        data: { currency: 'EUR', content: 'Cash' },
        isSaved: false,
      });
    });

    it('keeps the draft currency when the payee picks a payout method in another currency', async () => {
      const world = defaultWorld({
        expense: draftExpense({ draft: { ...draftExpense().draft, payee: { slug: 'jane' } } }),
      });
      const { form } = await setup({
        world,
        values: newExpenseValues({ accountSlug: undefined, payeeSlug: undefined }),
        startOptions: { expenseId: 555, draftKey: 'k' },
      });
      expect(form.current.values.payeeSlug).toBe('jane');
      await setValues(form, { payoutMethodId: 'pm-bank-usd' });
      expect(form.current.values.expenseItems[0].amount.currency).toBe('EUR');
    });
  });

  describe('inline edit (edit dialog sub-forms)', () => {
    it('does not follow the payout method currency when editing inline', async () => {
      const world = defaultWorld({ expense: existingExpense() });
      const { form } = await setup({
        world,
        values: inlineEditValues({ referenceCurrency: 'USD' as any }),
        startOptions: { expenseId: 555, isInlineEdit: true, pickSchemaFields: ['payoutMethodId'] },
        onSubmit: jest.fn(),
      });
      await setValues(form, { payoutMethodId: 'pm-bank-eur' });
      expect(form.current.values.expenseItems[0].amount.currency).toBe('USD');
      expect(form.current.options.allowInvite).toBe(false);
    });

    it('only validates the picked fields', async () => {
      const world = defaultWorld({ expense: existingExpense() });
      const onSubmit = jest.fn();
      const { form } = await setup({
        world,
        values: inlineEditValues(),
        startOptions: { expenseId: 555, isInlineEdit: true, pickSchemaFields: ['expenseItems'] },
        onSubmit,
      });
      await setValues(form, { title: '' });
      await submit(form);
      expect(form.current.errors).toEqual({});
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('form query', () => {
    it('only applies the result of the latest request', async () => {
      const world = defaultWorld();
      const answer = answerFormQuery(world);
      let releaseSlowRequest: () => void;
      const slowRequest = new Promise<void>(resolve => (releaseSlowRequest = resolve));
      const mock = createMockApolloClient({
        ExpenseFormSchema: async vars => {
          if (vars.payeeSlug === 'bob') {
            await slowRequest; // The request for "bob" resolves after the one for "jane"
          }
          return answer(vars);
        },
      });
      const { result } = renderExpenseFormHook(mock.client, {
        initialValues: newExpenseValues(),
        startOptions: {},
        onSuccess: jest.fn(),
        onError: jest.fn(),
      });
      await waitForFormReady(result);
      await setValues(result, { payeeSlug: 'bob' });
      await setValues(result, { payeeSlug: 'jane' });
      expect(result.current.options.payee.slug).toBe('jane');

      releaseSlowRequest();
      await settle();
      expect(result.current.options.payee.slug).toBe('jane');
    });

    it('does not share results between hook instances', async () => {
      const first = await setup({});
      const otherWorld = defaultWorld();
      otherWorld.accounts.collective = collective({ name: 'Another collective' });
      const second = await setup({ world: otherWorld });
      expect(first.form.current.options.account.name).toBe('collective');
      expect(second.form.current.options.account.name).toBe('Another collective');
    });
  });

  describe('stale form data', () => {
    it('keeps the accounting category of an edited expense while its account loads', async () => {
      const world = defaultWorld();
      const categories = {
        __typename: 'AccountingCategoryCollection',
        nodes: [{ __typename: 'AccountingCategory', id: 'cat-1', code: '1', name: 'Cat', kind: 'EXPENSE' }],
      };
      world.accounts.collective = collective({ host: host({ accountingCategories: categories }) });
      world.expense = existingExpense({ account: world.accounts.collective, accountingCategory: { id: 'cat-1' } });
      const { form } = await setup({
        world,
        values: newExpenseValues({ accountSlug: undefined, payeeSlug: undefined }),
        startOptions: { expenseId: 555 },
      });
      expect(form.current.values.accountingCategoryId).toBe('cat-1');
    });

    it('does not submit with the data of a previous account', async () => {
      const world = defaultWorld();
      world.accounts.other = collective({ slug: 'other', name: 'Other' });
      const answer = answerFormQuery(world);
      const mock = createMockApolloClient({
        ExpenseFormSchema: vars => {
          if (vars.collectiveSlug === 'other') {
            throw new Error('Network error');
          }
          return answer(vars);
        },
        CreateExpenseFromDashboard: () => mutationResult(1),
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderExpenseFormHook(mock.client, {
        initialValues: newExpenseValues({ payoutMethodId: 'pm-bank-usd' }),
        startOptions: {},
        onSuccess: jest.fn(),
        onError: jest.fn(),
      });
      await waitForFormReady(result);
      await setValues(result, { ...validInvoiceItem, accountSlug: 'other' });
      expect(result.current.isLoadingOptions).toBe(true);
      await submit(result);
      expect(mock.operationsNamed('CreateExpenseFromDashboard')).toHaveLength(0);
    });
  });

  describe('refresh', () => {
    it('keeps the loaded data when a refresh fails', async () => {
      const world = defaultWorld({ expense: existingExpense() });
      let fail = false;
      const answer = answerFormQuery(world);
      const mock = createMockApolloClient({
        ExpenseFormSchema: vars => {
          if (fail) {
            throw new Error('Network error');
          }
          return answer(vars);
        },
      });
      const { result } = renderExpenseFormHook(mock.client, {
        initialValues: inlineEditValues(),
        startOptions: { expenseId: 555, isInlineEdit: true, pickSchemaFields: ['expenseItems'] },
        onSubmit: jest.fn(),
      });
      await waitForFormReady(result);
      fail = true;
      jest.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        await result.current.refresh();
      });
      expect(result.current.options.expense?.id).toBe('expense-1');
    });

    it('re-runs the form query from the network', async () => {
      const { form, mock } = await setup({});
      const before = mock.operationsNamed('ExpenseFormSchema').length;
      await act(async () => {
        await form.current.refresh();
      });
      expect(mock.operationsNamed('ExpenseFormSchema').length).toBe(before + 1);
    });
  });
});
