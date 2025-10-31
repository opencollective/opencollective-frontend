import z from 'zod';

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

export const schema = z.object({
  workspace: z.string().optional(),
  limit: z.number().default(20),
  offset: z.number().default(0),
  searchTerm: z.string().optional(),
  entity: z.nativeEnum(SearchEntity).default(SearchEntity.ALL),
});
