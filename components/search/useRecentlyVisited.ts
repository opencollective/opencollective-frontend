import { useCallback } from 'react';
import * as Sentry from '@sentry/browser';
import { z } from 'zod';

import {
  AccountType,
  Currency,
  ExpenseStatus,
  ExpenseType,
  TransactionKind,
  TransactionType,
} from '../../lib/graphql/types/v2/graphql';
import useLocalStorage from '../../lib/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS } from '../../lib/local-storage';

import { useWorkspace } from '../WorkspaceProvider';

const BaseAccountSchema = z.object({
  name: z.string(),
  slug: z.string(),
  imageUrl: z.string().optional(),
  type: z.nativeEnum(AccountType),
});
const AccountSchema = BaseAccountSchema.extend({
  parentCollective: BaseAccountSchema.optional(),
});

const ExpenseSchema = z.object({
  legacyId: z.number(),
  description: z.string(),
  type: z.nativeEnum(ExpenseType),
  account: AccountSchema,
  payee: AccountSchema,
  status: z.nativeEnum(ExpenseStatus),
});

const TransactionSchema = z.object({
  legacyId: z.number(),
  kind: z.nativeEnum(TransactionKind),
  netAmount: z.object({
    valueInCents: z.number(),
    currency: z.nativeEnum(Currency),
  }),
  type: z.nativeEnum(TransactionType),
  account: AccountSchema,
  oppositeAccount: AccountSchema,
});

export type AccountResultData = z.infer<typeof AccountSchema>;
export type ExpenseResultData = z.infer<typeof ExpenseSchema>;
export type TransactionResultData = z.infer<typeof TransactionSchema>;

const basePageVisitSchema = z.object({
  type: z.enum(['account', 'expense', 'transaction']),
  key: z.string(),
});

const PageVisitSchema = z.discriminatedUnion('type', [
  basePageVisitSchema.extend({
    type: z.literal('account'),
    data: AccountSchema,
  }),
  basePageVisitSchema.extend({
    type: z.literal('expense'),
    data: ExpenseSchema,
  }),
  basePageVisitSchema.extend({
    type: z.literal('transaction'),
    data: TransactionSchema,
  }),
]);

const RecentlyVisitedSchema = z.record(z.string(), z.array(PageVisitSchema));

type RecentlyVisited = z.infer<typeof RecentlyVisitedSchema>;
type PageVisit = z.infer<typeof PageVisitSchema>;

export function useRecentlyVisited() {
  const [recentlyVisitedRaw, setRecentlyVisitedRaw] = useLocalStorage<RecentlyVisited>(
    LOCAL_STORAGE_KEYS.RECENTLY_VISITED,
    {},
  );
  const { workspace } = useWorkspace();
  const dashboardSlug = workspace?.slug;

  // Parse the recently visited data using the zod schema
  const recentlyVisited: RecentlyVisited = (() => {
    try {
      return RecentlyVisitedSchema.parse(recentlyVisitedRaw);
    } catch (error) {
      Sentry.captureException(error);
      setRecentlyVisitedRaw({});
      return {};
    }
  })();

  const addToRecent = useCallback(
    (pageVisit: PageVisit) => {
      try {
        const parsedPageVisit = PageVisitSchema.parse(pageVisit);

        setRecentlyVisitedRaw(prevRecentlyVisited => {
          if (!dashboardSlug) {
            return {};
          }
          const dashboardVisits = (prevRecentlyVisited[dashboardSlug] || []).filter(
            result => result.key !== parsedPageVisit.key,
          );
          const updatedDashboardVisits = [parsedPageVisit, ...dashboardVisits];
          return {
            ...prevRecentlyVisited,
            [dashboardSlug]: updatedDashboardVisits.slice(0, 5),
          };
        });
      } catch (e) {
        Sentry.captureException(e);
      }
    },
    [dashboardSlug, setRecentlyVisitedRaw],
  );

  const currentRecentlyVisited = dashboardSlug ? (recentlyVisited[dashboardSlug] ?? []) : [];

  return { recentlyVisited: currentRecentlyVisited, addToRecent };
}
