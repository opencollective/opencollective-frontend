/**
 * Form actions of the Expense form: each one runs its mutation, resyncs the form data and selects
 * the result, through the hook's public interface.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type LoggedInUser from '../../lib/LoggedInUser';

let mockedLoggedInUser: LoggedInUser | null = null;
const mockRefetchLoggedInUser = jest.fn();
jest.mock('../../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ LoggedInUser: mockedLoggedInUser, refetchLoggedInUser: mockRefetchLoggedInUser }),
}));

import { act } from '@testing-library/react';

import { ExpenseType, PayoutMethodType } from '../../lib/graphql/types/v2/graphql';
import { NEW_PAYOUT_METHOD_ID, PAYEE_SLUG_CREATE_LEGAL_ENTITY } from '../expenses/lib/constants';

import {
  collective,
  host,
  individual,
  loggedInAccount,
  organization,
  payoutMethod,
} from './testing/expense-form-fixtures';
import {
  answerFormQuery,
  createMockApolloClient,
  mockLoggedInUser,
  renderExpenseFormHook,
  settle,
  silenceApolloMissingFieldErrors,
  waitForFormReady,
} from './testing/expense-form-test-utils';
import { InviteeAccountType, RecurrenceFrequencyOption, YesNoOption } from './useExpenseForm';

silenceApolloMissingFieldErrors();

const values = (overrides = {}) => ({
  accountSlug: 'collective',
  payeeSlug: 'jane',
  payoutMethodId: 'pm-bank-usd',
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

async function setup(world = undefined) {
  const me = loggedInAccount({ slug: 'jane', payoutMethods: [payoutMethod()] });
  const state = world ?? {
    loggedInAccount: me,
    accounts: {
      collective: collective(),
      jane: individual({ slug: 'jane', name: 'Jane Doe', payoutMethods: me.payoutMethods }),
    },
  };
  const mock = createMockApolloClient({
    ExpenseFormSchema: vars => answerFormQuery(state)(vars),
    SavePayoutMethod: vars => {
      const created = payoutMethod({ id: 'pm-created', ...vars.payoutMethod });
      state.loggedInAccount.payoutMethods = [...state.loggedInAccount.payoutMethods, created];
      state.accounts.jane.payoutMethods = state.loggedInAccount.payoutMethods;
      return { createPayoutMethod: { __typename: 'PayoutMethod', id: 'pm-created' } };
    },
    EditPayoutMethod: vars => ({
      editPayoutMethod: { __typename: 'PayoutMethod', ...vars.payoutMethod },
    }),
    DeletePayoutMethod: vars => {
      state.loggedInAccount.payoutMethods = state.loggedInAccount.payoutMethods.filter(
        pm => pm.id !== vars.payoutMethodId,
      );
      state.accounts.jane.payoutMethods = state.loggedInAccount.payoutMethods;
      return { removePayoutMethod: { __typename: 'PayoutMethod', id: vars.payoutMethodId } };
    },
    CreateOrganizationFromExpenseFlow: vars => {
      const org = organization({ slug: vars.organization.slug, name: vars.organization.name });
      state.accounts[org.slug] = org;
      state.loggedInAccount = loggedInAccount({ slug: 'jane', payoutMethods: me.payoutMethods }, [org]);
      return { createOrganization: { ...org, __typename: 'Organization' } };
    },
    UpdateAccountLegalName: vars => {
      state.accounts.jane.legalName = vars.account.legalName;
      return { editAccount: { __typename: 'Individual', id: vars.account.id, legalName: vars.account.legalName } };
    },
    UpdateAccountUSEntity: vars => {
      state.accounts.jane.isUSEntity = vars.account.isUSEntity;
      return { editAccount: { __typename: 'Individual', id: vars.account.id, isUSEntity: vars.account.isUSEntity } };
    },
  });
  const { result } = renderExpenseFormHook(mock.client, {
    initialValues: values(),
    startOptions: {},
    onSuccess: jest.fn(),
    onError: jest.fn(),
  });
  await waitForFormReady(result);
  const formQueriesBefore = mock.operationsNamed('ExpenseFormSchema').length;
  const formQueriesSince = () => mock.operationsNamed('ExpenseFormSchema').length - formQueriesBefore;
  return { form: result, mock, formQueriesSince };
}

const run = async (fn: () => Promise<unknown>) => {
  await act(async () => {
    await fn();
  });
  await settle();
};

describe('useExpenseForm actions', () => {
  beforeEach(() => {
    mockedLoggedInUser = mockLoggedInUser({ slug: 'jane' });
  });

  it('creates a payout method for the payee, then selects it', async () => {
    const { form, mock, formQueriesSince } = await setup();
    await run(() =>
      form.current.actions.savePayoutMethod({
        type: PayoutMethodType.OTHER,
        data: { currency: 'USD', content: 'Cash' },
      }),
    );

    expect(mock.operationsNamed('SavePayoutMethod')[0].variables).toEqual({
      payoutMethod: { type: PayoutMethodType.OTHER, data: { currency: 'USD', content: 'Cash' } },
      payeeSlug: 'jane',
    });
    expect(formQueriesSince()).toBe(1);
    expect(form.current.options.payoutMethods.map(pm => pm.id)).toContain('pm-created');
    expect(form.current.values.payoutMethodId).toBe('pm-created');
    expect(form.current.values.newPayoutMethod).toEqual({ data: {} });
  });

  it('creates the payout method on the recipient Host for a cross-host payee', async () => {
    const recipientHost = host({ id: 'host-2', slug: 'host-two', payoutMethods: [payoutMethod({ id: 'pm-host' })] });
    const me = loggedInAccount({ slug: 'jane' }, [{ ...recipientHost, __typename: 'Organization' }]);
    const world = {
      loggedInAccount: me,
      accounts: {
        collective: collective(),
        jane: individual({ slug: 'jane' }),
        other: collective({ slug: 'other', host: recipientHost }),
      },
    };
    const { form, mock } = await setup(world);
    await run(() => form.current.setFieldValue('payeeSlug', 'other') as Promise<unknown>);
    await run(() =>
      form.current.actions
        .savePayoutMethod({ type: PayoutMethodType.OTHER, data: { currency: 'USD' } })
        .catch(() => {}),
    );
    expect(mock.operationsNamed('SavePayoutMethod')[0].variables.payeeSlug).toBe('host-two');
  });

  it('edits a payout method, then selects it', async () => {
    const { form, mock, formQueriesSince } = await setup();
    await run(() => form.current.setFieldValue('payoutMethodId', NEW_PAYOUT_METHOD_ID) as Promise<unknown>);
    await run(() =>
      form.current.actions.savePayoutMethod({ id: 'pm-bank-usd', name: 'Renamed', data: { currency: 'USD' } } as any),
    );
    expect(mock.operationsNamed('EditPayoutMethod')[0].variables).toEqual({
      payoutMethod: { id: 'pm-bank-usd', name: 'Renamed', data: { currency: 'USD' } },
    });
    expect(formQueriesSince()).toBe(1);
    expect(form.current.values.payoutMethodId).toBe('pm-bank-usd');
  });

  it('removes a payout method and its selection', async () => {
    const { form, mock, formQueriesSince } = await setup();
    await run(() => form.current.actions.removePayoutMethod('pm-bank-usd'));
    expect(mock.operationsNamed('DeletePayoutMethod')[0].variables).toEqual({ payoutMethodId: 'pm-bank-usd' });
    expect(formQueriesSince()).toBe(1);
    expect(form.current.options.payoutMethods).toEqual([]);
    expect(form.current.values.payoutMethodId).not.toBe('pm-bank-usd');
  });

  it('creates a payee Organization, then selects it', async () => {
    const { form, mock } = await setup();
    await run(() => form.current.setFieldValue('payeeSlug', PAYEE_SLUG_CREATE_LEGAL_ENTITY) as Promise<unknown>);
    await run(() =>
      form.current.actions.createPayeeOrganization({ name: 'New Org', legalName: 'New Org Inc', slug: 'new-org' }),
    );
    expect(mock.operationsNamed('CreateOrganizationFromExpenseFlow')[0].variables.organization).toEqual({
      name: 'New Org',
      legalName: 'New Org Inc',
      slug: 'new-org',
    });
    expect(mockRefetchLoggedInUser).toHaveBeenCalled();
    expect(form.current.values.payeeSlug).toBe('new-org');
    expect(form.current.touched.payeeSlug).toBe(true);
    expect(form.current.options.payoutProfiles.map(p => p.slug)).toContain('new-org');
  });

  it('updates the legal name and picks up the change without delay', async () => {
    const { form, mock, formQueriesSince } = await setup();
    await run(() => form.current.actions.updateLegalName('jane-id', 'Jane Legal'));
    expect(mock.operationsNamed('UpdateAccountLegalName')[0].variables).toEqual({
      account: { id: 'jane-id', legalName: 'Jane Legal' },
    });
    expect(formQueriesSince()).toBe(1);
    expect(form.current.options.payee.legalName).toBe('Jane Legal');
  });

  it('updates the US-entity status and picks up the change without delay', async () => {
    const { form, mock, formQueriesSince } = await setup();
    await run(() => form.current.actions.updateUSEntityStatus('jane-id', true));
    expect(mock.operationsNamed('UpdateAccountUSEntity')[0].variables).toEqual({
      account: { id: 'jane-id', isUSEntity: true },
    });
    expect(formQueriesSince()).toBe(1);
    expect(form.current.options.payee.isUSEntity).toBe(true);
  });

  it('reports mutation errors to the caller without resyncing', async () => {
    const { form, mock, formQueriesSince } = await setup();
    mock.client.mutate = jest.fn().mockRejectedValue(new Error('Boom')) as any;
    let error;
    await run(() => form.current.actions.removePayoutMethod('pm-bank-usd').catch(e => (error = e)));
    expect(formQueriesSince()).toBe(0);
    expect(error).toBeDefined();
  });
});
