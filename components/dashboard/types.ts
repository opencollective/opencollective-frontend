import type { DashboardQuery } from '@/lib/graphql/types/v2/graphql';

export type DashboardSectionProps = {
  accountSlug: string;
  account?: DashboardQuery['account'];
  subpath?: string[];
  isDashboard?: boolean;
};
