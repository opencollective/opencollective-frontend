import React from 'react';
import { gql, useFragment, useQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import type { Account } from '../../../lib/graphql/types/v2/schema';
import { isMulti } from '@/lib/filters/schemas';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';

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
    context: API_V2_CONTEXT,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
    skip: Boolean(fragmentData.name),
  });
  return fragmentData.name ?? queryData?.name ?? tierId;
}

function TierFilter({
  meta,
  ...props
}: FilterComponentProps<z.infer<typeof schema>, { accountSlug: string; childrenAccounts?: Account[] }>) {
  const { data, loading } = useQuery(contributionsTiersQuery, {
    variables: {
      slug: meta.accountSlug,
    },
    context: API_V2_CONTEXT,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const tierOptions = React.useMemo(() => {
    if (data?.account.childrenAccounts.nodes?.length === 0) {
      return data.account?.tiers?.nodes.map(tier => ({ label: tier.name, value: tier.id }));
    } else {
      const makeOption = account =>
        account?.tiers?.nodes.map(tier => ({ label: `${tier.name}  (${account.name})`, value: tier.id }));
      const options = makeOption(data?.account);
      data?.account.childrenAccounts.nodes.forEach(children => {
        options.push(...makeOption(children));
      });
      return options;
    }
  }, [data?.account]);

  return <ComboSelectFilter options={tierOptions} loading={loading} isMulti {...props} />;
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
