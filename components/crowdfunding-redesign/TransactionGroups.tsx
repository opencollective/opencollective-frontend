import { gql, useQuery } from '@apollo/client';
import React from 'react';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { ArrowDownRight, ArrowUp, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import DateTime from '../DateTime';
import LinkCollective from '../LinkCollective';
import Avatar from '../Avatar';
import Link from '../Link';
import { TransactionGroupCard } from './TransactionGroupCard';
import { useRouter } from 'next/router';
const transactionGroupsQuery = gql`
  query TransactionGroups($slug: String!, $limit: Int) {
    account(slug: $slug) {
      id
      name
      type
      transactionGroups(limit: $limit) {
        totalCount
        nodes {
          id
          amountInHostCurrency {
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
  }
`;

export function TransactionGroups() {
  const router = useRouter();
  const { accountSlug, collectiveSlug } = router.query;
  const transactionGroupRoute = accountSlug
    ? `/preview/${collectiveSlug}/${accountSlug}/transactions`
    : `/preview/${collectiveSlug}/transactions`;
  const { data } = useQuery(transactionGroupsQuery, {
    variables: {
      slug: accountSlug ?? collectiveSlug,
      limit: 20,
    },
    fetchPolicy: 'cache-and-network',
    context: API_V2_CONTEXT,
  });
  return (
    <div>
      <h3 className="mb-3 px-2 text-lg font-semibold text-slate-800">Transactions</h3>
      <div className="divide-y overflow-hidden rounded-xl border bg-background">
        {data?.account?.transactionGroups?.nodes?.map(group => (
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
