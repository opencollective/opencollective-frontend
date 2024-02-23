import React from 'react';
import type { ColumnDef, TableMeta } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';

import type { Activity } from '../../../../lib/graphql/types/v2/graphql';
import { BREAKPOINTS, useWindowResize } from '../../../../lib/hooks/useWindowResize';

import { DataTable } from '../../../DataTable';
import DateTime from '../../../DateTime';
import StyledHr from '../../../StyledHr';
import StyledLinkButton from '../../../StyledLinkButton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import { TableActionsButton } from '../../../ui/Table';

import ActivityDescription from './ActivityDescription';
import ActivityListItem from './ActivityListItem';
import { ActivityUser } from './ActivityUser';

interface ActivityItemMeta extends TableMeta<Activity> {
  openActivity: (activity: Activity) => void;
}

const cardColumns: ColumnDef<Activity>[] = [
  {
    accessorKey: 'summary',
    cell: ({ row }) => {
      const activity = row.original;
      return <ActivityListItem activity={activity} />;
    },
  },
];

const tableColumns: ColumnDef<Activity>[] = [
  {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
    meta: { className: 'w-32' },
    cell: ({ cell }) => {
      const createdAt = cell.getValue() as Activity['createdAt'];
      return (
        <div className="text-slate-700">
          <DateTime dateStyle="medium" value={createdAt} />
        </div>
      );
    },
  },
  {
    accessorKey: 'individual',
    header: () => <FormattedMessage id="Tags.USER" defaultMessage="User" />,
    meta: { className: 'w-40 xl:w-56' },
    cell: ({ cell }) => {
      const activity = cell.row.original;
      return (
        <div className="truncate text-slate-700">
          <span className="truncate">
            <ActivityUser activity={activity} showBy={false} avatarSize={20} />
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'description',
    header: () => <FormattedMessage id="Fields.description" defaultMessage="Description" />,
    cell: ({ cell }) => {
      const activity = cell.row.original;
      return (
        <div className="truncate">
          <ActivityDescription activity={activity} />
        </div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: null,
    meta: { className: 'w-14' },
    cell: ({ cell, table }) => {
      const activity = cell.row.original;
      const meta = table.options.meta as ActivityItemMeta;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TableActionsButton />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                meta.openActivity(activity);
              }}
            >
              <FormattedMessage defaultMessage="View details" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

type ActivitiesTableProps = {
  activities: { nodes: Activity[] };
  openActivity: (activity: Activity) => void;
  resetFilters?: () => void;
  loading?: boolean;
  nbPlaceholders?: number;
};

export default function ActivitiesTable({
  activities,
  openActivity,
  loading,
  nbPlaceholders,
  resetFilters,
}: ActivitiesTableProps) {
  const [isTableView, setIsTableView] = React.useState(true);
  useWindowResize(() => setIsTableView(window.innerWidth > BREAKPOINTS.MEDIUM));
  const columns = isTableView ? tableColumns : cardColumns;
  return (
    <DataTable
      data-cy="activities-table"
      innerClassName="table-fixed"
      hideHeader={!isTableView}
      columns={columns}
      data={activities?.nodes || []}
      meta={{ openActivity } as ActivityItemMeta}
      loading={loading}
      nbPlaceholders={nbPlaceholders}
      onClickRow={row => openActivity(row.original)}
      emptyMessage={() => (
        <div>
          <p className="text-base">
            <FormattedMessage defaultMessage="No agreements" />
          </p>
          {resetFilters && (
            <div>
              <StyledHr maxWidth={300} m="16px auto" borderColor="black.100" />
              <StyledLinkButton onClick={resetFilters}>
                <FormattedMessage defaultMessage="Reset filters" />
              </StyledLinkButton>
            </div>
          )}
        </div>
      )}
    />
  );
}
