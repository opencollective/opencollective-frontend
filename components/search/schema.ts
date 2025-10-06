import z from 'zod';

export enum SearchEntity {
  ALL = 'ALL',
  ACCOUNTS = 'ACCOUNTS',
  EXPENSES = 'EXPENSES',
  TRANSACTIONS = 'TRANSACTIONS',
  CONTRIBUTIONS = 'CONTRIBUTIONS',
  UPDATES = 'UPDATES',
  COMMENTS = 'COMMENTS',
}
export const schema = z.object({
  workspace: z.string().optional(),
  limit: z.number().default(5),
  searchTerm: z.string().optional(),
  entity: z.nativeEnum(SearchEntity).default(SearchEntity.ALL),
});
