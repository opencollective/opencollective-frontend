/**
 * Characterization tests recording the exact `editExpense` payload of each edit dialog sub-form that
 * relies on the Expense form (https://github.com/opencollective/opencollective/issues/9073).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type LoggedInUser from '../../lib/LoggedInUser';

let mockedLoggedInUser: LoggedInUser | null = null;
jest.mock('../../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ LoggedInUser: mockedLoggedInUser, refetchLoggedInUser: jest.fn() }),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Expense } from '../../lib/graphql/types/v2/graphql';
import { withRequiredProviders } from '../../test/providers';

import { ModalProvider } from '../ModalContext';
import {
  collective,
  existingExpense,
  expenseItem,
  individual,
  loggedInAccount,
  organization,
  payoutMethod,
} from '../submit-expense/testing/expense-form-fixtures';
import type { ExpenseFormWorld } from '../submit-expense/testing/expense-form-test-utils';
import {
  answerFormQuery,
  createMockApolloClient,
  mockLoggedInUser,
  silenceApolloMissingFieldErrors,
} from '../submit-expense/testing/expense-form-test-utils';

import EditExpenseDialog from './EditExpenseDialog';

silenceApolloMissingFieldErrors();

beforeAll(() => {
  // Radix Select uses pointer capture, which JSDOM does not implement.
  HTMLElement.prototype.hasPointerCapture = () => false;
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList);
});

const BANK_USD = payoutMethod();
const ORG_BANK = payoutMethod({ id: 'pm-org', name: 'Org bank', data: { currency: 'USD', accountHolderName: 'Org' } });

const expenseFixture = (overrides = {}) =>
  existingExpense({
    taxes: [],
    reference: 'REF-1',
    invoiceInfo: 'Invoice info',
    invoiceFile: { __typename: 'FileInfo', id: 'f', url: 'https://e.x/invoice.pdf', name: 'i', type: 'pdf', size: 1 },
    attachedFiles: [{ id: 'af', url: 'https://e.x/attached.pdf', info: null }],
    items: [
      expenseItem({
        id: 'item-1',
        description: 'Design',
        url: 'https://e.x/item.pdf',
        amount: { __typename: 'Amount', currency: 'USD', valueInCents: 10000, exchangeRate: null },
        incurredAt: '2025-03-01T00:00:00Z',
      }),
    ],
    ...overrides,
  });

const world = (expense = expenseFixture()): ExpenseFormWorld => {
  const org = organization({ slug: 'org', name: 'Org', payoutMethods: [ORG_BANK] });
  const me = loggedInAccount({ slug: 'jane', name: 'Jane Doe', payoutMethods: [BANK_USD] }, [org]);
  return {
    loggedInAccount: me,
    accounts: {
      collective: collective(),
      jane: individual({ slug: 'jane', name: 'Jane Doe', payoutMethods: me.payoutMethods }),
      org,
    },
    expense,
  };
};

async function openDialog(field: React.ComponentProps<typeof EditExpenseDialog>['field'], w = world()) {
  const mock = createMockApolloClient({
    ExpenseFormSchema: answerFormQuery(w),
    EditExpense: vars => ({ editExpense: { __typename: 'Expense', id: vars.expense.id } }),
  });
  const user = userEvent.setup();
  const expenseProp = { ...w.expense, account: { ...w.expense.account }, payee: { ...w.expense.payee } };
  render(
    withRequiredProviders(
      <ModalProvider>
        <EditExpenseDialog
          expense={expenseProp as unknown as Expense}
          field={field}
          title="Edit"
          trigger={<button>Open editor</button>}
          showTriggerTooltip={false}
        />
      </ModalProvider>,
      { ApolloProvider: { client: mock.client } },
    ),
  );
  await user.click(screen.getByRole('button', { name: 'Open editor' }));
  return { user, mock };
}

const savedPayload = async (mock: ReturnType<typeof createMockApolloClient>) => {
  await waitFor(() => expect(mock.operationsNamed('EditExpense')).toHaveLength(1));
  return mock.operationsNamed('EditExpense')[0].variables;
};

const expectedItems = [
  {
    id: 'item-1',
    description: 'Design',
    amountV2: { valueInCents: 10000, currency: 'USD', exchangeRate: null },
    incurredAt: new Date('2025-03-01'),
    url: 'https://e.x/item.pdf',
  },
];

describe('EditExpenseDialog sub-forms (characterization)', () => {
  beforeEach(() => {
    mockedLoggedInUser = mockLoggedInUser({ slug: 'jane', adminOf: ['org'] });
  });

  // Current behaviour: when an invoice item carries a URL, loading the expense runs the "attachments follow
  // the Expense type" rule, which moves the item attachment into the invoice file (replacing the existing one).
  it('expense details: submits items, attachments, invoice and tax', async () => {
    const { user, mock } = await openDialog('expenseDetails');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await savedPayload(mock)).toEqual({
      isDraftEdit: true,
      expense: {
        id: 'expense-1',
        items: [{ ...expectedItems[0], url: null }],
        attachedFiles: [{ url: 'https://e.x/attached.pdf' }],
        invoiceInfo: 'Invoice info',
        invoiceFile: { url: 'https://e.x/item.pdf' },
        reference: 'REF-1',
        currency: 'USD',
        tax: [],
      },
    });
  });

  it('attach receipts: submits items and attachments only', async () => {
    const { user, mock } = await openDialog(
      'attachReceipts',
      world(expenseFixture({ type: 'RECEIPT', invoiceFile: null })),
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await savedPayload(mock)).toEqual({
      isDraftEdit: true,
      expense: {
        id: 'expense-1',
        items: expectedItems,
        attachedFiles: [{ url: 'https://e.x/attached.pdf' }],
      },
    });
  });

  it('type: switching an invoice to a reimbursement moves the invoice file to the item receipts', async () => {
    const { user, mock } = await openDialog('type');
    await user.click(await screen.findByRole('radio', { name: /Reimbursement/ }));
    await user.click(screen.getByRole('button', { name: 'Proceed' }));
    await user.click(await screen.findByRole('button', { name: 'Save' }));
    expect(await savedPayload(mock)).toEqual({
      isDraftEdit: true,
      expense: {
        id: 'expense-1',
        type: 'RECEIPT',
        // The item attachment was first moved to the invoice file on load (see above), then back to the item
        items: [{ ...expectedItems[0], url: 'https://e.x/item.pdf' }],
        attachedFiles: [{ url: 'https://e.x/attached.pdf' }],
        invoiceFile: undefined,
        invoiceInfo: 'Invoice info',
        reference: null, // Only invoices carry a reference
        tax: [],
      },
    });
  });

  it('payee: submits the new payee with its payout method, items and currency', async () => {
    const { user, mock } = await openDialog('payee');
    await user.click(await screen.findByRole('radio', { name: /Org/ }));
    await waitFor(() => expect(screen.getByRole('radio', { name: /Org bank/ })).toBeChecked());
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await savedPayload(mock)).toEqual({
      isDraftEdit: true,
      expense: {
        id: 'expense-1',
        payee: { slug: 'org' },
        payeeLocation: undefined,
        currency: 'USD',
        items: [{ ...expectedItems[0], url: null }], // Invoice items carry no receipt
        payoutMethod: { id: 'pm-org' },
        tax: [],
      },
    });
  });

  it('draft payout method: submits the payout method with the payee, items and currency', async () => {
    const draft = expenseFixture({
      status: 'DRAFT',
      draft: {
        payee: { slug: 'jane' },
        items: [
          {
            id: 'item-1',
            description: 'Design',
            url: 'https://e.x/item.pdf',
            incurredAt: '2025-03-01T00:00:00Z',
            amountV2: { valueInCents: 10000, currency: 'USD' },
          },
        ],
      },
    });
    const { user, mock } = await openDialog('payoutMethod', world(draft));
    await waitFor(() => expect(screen.getByRole('radio', { name: /My bank/ })).toBeChecked());
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await savedPayload(mock)).toEqual({
      isDraftEdit: true,
      expense: {
        id: 'expense-1',
        payoutMethod: { id: 'pm-bank-usd' },
        payee: { slug: 'jane' },
        payeeLocation: undefined,
        currency: 'USD',
        items: [{ ...expectedItems[0], url: null }], // Invoice items carry no receipt
        tax: [],
      },
    });
  });
});
