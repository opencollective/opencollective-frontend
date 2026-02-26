import type { HostContributionCategoryRulesQuery } from '@/lib/graphql/types/v2/graphql';

import type { Op } from '../rules';

export type PredicateInputProps = {
  value: string | number | string[] | null;
  onChange: (value: string | number | string[] | null) => void;
  operator: Op;
  host: HostContributionCategoryRulesQuery['host'];
  className?: string;
  error?: string;
};
