import type { WorkspaceAccount } from '@/lib/account';

export type DashboardSectionProps = {
  accountSlug: string;
  account?: WorkspaceAccount | null;
  subpath?: string[];
  isDashboard?: boolean;
};
