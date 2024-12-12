import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import Link from '../../Link';

import { TransactionGroupCard } from './TransactionGroupCard';

const transactionGroupsQuery = gql`
  query TransactionGroups($slug: String!, $limit: Int, $type: TransactionType) {
    transactionGroups(account: { slug: $slug }, limit: $limit, type: $type) {
      totalCount
      nodes {
        id
        totalAmount {
          valueInCents
          currency
        }
        createdAt
        primaryTransaction {
          id
          kind
          type
          oppositeAccount {
            id
            name
            slug
            imageUrl
            type
          }
        }
      }
    }
  }
`;

export function TransactionGroups({ queryFilter }) {
  const router = useRouter();
  const { accountSlug, collectiveSlug } = router.query;
  const transactionGroupRoute = accountSlug
    ? `/preview/${collectiveSlug}/${accountSlug}/transactions`
    : `/preview/${collectiveSlug}/transactions`;
  const { data } = useQuery(transactionGroupsQuery, {
    variables: {
      slug: accountSlug ?? collectiveSlug,
      limit: 20,
      type: queryFilter.variables.type,
    },
    fetchPolicy: 'cache-and-network',
    context: API_V2_CONTEXT,
  });
  return (
    <div>
      <h3 className="mb-3 px-2 text-lg font-semibold text-slate-800">Transactions</h3>
      <div className="divide-y overflow-hidden rounded-xl border bg-background">
        {data?.transactionGroups?.nodes?.map(group => (
          <div className="hover:bg-muted" key={group.id}>
            <Link href={`${transactionGroupRoute}/${group.id}`} className="">
              <TransactionGroupCard group={group} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
