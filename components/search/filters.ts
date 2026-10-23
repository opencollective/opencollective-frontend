import { ArrowRightLeft, Coins, FileText, Megaphone, MessageCircle, Receipt, Users } from 'lucide-react';
import { z } from 'zod';

export enum SearchEntity {
  ALL = 'ALL',
  ACCOUNTS = 'ACCOUNTS',
  EXPENSES = 'EXPENSES',
  TRANSACTIONS = 'TRANSACTIONS',
  ORDERS = 'ORDERS',
  UPDATES = 'UPDATES',
  COMMENTS = 'COMMENTS',
  HOST_APPLICATIONS = 'HOST_APPLICATIONS',
  DASHBOARD_TOOL = 'DASHBOARD_TOOL',
}

/** Entities with results in `search.results` */
export type SearchResultEntity = Exclude<SearchEntity, SearchEntity.ALL | SearchEntity.DASHBOARD_TOOL>;

/** GraphQL field of each entity in `search.results` */
export const SEARCH_ENTITY_RESULT_FIELDS = {
  [SearchEntity.ACCOUNTS]: 'accounts',
  [SearchEntity.EXPENSES]: 'expenses',
  [SearchEntity.TRANSACTIONS]: 'transactions',
  [SearchEntity.ORDERS]: 'orders',
  [SearchEntity.UPDATES]: 'updates',
  [SearchEntity.COMMENTS]: 'comments',
  [SearchEntity.HOST_APPLICATIONS]: 'hostApplications',
} as const satisfies Record<SearchResultEntity, string>;

export const entityFilterOptions = {
  [SearchEntity.ACCOUNTS]: {
    value: SearchEntity.ACCOUNTS,
    icon: Users,
    className: 'bg-blue-50 text-blue-700',
  },
  [SearchEntity.EXPENSES]: {
    value: SearchEntity.EXPENSES,
    icon: Receipt,
    className: 'bg-green-50 text-green-700',
  },
  [SearchEntity.ORDERS]: {
    value: SearchEntity.ORDERS,
    icon: Coins,
    className: 'bg-amber-50 text-amber-700',
  },
  [SearchEntity.HOST_APPLICATIONS]: {
    value: SearchEntity.HOST_APPLICATIONS,
    icon: FileText,
    className: 'bg-indigo-50 text-indigo-700',
  },
  [SearchEntity.TRANSACTIONS]: {
    value: SearchEntity.TRANSACTIONS,
    icon: ArrowRightLeft,
    className: 'bg-purple-50 text-purple-700',
  },
  [SearchEntity.UPDATES]: {
    value: SearchEntity.UPDATES,
    icon: Megaphone,
    className: 'bg-sky-50 text-sky-700',
  },
  [SearchEntity.COMMENTS]: {
    value: SearchEntity.COMMENTS,
    icon: MessageCircle,
    className: 'bg-slate-100 text-slate-700',
  },
};

export const schema = z.object({
  workspace: z.string().optional(),
  limit: z.number().default(20),
  offset: z.number().default(0),
  searchTerm: z.string().optional(),
  entity: z.nativeEnum(SearchEntity).default(SearchEntity.ALL),
});
