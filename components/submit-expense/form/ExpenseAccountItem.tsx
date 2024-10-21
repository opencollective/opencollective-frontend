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

          admins: members(role: ADMIN) {
            totalCount
            nodes {
              id
              account {
                id
                type
                slug
                name
                imageUrl
                ...AccountHoverCardFields
                emails
              }
            }
          }
        }
      }
      ${accountHoverCardFields}
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
    <div className={cn('flex w-full gap-2', props.className)}>
      <div>
        <Avatar collective={account} radius={24} />
      </div>
      <div className="flex flex-grow items-center">
        <span className="inline-block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
          {account.name}
        </span>
        &nbsp;&nbsp;•&nbsp;&nbsp;
        <span className="inline-block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
          @{account.slug}
        </span>
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
