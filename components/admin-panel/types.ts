import type { Account } from '../../lib/graphql/types/v2/graphql';

export type AdminSectionProps = {
  account: Partial<Account>;
  subpath: string;
  hostSlug: string;
};
