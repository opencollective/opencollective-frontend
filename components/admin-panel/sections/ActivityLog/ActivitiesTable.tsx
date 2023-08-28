import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { ColumnDef, TableMeta } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Activity } from '../../../../lib/graphql/types/v2/graphql';
import { BREAKPOINTS, useWindowResize } from '../../../../lib/hooks/useWindowResize';

import Container from '../../../Container';
import { DataTable } from '../../../DataTable';
import DateTime from '../../../DateTime';
import StyledHr from '../../../StyledHr';
import StyledLinkButton from '../../../StyledLinkButton';
import { P } from '../../../Text';

import ActivityDescription from './ActivityDescription';
import ActivityListItem from './ActivityListItem';
import { ActivityUser } from './ActivityUser';

const CELL_PADDING = '8px';

const CellButton = styled.button`
  border: 0;
  width: 100%;
  outline: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: ${themeGet('colors.black.900')};

  &:hover,
  :focus-visible {
    .title {
      text-decoration: underline;
    }
  }
`;

interface ActivityItemMeta extends TableMeta<Activity> {
  openActivity: (activity: Activity) => void;
}

export const cardColumns: ColumnDef<Activity>[] = [
  {
    accessorKey: 'summary',
    cell: ({ row, table }) => {
      const activity = row.original;
      const meta = table.options.meta as ActivityItemMeta;
      return (
        <CellButton onClick={() => meta.openActivity(activity)}>
          <ActivityListItem activity={activity} />
        </CellButton>
      );
    },
  },
];

export const tableColumns: ColumnDef<Activity>[] = [
  {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
    meta: { styles: { width: '15%' } },
    cell: ({ cell, table }) => {
      const createdAt = cell.getValue() as Activity['createdAt'];
      const meta = table.options.meta as ActivityItemMeta;
      return (
        <CellButton onClick={() => meta.openActivity(cell.row.original)}>
          <Container p={CELL_PADDING} fontSize="13px" color="black.700" fontWeight="normal">
            <DateTime value={createdAt} />
          </Container>
        </CellButton>
      );
    },
  },
  {
    accessorKey: 'individual',
    header: () => <FormattedMessage id="Tags.USER" defaultMessage="User" />,
    meta: { styles: { width: '20%' } },
    cell: ({ cell }) => {
      const activity = cell.row.original;
      return (
        <Container display="flex" p={CELL_PADDING} fontSize="12px">
          <ActivityUser activity={activity} showBy={false} avatarSize={20} />
        </Container>
      );
    },
  },
  {
    accessorKey: 'description',
    header: () => <FormattedMessage id="Fields.description" defaultMessage="Description" />,
    cell: ({ cell, table }) => {
      const activity = cell.row.original;
      const meta = table.options.meta as ActivityItemMeta;
      return (
        <CellButton onClick={() => meta.openActivity(activity)}>
          <Container fontSize="13px" p={CELL_PADDING}>
            <ActivityDescription activity={activity} />
          </Container>
        </CellButton>
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
      hideHeader={!isTableView}
      columns={columns}
      data={activities?.nodes || []}
      meta={{ openActivity } as ActivityItemMeta}
      loading={loading}
      nbPlaceholders={nbPlaceholders}
      headerProps={{ px: CELL_PADDING, py: 3 }}
      emptyMessage={() => (
        <div>
          <P fontSize="16px">
            <FormattedMessage defaultMessage="No agreements" />
          </P>
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
