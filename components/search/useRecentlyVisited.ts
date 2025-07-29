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
} from '../../lib/graphql/types/v2/schema';
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

const OrderSchema = z.object({
  legacyId: z.number(),
  description: z.string(),
  fromAccount: AccountSchema,
  toAccount: AccountSchema,
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

const UpdateSchema = z.object({
  legacyId: z.number(),
  slug: z.string(),
  account: AccountSchema,
  title: z.string(),
  html: z.string(),
});

const CommentSchema = z.object({
  legacyId: z.number(),
  html: z.string(),
  update: UpdateSchema.optional(),
  expense: ExpenseSchema.optional(),
  order: OrderSchema.optional(),
  conversation: z.object({}).optional(),
  hostApplication: z.object({ id: z.string() }).optional(),
  fromAccount: AccountSchema,
});

export type AccountResultData = z.infer<typeof AccountSchema>;
export type CommentResultData = z.infer<typeof CommentSchema>;
export type ExpenseResultData = z.infer<typeof ExpenseSchema>;
export type OrderResultData = z.infer<typeof OrderSchema>;
export type TransactionResultData = z.infer<typeof TransactionSchema>;
export type UpdateResultData = z.infer<typeof UpdateSchema>;

const basePageVisitSchema = z.object({
  type: z.enum(['account', 'comment', 'expense', 'order', 'transaction', 'update']),
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
  basePageVisitSchema.extend({
    type: z.literal('update'),
    data: UpdateSchema,
  }),
  basePageVisitSchema.extend({
    type: z.literal('order'),
    data: OrderSchema,
  }),
  basePageVisitSchema.extend({
    type: z.literal('comment'),
    data: CommentSchema,
  }),
]);

const RecentlyVisitedSchema = z.record(z.string(), z.array(PageVisitSchema));

type RecentlyVisited = z.infer<typeof RecentlyVisitedSchema>;
export type PageVisit = z.infer<typeof PageVisitSchema>;

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
