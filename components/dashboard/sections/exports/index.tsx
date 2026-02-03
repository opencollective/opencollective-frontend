import React from 'react';
import { useQuery } from '@apollo/client';
import { AlertCircle, CheckCircle2, Clock, Download, FileText, Loader2 } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, Views } from '@/lib/filters/filter-types';
import { integer } from '@/lib/filters/schemas';
import { gql } from '@/lib/graphql/helpers';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import Avatar from '../../../Avatar';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';

const exportRequestsQuery = gql`
  query ExportRequests(
    $account: AccountReferenceInput!
    $type: ExportRequestType
    $status: ExportRequestStatus
    $limit: Int!
    $offset: Int!
  ) {
    exportRequests(account: $account, type: $type, status: $status, limit: $limit, offset: $offset) {
      offset
      limit
      totalCount
      nodes {
        id
        legacyId
        name
        type
        status
        progress
        error
        createdAt
        updatedAt
        expiresAt
        createdBy {
          id
          name
          slug
          imageUrl
        }
        file {
          id
          url
          name
        }
      }
    }
  }
`;

type ExportRequestsQuery = {
  exportRequests: {
    offset: number;
    limit: number;
    totalCount: number;
    nodes: Array<{
      id: string;
      legacyId: number;
      name: string;
      type: ExportRequestType;
      status: ExportRequestStatus;
      progress?: number;
      error?: string;
      createdAt: string;
      updatedAt: string;
      expiresAt?: string;
      createdBy?: {
        id: string;
        name: string;
        slug: string;
        imageUrl: string;
      };
      file?: {
        id: string;
        url: string;
        name: string;
      };
    }>;
  };
};

type ExportRequestsQueryVariables = {
  account: { slug: string };
  type?: ExportRequestType;
  status?: ExportRequestStatus;
  limit: number;
  offset: number;
};

enum ExportRequestType {
  TRANSACTIONS = 'TRANSACTIONS',
  HOSTED_COLLECTIVES = 'HOSTED_COLLECTIVES',
}

enum ExportRequestStatus {
  ENQUEUED = 'ENQUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

const ExportTypeLabels = {
  [ExportRequestType.TRANSACTIONS]: defineMessage({ defaultMessage: 'Transactions', id: 'menu.transactions' }),
  [ExportRequestType.HOSTED_COLLECTIVES]: defineMessage({
    defaultMessage: 'Hosted Collectives',
    id: 'HostedCollectives',
  }),
};

const ExportStatusLabels = {
  [ExportRequestStatus.ENQUEUED]: defineMessage({ defaultMessage: 'Queued', id: 'ExportStatus.Enqueued' }),
  [ExportRequestStatus.PROCESSING]: defineMessage({ defaultMessage: 'Processing', id: 'ExportStatus.Processing' }),
  [ExportRequestStatus.COMPLETED]: defineMessage({ defaultMessage: 'Completed', id: 'ExportStatus.Completed' }),
  [ExportRequestStatus.FAILED]: defineMessage({ defaultMessage: 'Failed', id: 'ExportStatus.Failed' }),
};

const getStatusIcon = (status: ExportRequestStatus) => {
  switch (status) {
    case ExportRequestStatus.ENQUEUED:
      return Clock;
    case ExportRequestStatus.PROCESSING:
      return Loader2;
    case ExportRequestStatus.COMPLETED:
      return CheckCircle2;
    case ExportRequestStatus.FAILED:
      return AlertCircle;
    default:
      return FileText;
  }
};

const getStatusClassName = (status: ExportRequestStatus): string => {
  switch (status) {
    case ExportRequestStatus.ENQUEUED:
      return 'bg-slate-100 text-slate-800';
    case ExportRequestStatus.PROCESSING:
      return 'bg-blue-100 text-blue-800';
    case ExportRequestStatus.COMPLETED:
      return 'bg-green-100 text-green-800';
    case ExportRequestStatus.FAILED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const getColumns = ({ intl }) => {
  return [
    {
      accessorKey: 'name',
      header: intl.formatMessage({ defaultMessage: 'Name', id: 'Fields.name' }),
      cell: ({ row }) => {
        const exportRequest = row.original;
        return (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{exportRequest.name}</span>
              <span className="text-xs text-muted-foreground">
                {intl.formatMessage(ExportTypeLabels[exportRequest.type])}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: intl.formatMessage({ defaultMessage: 'Status', id: 'expense.status' }),
      cell: ({ row }) => {
        const exportRequest = row.original;
        const StatusIcon = getStatusIcon(exportRequest.status);
        const className = getStatusClassName(exportRequest.status);

        return (
          <Badge className={`gap-1 ${className}`}>
            <StatusIcon
              className={`h-3 w-3 ${exportRequest.status === ExportRequestStatus.PROCESSING ? 'animate-spin' : ''}`}
            />
            {intl.formatMessage(ExportStatusLabels[exportRequest.status])}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'progress',
      header: intl.formatMessage({ defaultMessage: 'Progress', id: 'Progress' }),
      cell: ({ row }) => {
        const exportRequest = row.original;
        if (exportRequest.status === ExportRequestStatus.PROCESSING && exportRequest.progress) {
          return (
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${exportRequest.progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{exportRequest.progress}%</span>
            </div>
          );
        }
        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: 'createdBy',
      header: intl.formatMessage({ defaultMessage: 'Created By', id: 'CreatedBy' }),
      cell: ({ row }) => {
        const exportRequest = row.original;
        if (!exportRequest.createdBy) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar collective={exportRequest.createdBy} size={24} />
            <span className="text-sm">{exportRequest.createdBy.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: intl.formatMessage({ defaultMessage: 'Created', id: 'expense.incurredAt' }),
      cell: ({ row }) => {
        const exportRequest = row.original;
        return (
          <div className="text-sm text-muted-foreground">{new Date(exportRequest.createdAt).toLocaleString()}</div>
        );
      },
    },
    actionsColumn,
  ];
};

const PAGE_SIZE = 20;

const typeFilter = {
  schema: z.nativeEnum(ExportRequestType).optional(),
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Type', id: 'expense.type' }),
    Component: ({ intl, value, onChange, ...props }) => (
      <ComboSelectFilter
        value={value}
        onChange={onChange}
        options={Object.values(ExportRequestType).map(value => ({
          label: intl.formatMessage(ExportTypeLabels[value]),
          value,
        }))}
        {...props}
      />
    ),
    valueRenderer: ({ intl, value }) => intl.formatMessage(ExportTypeLabels[value]),
  },
};

const statusFilter = {
  schema: z.nativeEnum(ExportRequestStatus).optional(),
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Status', id: 'expense.status' }),
    Component: ({ intl, value, onChange, ...props }) => (
      <ComboSelectFilter
        value={value}
        onChange={onChange}
        options={Object.values(ExportRequestStatus).map(value => ({
          label: intl.formatMessage(ExportStatusLabels[value]),
          value,
        }))}
        {...props}
      />
    ),
    valueRenderer: ({ intl, value }) => intl.formatMessage(ExportStatusLabels[value]),
  },
};

const schema = z.object({
  limit: integer.default(PAGE_SIZE),
  offset: integer.default(0),
  type: typeFilter.schema,
  status: statusFilter.schema,
});

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  type: typeFilter.filter,
  status: statusFilter.filter,
};

const Exports = ({ accountSlug }: DashboardSectionProps) => {
  const intl = useIntl();

  const views: Views<z.infer<typeof schema>> = [
    {
      id: 'all',
      label: intl.formatMessage({ defaultMessage: 'All', id: 'All' }),
      filter: {},
    },
    {
      id: 'pending',
      label: intl.formatMessage({ defaultMessage: 'Pending', id: 'eKEL/g' }),
      filter: {
        status: ExportRequestStatus.ENQUEUED,
      },
    },
    {
      id: 'processing',
      label: intl.formatMessage({ defaultMessage: 'Processing', id: 'ExportStatus.Processing' }),
      filter: {
        status: ExportRequestStatus.PROCESSING,
      },
    },
    {
      id: 'completed',
      label: intl.formatMessage({ defaultMessage: 'Completed', id: 'ExportStatus.Completed' }),
      filter: {
        status: ExportRequestStatus.COMPLETED,
      },
    },
    {
      id: 'failed',
      label: intl.formatMessage({ defaultMessage: 'Failed', id: 'ExportStatus.Failed' }),
      filter: {
        status: ExportRequestStatus.FAILED,
      },
    },
  ];

  const queryFilter = useQueryFilter({
    views,
    schema,
    filters,
  });

  const variables = queryFilter.variables as z.infer<typeof schema>;
  const {
    data,
    loading: queryLoading,
    error: queryError,
  } = useQuery<ExportRequestsQuery, ExportRequestsQueryVariables>(exportRequestsQuery, {
    variables: {
      account: { slug: accountSlug },
      limit: variables.limit,
      offset: variables.offset,
      type: variables.type,
      status: variables.status,
    },
    fetchPolicy: 'cache-and-network',
  });

  const exportRequests = data?.exportRequests?.nodes || [];
  const loading = queryLoading;
  const error = queryError;

  const getActions = React.useCallback(
    row => {
      const exportRequest = row.original;
      const primary = [];
      const secondary = [];

      if (exportRequest.status === ExportRequestStatus.COMPLETED && exportRequest.file) {
        primary.push({
          key: 'download',
          label: intl.formatMessage({ defaultMessage: 'Download', id: 'Download' }),
          Icon: Download,
          onClick: () => {
            window.open(exportRequest.file.url, '_blank');
          },
        });
      }

      if (exportRequest.status === ExportRequestStatus.FAILED && exportRequest.error) {
        secondary.push({
          key: 'view-error',
          label: intl.formatMessage({ defaultMessage: 'View Error', id: 'ViewError' }),
          Icon: AlertCircle,
          onClick: () => {
            alert(exportRequest.error);
          },
        });
      }

      return { primary, secondary };
    },
    [intl],
  );

  const columns = React.useMemo(() => getColumns({ intl }), [intl]);

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Exports" id="Exports" />}
        description={
          <FormattedMessage
            defaultMessage="Export your data for analysis and record-keeping. Large exports are processed in the background and you'll be notified when they're ready to download."
            id="Exports.Description"
          />
        }
      />
      <Filterbar {...queryFilter} />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && exportRequests.length === 0 ? (
        <EmptyResults hasFilters={queryFilter.hasFilters} onResetFilters={() => queryFilter.resetFilters({})} />
      ) : (
        <div className="flex flex-col gap-4">
          <DataTable
            loading={loading}
            columns={columns}
            data={exportRequests}
            nbPlaceholders={queryFilter.values?.limit || PAGE_SIZE}
            getActions={getActions}
            mobileTableView
          />
          <Pagination queryFilter={queryFilter} total={data?.exportRequests?.totalCount} />
        </div>
      )}
    </div>
  );
};

export default Exports;
