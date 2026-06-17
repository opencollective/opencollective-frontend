import React from 'react';
import { useQuery } from '@apollo/client';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import Avatar from '@/components/Avatar';
import DateTime from '@/components/DateTime';
import Link from '@/components/Link';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/Button';

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
  const [offset, setOffset] = React.useState(0);

  const { data, loading, error } = useQuery(hostedAccountUpdatesQuery, {
    variables: { accountId: account?.id, limit: UPDATES_LIMIT, offset },
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
      {totalCount > UPDATES_LIMIT && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - UPDATES_LIMIT))}
          >
            <ChevronLeft size={16} />
            <FormattedMessage defaultMessage="Previous" id="Pagination.Prev" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + UPDATES_LIMIT >= totalCount}
            onClick={() => setOffset(offset + UPDATES_LIMIT)}
          >
            <FormattedMessage defaultMessage="Next" id="Pagination.Next" />
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
