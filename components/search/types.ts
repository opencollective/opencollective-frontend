import type {
  SearchAccountFieldsFragment,
  SearchCommentFieldsFragment,
  SearchExpenseFieldsFragment,
  SearchHostApplicationFieldsFragment,
  SearchOrderFieldsFragment,
  SearchTransactionFieldsFragment,
  SearchUpdateFieldsFragment,
} from '@/lib/graphql/types/v2/graphql';

import type { SearchEntity } from './filters';
import { PageMenuItem } from '../dashboard/Menu';

export type SearchHighlights = {
  score: number;
  fields: Record<string, string[]>;
};

export type DashboardPage = PageMenuItem & { group?: string; id: string };

export type SearchEntityNodeMap = {
  [SearchEntity.ACCOUNTS]: SearchAccountFieldsFragment;
  [SearchEntity.EXPENSES]: SearchExpenseFieldsFragment;
  [SearchEntity.TRANSACTIONS]: SearchTransactionFieldsFragment;
  [SearchEntity.ORDERS]: SearchOrderFieldsFragment;
  [SearchEntity.UPDATES]: SearchUpdateFieldsFragment;
  [SearchEntity.COMMENTS]: SearchCommentFieldsFragment;
  [SearchEntity.HOST_APPLICATIONS]: SearchHostApplicationFieldsFragment;
  [SearchEntity.DASHBOARD_TOOL]: DashboardPage;
};
