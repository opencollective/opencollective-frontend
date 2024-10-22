import React from 'react';
import { gql, useQuery } from '@apollo/client';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { cn } from '../../../lib/utils';

import { AccountHoverCard, accountHoverCardFields } from '../../AccountHoverCard';
import Avatar from '../../Avatar';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';

type ExpenseAccountItemProps = {
  slug: string;
  className?: string;
};

export function ExpenseAccountItem(props: ExpenseAccountItemProps) {
  const query = useQuery(
    gql`
      query AccountItem($slug: String!) {
        account(slug: $slug) {
          id
          legacyId
          slug
          name
          type
          imageUrl
          ... on AccountWithParent {
            parent {
              id
              name
              slug
            }
          }
          # admins: members(role: ADMIN) {
          #   totalCount
          #   nodes {
          #     id
          #     account {
          #       id
          #       type
          #       slug
          #       name
          #       imageUrl
          #       ...AccountHoverCardFields
          #       emails
          #     }
          #   }
          # }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        slug: props.slug,
      },
    },
  );

  const account = query.data?.account;

  if (query.loading) {
    return <LoadingPlaceholder height={24} width={1} />;
  } else if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  return (
    <div className={cn('flex w-full items-center gap-2', props.className)}>
      <Avatar collective={account} radius={32} />
      <div className="flex flex-grow flex-col items-start text-sm">
        <div className="inline-block overflow-hidden text-ellipsis whitespace-nowrap font-medium">{account.name}</div>
        <div className="inline-block overflow-hidden text-ellipsis whitespace-nowrap font-normal text-muted-foreground">
          {account.parent ? (
            <span>
              {account.type} by @{account.parent.slug}
            </span>
          ) : (
            <span>@{account.slug}</span>
          )}
        </div>
      </div>
      <div className="flex items-center -space-x-1">
        {account?.admins?.nodes &&
          account.admins.nodes.slice(0, 3).map(admin => (
            <AccountHoverCard
              key={admin.id}
              account={admin.account}
              trigger={
                <span>
                  <Avatar collective={admin.account} radius={24} />
                </span>
              }
            />
          ))}
        {account?.admins?.totalCount > 3 && (
          <div className="pl-2 text-slate-600">+{account?.admins.totalCount - 3}</div>
        )}
      </div>
    </div>
  );
}
