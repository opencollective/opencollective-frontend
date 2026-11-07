/**
 * Test harness for the Expense form. Renders `useExpenseForm` (or a component using it) against a
 * real Apollo client whose network layer is a table of operation handlers, so tests act through the
 * form's public interface and assert on values, errors, options and mutation variables.
 */
import type { FetchResult, Operation } from '@apollo/client';
import { ApolloClient, ApolloLink, InMemoryCache, Observable, setLogVerbosity } from '@apollo/client';
import { act, renderHook, waitFor } from '@testing-library/react';

import LoggedInUser from '../../../lib/LoggedInUser';
import { withRequiredProviders } from '../../../test/providers';

import type { ExpenseForm } from '../useExpenseForm';
import { useExpenseForm } from '../useExpenseForm';

type OperationHandler = (variables: Record<string, any>) => Record<string, any> | Promise<Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any

type RecordedOperation = { operationName: string; variables: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Creates an Apollo client that answers operations by name. Every operation is recorded so tests
 * can assert on the exact variables sent to mutations.
 */
export function createMockApolloClient(handlers: Record<string, OperationHandler>) {
  const operations: RecordedOperation[] = [];
  const link = new ApolloLink(
    (operation: Operation) =>
      new Observable<FetchResult>(observer => {
        operations.push({ operationName: operation.operationName, variables: operation.variables });
        const handler = handlers[operation.operationName];
        if (!handler) {
          observer.error(new Error(`No mock handler for operation ${operation.operationName}`));
          return;
        }

        Promise.resolve()
          .then(() => handler(operation.variables))
          .then(data => {
            observer.next({ data });
            observer.complete();
          })
          .catch(err => observer.error(err));
      }),
  );

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache({
      possibleTypes: {
        Account: ['Collective', 'Host', 'Individual', 'Fund', 'Project', 'Bot', 'Event', 'Organization', 'Vendor'],
        AccountWithHost: ['Collective', 'Event', 'Fund', 'Project'],
        AccountWithParent: ['Event', 'Project'],
      },
    }),
  });

  return {
    client,
    operations,
    operationsNamed: (name: string) => operations.filter(o => o.operationName === name),
  };
}

export function mockLoggedInUser(opts: { slug: string; id?: number; adminOf?: string[] } | null) {
  if (!opts) {
    return null;
  }

  return new LoggedInUser({
    id: 1,
    CollectiveId: opts.id ?? 1,
    collective: { id: opts.id ?? 1, slug: opts.slug, type: 'USER' },
    memberOf: (opts.adminOf || []).map((slug, i) => ({ id: i + 100, role: 'ADMIN', collective: { slug } })),
  });
}

/**
 * Renders the Expense form hook with the given client. `useLoggedInUser` must be mocked by the
 * test file (see `jest.mock` usages in the hook tests).
 */
export function renderExpenseFormHook(
  client: ApolloClient<object>,
  props: Parameters<typeof useExpenseForm>[0],
): ReturnType<typeof renderHook<ExpenseForm, Parameters<typeof useExpenseForm>[0]>> {
  return renderHook(p => useExpenseForm(p), {
    initialProps: props,
    wrapper: ({ children }) => withRequiredProviders(children, { ApolloProvider: { client } }),
  });
}

/** Waits until the form finished its initial loading and options are settled. */
export async function waitForFormReady(result: { current: ExpenseForm }) {
  await waitFor(() => expect(result.current.initialLoading).toBe(false));
  await settle();
}

/** Flushes pending promises and effects (option rebuilds chain through several renders). */
export async function settle(times = 5) {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }
}

export async function setValues(result: { current: ExpenseForm }, values: Record<string, unknown>) {
  for (const [field, value] of Object.entries(values)) {
    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await result.current.setFieldValue(field as any, value as any);
    });
  }
  await settle();
}

export async function submit(result: { current: ExpenseForm }) {
  await act(async () => {
    await result.current.submitForm();
  });
  await settle();
}

/**
 * Fixtures only include the fields the form reads, so Apollo reports the rest as missing when
 * writing them to the cache. Call at the top of a test file to keep the output readable.
 */
export function silenceApolloMissingFieldErrors() {
  let previous: ReturnType<typeof setLogVerbosity>;
  beforeAll(() => {
    previous = setLogVerbosity('silent');
  });
  afterAll(() => {
    setLogVerbosity(previous);
  });
}

/**
 * A small in-memory "world" answering the `ExpenseFormSchema` query from the requested slugs.
 */
export type ExpenseFormWorld = {
  accounts: Record<string, Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
  loggedInAccount?: Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  recentlySubmittedExpenses?: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  expense?: Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export const answerFormQuery = (world: ExpenseFormWorld) => (vars: Record<string, any>) => ({
  // eslint-disable-line @typescript-eslint/no-explicit-any
  account: vars.hasCollectiveSlug ? (world.accounts[vars.collectiveSlug] ?? null) : null,
  payee: vars.hasPayeeSlug ? (world.accounts[vars.payeeSlug] ?? null) : null,
  loggedInAccount: world.loggedInAccount ?? null,
  submitter: vars.hasSubmitterSlug ? (world.loggedInAccount ?? null) : null,
  recentlySubmittedExpenses: vars.hasSubmitterSlug
    ? { __typename: 'ExpenseCollection', nodes: world.recentlySubmittedExpenses ?? [] }
    : null,
  expense: vars.hasExpenseId ? (world.expense ?? null) : null,
});

export const mutationResult = (legacyId = 1) => ({
  expense: { __typename: 'Expense', id: `expense-${legacyId}`, legacyId },
});
