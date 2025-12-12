import React from 'react';
import { gql, useFragment, useQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import type { Account } from '../../../lib/graphql/types/v2/schema';
import { isMulti } from '@/lib/filters/schemas';

import ComboSelectFilter from './ComboSelectFilter';

const schema = isMulti(z.string()).optional();

const tierNameFragment = gql`
  fragment TierName on Tier {
    id
    name
  }
`;

const contributionsTiersQuery = gql`
  query ContributionsTiers($slug: String!) {
    account(slug: $slug) {
      id
      slug
      name
      childrenAccounts {
        totalCount
        nodes {
          id
          slug
          name
          ... on AccountWithContributions {
            tiers {
              nodes {
                ...TierName
              }
            }
          }
        }
      }
      ... on AccountWithContributions {
        tiers {
          nodes {
            ...TierName
          }
        }
      }
    }
  }
  ${tierNameFragment}
`;

const contributionTierQuery = gql`
  query ContributionTier($tierId: String!) {
    tier(tier: { id: $tierId }) {
      ...TierName
    }
  }
  ${tierNameFragment}
`;

function TierRenderer({ tierId }) {
  const { data: fragmentData } = useFragment({
    fragment: tierNameFragment,
    from: { __typename: 'Tier', id: tierId },
  });
  const { data: queryData } = useQuery(contributionTierQuery, {
    variables: {
      tierId,
    },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
    skip: Boolean(fragmentData.name),
  });
  return fragmentData.name ?? queryData?.name ?? tierId;
}

function TierFilter({
  meta,
  value,
  onChange,
  ...props
}: FilterComponentProps<
  z.infer<typeof schema>,
  { accountSlug: string; childrenAccounts?: Account[]; selectedAccountSlug?: string }
>) {
  const { data, loading } = useQuery(contributionsTiersQuery, {
    variables: { slug: meta.accountSlug },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
    skip: !meta.accountSlug,
  });

  // Get tiers for the selected account, or all tiers grouped by account if none selected
  const { tierOptions, groupedOptions } = React.useMemo(() => {
    if (!data?.account) {
      return { tierOptions: [], groupedOptions: undefined };
    }

    // If an account is selected, show only its tiers
    if (meta.selectedAccountSlug) {
      const account =
        meta.selectedAccountSlug === meta.accountSlug
          ? data.account
          : data.account.childrenAccounts?.nodes?.find(child => child.slug === meta.selectedAccountSlug);

      const tiers = account?.tiers?.nodes?.map(tier => ({ label: tier.name, value: tier.id })) || [];
      return { tierOptions: tiers, groupedOptions: undefined };
    }

    // No account selected - show all tiers, grouped by account
    const hasChildren = data.account.childrenAccounts?.nodes?.length > 0;
    if (!hasChildren) {
      const tiers = data.account.tiers?.nodes?.map(tier => ({ label: tier.name, value: tier.id })) || [];
      return { tierOptions: tiers, groupedOptions: undefined };
    }

    const groups: { label: string; options: { label: string; value: string }[] }[] = [];
    if (data.account.tiers?.nodes?.length) {
      groups.push({
        label: data.account.name,
        options: data.account.tiers.nodes.map(tier => ({ label: tier.name, value: tier.id })),
      });
    }
    data.account.childrenAccounts.nodes.forEach(childAccount => {
      if (childAccount.tiers?.nodes?.length) {
        groups.push({
          label: childAccount.name,
          options: childAccount.tiers.nodes.map(tier => ({ label: tier.name, value: tier.id })),
        });
      }
    });

    return { tierOptions: [], groupedOptions: groups.length > 0 ? groups : undefined };
  }, [data?.account, meta.selectedAccountSlug, meta.accountSlug]);

  // Auto-unselect tiers that don't belong to selected account
  React.useEffect(() => {
    if (!meta.selectedAccountSlug || !value) {
      return;
    }

    const selectedTiers = Array.isArray(value) ? value : [value];
    const validTierIds = new Set(tierOptions.map(opt => opt.value));
    const validTiers = selectedTiers.filter(tierId => validTierIds.has(tierId));
    if (validTiers.length !== selectedTiers.length) {
      onChange(validTiers.length > 0 ? validTiers : undefined);
    }
  }, [meta.selectedAccountSlug, value, tierOptions, onChange]);

  return (
    <ComboSelectFilter
      options={groupedOptions ? undefined : tierOptions}
      groupedOptions={groupedOptions}
      loading={loading}
      isMulti
      value={value}
      onChange={onChange}
      {...props}
    />
  );
}

export const tierFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  toVariables: value => {
    return { tier: value.map(id => ({ id })) };
  },
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Tier', id: 'b07w+D' }),
    Component: TierFilter,
    valueRenderer: ({ value }) => <TierRenderer tierId={value} />,
  },
};
