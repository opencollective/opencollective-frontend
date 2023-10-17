import React from 'react';
import { gql, useLazyQuery, useQuery } from '@apollo/client';
import { CalendarIcon } from 'lucide-react';
import { defineMessage, FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { Account, AccountHoverCardFieldsFragment } from '../../../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../../../lib/i18n/collective-type';
import { getCollectivePageRoute } from '../../../lib/url-helpers';

import Avatar from '../../Avatar';
import Link from '../../Link';
import { Badge } from '../../ui/Badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../ui/HoverCard';
import { Skeleton } from '../../ui/Skeleton';

import ComboSelectFilter from './ComboSelectFilter';

export const accountFieldsFragment = gql`
  fragment AccountFields on Account {
    __typename
    id
    name
    slug
    type
    description
    imageUrl
  }
`;

export const accountHoverCardFragment = gql`
  fragment AccountHoverCardFields on Account {
    __typename
    id
    name
    slug
    type
    description
    imageUrl
    ... on AccountWithParent {
      parent {
        id
        slug
        name
        imageUrl
        hostMembers: members(role: [HOST]) {
          nodes {
            id
            since
          }
        }
      }
    }

    hostMembers: members(role: [HOST]) {
      nodes {
        id
        since
      }
    }
  }
`;
const accountQuery = gql`
  query Account($slug: String!, $withHoverCard: Boolean!) {
    account(slug: $slug) {
      id
      ...AccountFields
      ...AccountHoverCardFields @include(if: $withHoverCard)
    }
  }
  ${accountFieldsFragment}
  ${accountHoverCardFragment}
`;

const hostedAccountFilterSearch = gql`
  query HostedAccountFilterSearchQuery(
    $searchTerm: String
    $hostSlug: String
    $orderBy: OrderByInput
    $withHoverCard: Boolean!
  ) {
    accounts(searchTerm: $searchTerm, host: { slug: $hostSlug }, orderBy: $orderBy) {
      nodes {
        id
        ...AccountFields
        ...AccountHoverCardFields @include(if: $withHoverCard)
      }
    }
  }
  ${accountFieldsFragment}
  ${accountHoverCardFragment}
`;

export const AccountRenderer = ({
  account,
  withHoverCard,
}: {
  account: Partial<AccountHoverCardFieldsFragment> & {
    slug: Account['slug'];
  };
  withHoverCard?: boolean;
}) => {
  const [open, setOpen] = React.useState(false);
  const { data, loading } = useQuery(accountQuery, {
    variables: { slug: account.slug, withHoverCard: open },
    fetchPolicy: 'cache-first',
    context: API_V2_CONTEXT,
    // skip if there is a name and the hover card is closed (meaning that the extra information is not required)
    skip: (!!account.name && !open) || !!account.hostMembers,
  });
  account = data?.account || account;
  const intl = useIntl();

  const hostedSince =
    'parent' in account ? account.parent?.hostMembers?.nodes?.[0]?.since : account.hostMembers?.nodes?.[0]?.since;
  const isChildAccount = account.type === 'EVENT' || account.type === 'PROJECT';

  return (
    <HoverCard {...(!withHoverCard && { open: false })} onOpenChange={open => setOpen(open)}>
      <HoverCardTrigger asChild tabIndex={-1}>
        <div className="flex h-full w-full items-center justify-between gap-2 overflow-hidden">
          <Avatar collective={account} radius={20} />
          <div className="relative flex flex-1 items-center justify-between gap-1 overflow-hidden">
            <span className="truncate">{account.name ?? account.slug}</span>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent sideOffset={32} side="right">
        <div className="flex flex-col gap-3">
          <Link
            href={getCollectivePageRoute(account)}
            className="group flex items-center gap-3 overflow-hidden break-words font-medium"
            onClick={e => e.stopPropagation()}
          >
            <Avatar collective={account} radius={40} />
            <span className="block overflow-hidden truncate">
              <h3 className="truncate group-hover:underline">{account.name}</h3>
              <span className="truncate font-medium text-muted-foreground">@{account.slug}</span>
            </span>
          </Link>

          {account.description && (
            <p className="line-clamp-1 whitespace-pre-wrap text-sm text-foreground">{account.description}</p>
          )}

          {isChildAccount && loading ? (
            <Skeleton className="my-0.5 h-5" />
          ) : (
            'parent' in account && (
              <div className="flex items-center gap-2 overflow-hidden text-muted-foreground">
                <FormattedMessage
                  defaultMessage="{accountType} by {parentAccount}"
                  values={{
                    accountType: (
                      <Badge round type="outline" size="sm">
                        {formatCollectiveType(intl, account.type, 1)}
                      </Badge>
                    ),
                    parentAccount: (
                      <Link
                        href={getCollectivePageRoute(account.parent)}
                        className="flex items-center gap-1 truncate font-medium text-foreground hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        <Avatar collective={account.parent} radius={20} />
                        <span className="truncate">{account.parent.name}</span>
                      </Link>
                    ),
                  }}
                />
              </div>
            )
          )}

          {loading ? (
            <Skeleton className="h-5 w-3/4" />
          ) : (
            hostedSince && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <CalendarIcon size={14} />
                <FormattedMessage
                  defaultMessage="Hosted since {date}"
                  values={{
                    date: <FormattedDate dateStyle="medium" value={hostedSince} />,
                  }}
                />
              </div>
            )
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const schema = z.string().optional();

export const hostedAccountFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  toVariables: (value, key) => ({ [key]: { slug: value } }),
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Account' }),
    Component: HostedAccountFilter,
    valueRenderer: ({ value, ...props }) => <AccountRenderer account={{ slug: value }} {...props} />,
  },
};

const resultNodeToOption = account => ({
  label: <AccountRenderer account={account} withHoverCard />,
  value: account.slug,
});

export function HostedAccountFilter({
  meta: { hostSlug, hostedAccounts },
  ...props
}: FilterComponentProps<
  z.infer<typeof schema>,
  { hostSlug: string; hostedAccounts?: Partial<AccountHoverCardFieldsFragment>[] }
>) {
  const defaultAccounts = hostedAccounts?.map(resultNodeToOption) || [];
  const [options, setOptions] = React.useState<{ label: React.ReactNode; value: string }[]>(defaultAccounts);

  const [search, { loading, data }] = useLazyQuery(hostedAccountFilterSearch, {
    variables: { hostSlug, withHoverCard: true },
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    context: API_V2_CONTEXT,
  });

  const searchFunc = searchTerm => {
    if (!searchTerm && defaultAccounts.length) {
      setOptions(defaultAccounts);
    } else {
      search({
        variables: {
          searchTerm,
          ...(!searchTerm && { orderBy: { field: 'ACTIVITY', direction: 'DESC' } }),
        },
      });
    }
  };

  React.useEffect(() => {
    if (!loading) {
      setOptions(data?.accounts?.nodes.map(resultNodeToOption) || defaultAccounts);
    }
  }, [loading, data]);

  return <ComboSelectFilter options={options} loading={loading} searchFunc={searchFunc} {...props} />;
}
