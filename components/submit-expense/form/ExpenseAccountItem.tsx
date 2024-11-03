import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { type AccountItemQuery, AccountType } from '../../../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../../../lib/i18n/collective-type';
import { cn } from '../../../lib/utils';

import { AccountHoverCard, accountHoverCardFields } from '../../AccountHoverCard';
import Avatar from '../../Avatar';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';

type ExpenseAccountItemProps = {
  className?: string;
  showAdmins?: boolean;
} & (
  | {
      slug: string;
      className?: string;
    }
  | {
      account: AccountItemQuery['account'];
    }
);

export function ExpenseAccountItem(props: ExpenseAccountItemProps) {
  const intl = useIntl();
  const query = useQuery(
    gql`
      query AccountItem($slug: String!, $showAdmins: Boolean!) {
        account(slug: $slug) {
          id
          legacyId
          slug
          name
          type
          imageUrl

          admins: members(role: ADMIN) @include(if: $showAdmins) {
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

          ... on AccountWithParent {
            parent {
              id
              legacyId
              slug
            }
          }
        }
      }
      ${accountHoverCardFields}
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        slug: 'slug' in props ? props.slug : null,
        showAdmins: !!props.showAdmins,
      },
      skip: 'account' in props,
    },
  );

  const account = query.data?.account || ('account' in props ? props.account : null);

  if (query.loading) {
    return <LoadingPlaceholder height={24} width={1} />;
  } else if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  } else if (!account) {
    return null;
  }

  return (
    <div className={cn('flex w-full items-center gap-2', props.className)}>
      <div>
        <Avatar collective={account} radius={24} />
      </div>
      <div className="flex flex-grow flex-col gap-1">
        <div className="max-w-96 overflow-x-clip text-ellipsis whitespace-nowrap">{account.name}</div>
        <div className="max-w-96 overflow-x-clip text-ellipsis whitespace-nowrap text-muted-foreground">
          {'parent' in account && account.parent ? (
            <FormattedMessage
              defaultMessage="{childAccountType, select, EVENT {An event} PROJECT {A project} other {an account}} by {parentAccount}"
              id="Xp9G7Y"
              values={{
                childAccountType: account.type,
                parentAccount: `@${account.parent.slug}`,
              }}
            />
          ) : account.type === AccountType.VENDOR ? (
            formatCollectiveType(intl, account.type, 1)
          ) : (
            `@${account.slug}`
          )}
        </div>
      </div>
      {props.showAdmins && (
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
      )}
    </div>
  );
}
