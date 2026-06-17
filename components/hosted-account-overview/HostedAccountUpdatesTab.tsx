import React from 'react';
import { useQuery } from '@apollo/client';
import type { ColumnDef } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { integer } from '@/lib/filters/schemas';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import Avatar from '@/components/Avatar';
import { Pagination } from '@/components/dashboard/filters/Pagination';
import DateTime from '@/components/DateTime';
import Link from '@/components/Link';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { DataTable } from '@/components/table/DataTable';

import { hostedAccountUpdatesQuery } from './queries';
import type { HostedAccountProfileData } from './types';

const UPDATES_LIMIT = 25;

type UpdateRow = {
  id: string;
  slug: string;
  title: string;
  publishedAt?: string | null;
  account?: { id: string; slug: string; name?: string | null; imageUrl?: string | null; type?: string } | null;
};

const columns: ColumnDef<UpdateRow>[] = [
  {
    accessorKey: 'title',
    header: () => <FormattedMessage defaultMessage="Title" id="Title" />,
    cell: ({ row }) => {
      const update = row.original;
      return (
        <Link
          href={`/${update.account?.slug}/updates/${update.slug}`}
          className="font-medium text-foreground hover:underline"
        >
          <span className="line-clamp-1">{update.title}</span>
        </Link>
      );
    },
  },
  {
    accessorKey: 'publishedAt',
    header: () => <FormattedMessage defaultMessage="Published" id="update.status.published" />,
    meta: { className: 'w-40' },
    cell: ({ row }) =>
      row.original.publishedAt ? (
        <div className="text-muted-foreground">
          <DateTime value={row.original.publishedAt} dateStyle="medium" />
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Account" id="TwyMau" />,
    meta: { className: 'w-40 xl:w-56' },
    cell: ({ row }) => {
      const account = row.original.account;
      return (
        <div className="flex items-center gap-2 truncate text-muted-foreground">
          <Avatar collective={account} radius={20} />
          <span className="truncate">{account?.name}</span>
        </div>
      );
    },
  },
];

type HostedAccountUpdatesTabProps = {
  account?: HostedAccountProfileData;
};

export function HostedAccountUpdatesTab({ account }: HostedAccountUpdatesTabProps) {
  const queryFilter = useQueryFilter({
    schema: z.object({ limit: integer.default(UPDATES_LIMIT), offset: integer.default(0) }),
    filters: {},
    skipRouter: true,
  });

  const { data, loading, error } = useQuery(hostedAccountUpdatesQuery, {
    variables: { accountId: account?.id, ...queryFilter.variables },
    skip: !account?.id,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const updates = data?.account?.updates;
  const totalCount = updates?.totalCount || 0;

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        data-cy="updates-table"
        columns={columns}
        data={updates?.nodes || []}
        loading={loading}
        nbPlaceholders={5}
        emptyMessage={() => <FormattedMessage defaultMessage="No Updates" id="updates.empty" />}
      />
      <Pagination queryFilter={queryFilter} total={totalCount} />
    </div>
  );
}
