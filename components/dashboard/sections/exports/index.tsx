import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Download, FileText, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '@/lib/errors';
import { formatFileSize } from '@/lib/file-utils';
import type { FilterComponentConfigs, Views } from '@/lib/filters/filter-types';
import { integer } from '@/lib/filters/schemas';
import type { ExportRequestsQuery, ExportRequestsQueryVariables } from '@/lib/graphql/types/v2/graphql';
import { ExportRequestStatus, ExportRequestType } from '@/lib/graphql/types/v2/schema';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import Avatar from '../../../Avatar';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { useModal } from '../../../ModalContext';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';
import { useToast } from '../../../ui/useToast';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';
import { makePushSubpath } from '../../utils';

import { ExportStatusLabels, ExportTypeLabels, getStatusClassName, getStatusIcon } from './constants';
import { ExportRequestDetailsDrawer } from './ExportRequestDetailsDrawer';

type ExportRequestNode = NonNullable<ExportRequestsQuery['exportRequests']>['nodes'][number];

const exportRequestFieldsFragment = gql`
  fragment ExportRequestFields on ExportRequest {
    id
    legacyId
    name
    type
    status
    progress
    error
    parameters
    createdAt
    updatedAt
    expiresAt
    createdBy {
      id
      name
      type
      slug
      imageUrl
    }
    file {
      id
      url
      name
      size
    }
  }
`;

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
        ...ExportRequestFields
      }
    }
  }
  ${exportRequestFieldsFragment}
`;

const removeExportRequestMutation = gql`
  mutation RemoveExportRequest($exportRequest: ExportRequestReferenceInput!) {
    removeExportRequest(exportRequest: $exportRequest) {
      id
    }
  }
`;

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

        const badge = (
          <Badge className={`gap-1 ${className}`}>
            <StatusIcon
              className={`h-3 w-3 ${exportRequest.status === ExportRequestStatus.PROCESSING ? 'animate-spin' : ''}`}
            />
            {intl.formatMessage(ExportStatusLabels[exportRequest.status])}
          </Badge>
        );

        if (exportRequest.status === ExportRequestStatus.FAILED && exportRequest.error) {
          return (
            <Tooltip>
              <TooltipTrigger>{badge}</TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{exportRequest.error}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return badge;
      },
    },
    {
      accessorKey: 'fileSize',
      header: intl.formatMessage({ defaultMessage: 'File Size', id: 'FileSize' }),
      cell: ({ row }) => {
        const exportRequest = row.original;
        if (exportRequest.file?.size) {
          return <span className="text-sm">{formatFileSize(exportRequest.file.size)}</span>;
        }
        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: 'createdBy',
      header: intl.formatMessage({ defaultMessage: 'Requested By', id: 'RequestedBy' }),
      cell: ({ row }) => {
        const exportRequest = row.original;
        if (!exportRequest.createdBy) {
          return <span className="text-muted-foreground">—</span>;
        }
        return <Avatar collective={exportRequest.createdBy} size={24} />;
      },
    },
    {
      accessorKey: 'createdAt',
      header: intl.formatMessage({ defaultMessage: 'Date', id: 'expense.incurredAt' }),
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

const Exports = ({ accountSlug, subpath }: DashboardSectionProps) => {
  const intl = useIntl();
  const router = useRouter();
  const { toast } = useToast();
  const { showConfirmationModal } = useModal();
  const selectedExportRequestId = subpath?.[0] || null;
  const pushSubpath = React.useMemo(() => makePushSubpath(router), [router]);
  const [removeExportRequest] = useMutation(removeExportRequestMutation);

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
      label: intl.formatMessage({
        defaultMessage: 'Processing',
        id: 'processing',
      }),
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
    pollInterval: 5000, // Poll every 5 seconds to update the status of export requests
    fetchPolicy: 'cache-and-network',
  });

  const exportRequests = data?.exportRequests?.nodes || [];
  const loading = queryLoading;
  const error = queryError;

  const handleRemove = React.useCallback(
    (exportRequest: ExportRequestNode) => {
      showConfirmationModal({
        title: intl.formatMessage({ defaultMessage: 'Delete Export', id: 'ExportRequest.Delete.Title' }),
        description: intl.formatMessage({
          defaultMessage: 'Are you sure you want to delete this export? This action cannot be undone.',
          id: 'ExportRequest.Delete.Description',
        }),
        confirmLabel: intl.formatMessage({ defaultMessage: 'Delete', id: 'actions.delete' }),
        variant: 'destructive',
        onConfirm: async () => {
          try {
            await removeExportRequest({
              variables: { exportRequest: { id: exportRequest.id } },
              refetchQueries: [exportRequestsQuery],
              awaitRefetchQueries: true,
            });
            toast({
              variant: 'success',
              message: intl.formatMessage({ defaultMessage: 'Export deleted', id: 'ExportRequest.Deleted' }),
            });
          } catch (e) {
            toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
          }
        },
      });
    },
    [intl, removeExportRequest, showConfirmationModal, toast],
  );

  const getActions = React.useCallback(
    (exportRequest: ExportRequestNode) => {
      const primary = [];
      const secondary = [];

      if (exportRequest?.status === ExportRequestStatus.COMPLETED && exportRequest.file) {
        primary.push({
          key: 'download',
          label: intl.formatMessage({ defaultMessage: 'Download', id: 'Download' }),
          Icon: Download,
          onClick: () => {
            window.open(exportRequest.file.url, '_blank');
          },
        });
      }

      secondary.push({
        key: 'delete',
        label: intl.formatMessage({ defaultMessage: 'Delete', id: 'actions.delete' }),
        Icon: Trash2,
        variant: 'danger',
        onClick: () => handleRemove(exportRequest),
      });

      return { primary, secondary };
    },
    [intl, handleRemove],
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
            onClickRow={row => pushSubpath(row.original.id)}
            mobileTableView
          />
          <Pagination queryFilter={queryFilter} total={data?.exportRequests?.totalCount} />
        </div>
      )}

      <ExportRequestDetailsDrawer
        exportRequestId={selectedExportRequestId}
        onClose={() => pushSubpath('')}
        onDelete={exportRequest => {
          handleRemove(exportRequest);
          pushSubpath('');
        }}
      />
    </div>
  );
};

export default Exports;
