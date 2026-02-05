import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { AlertCircle, CheckCircle2, Clock, Download, FileText, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '@/lib/errors';
import type { FilterComponentConfigs, Views } from '@/lib/filters/filter-types';
import { integer } from '@/lib/filters/schemas';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { useModal } from '../../../ModalContext';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { DataList, DataListItem } from '../../../ui/DataList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';
import { useToast } from '../../../ui/useToast';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';
import { makePushSubpath } from '../../utils';

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

const exportRequestQuery = gql`
  query ExportRequest($exportRequest: ExportRequestReferenceInput!) {
    exportRequest(exportRequest: $exportRequest) {
      ...ExportRequestFields
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

type ExportRequestNode = {
  id: string;
  legacyId: number;
  name: string;
  type: ExportRequestType;
  status: ExportRequestStatus;
  progress?: number;
  error?: string;
  parameters?: Record<string, unknown>;
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
    size: number;
  };
};

type ExportRequestsQuery = {
  exportRequests: {
    offset: number;
    limit: number;
    totalCount: number;
    nodes: Array<ExportRequestNode>;
  };
};

type ExportRequestsQueryVariables = {
  account: { slug: string };
  type?: ExportRequestType;
  status?: ExportRequestStatus;
  limit: number;
  offset: number;
};

type ExportRequestQueryResult = {
  exportRequest: ExportRequestNode | null;
};

type ExportRequestQueryVariables = {
  exportRequest: { id: string };
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
  [ExportRequestStatus.PROCESSING]: defineMessage({ defaultMessage: 'Processing', id: 'processing' }),
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

const formatBytes = (bytes: number): string => {
  if (bytes === null || bytes === undefined) {
    return '—';
  } else if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

type ExportRequestDetailsDialogProps = {
  exportRequestId: string | null;
  onClose: () => void;
};

const ExportRequestDetailsDialog = ({ exportRequestId, onClose }: ExportRequestDetailsDialogProps) => {
  const intl = useIntl();

  const { data, loading, error } = useQuery<ExportRequestQueryResult, ExportRequestQueryVariables>(exportRequestQuery, {
    variables: { exportRequest: { id: exportRequestId } },
    skip: !exportRequestId,
    fetchPolicy: 'cache-and-network',
  });

  const exportRequest = data?.exportRequest;

  if (!exportRequestId) {
    return null;
  }

  const StatusIcon = exportRequest ? getStatusIcon(exportRequest.status) : null;
  const statusClassName = exportRequest ? getStatusClassName(exportRequest.status) : '';

  return (
    <Dialog open={!!exportRequestId} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Export Details" id="ExportDetails" />
          </DialogTitle>
        </DialogHeader>

        {loading && !exportRequest ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <MessageBoxGraphqlError error={error} />
        ) : exportRequest ? (
          <React.Fragment>
            <DataList className="gap-4">
              <DataListItem
                label={<FormattedMessage defaultMessage="Name" id="Fields.name" />}
                value={
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{exportRequest.name}</span>
                  </div>
                }
              />

              <DataListItem
                label={<FormattedMessage defaultMessage="Type" id="expense.type" />}
                value={intl.formatMessage(ExportTypeLabels[exportRequest.type])}
              />

              <DataListItem
                label={<FormattedMessage defaultMessage="Status" id="expense.status" />}
                value={
                  <Badge className={`gap-1 ${statusClassName}`}>
                    <StatusIcon
                      className={`h-3 w-3 ${exportRequest.status === ExportRequestStatus.PROCESSING ? 'animate-spin' : ''}`}
                    />
                    {intl.formatMessage(ExportStatusLabels[exportRequest.status])}
                  </Badge>
                }
              />

              {exportRequest.status === ExportRequestStatus.FAILED && exportRequest.error && (
                <DataListItem
                  label={<FormattedMessage defaultMessage="Error" id="Error" />}
                  value={<span className="text-red-600">{exportRequest.error}</span>}
                />
              )}

              {exportRequest.file && (
                <React.Fragment>
                  <DataListItem
                    label={<FormattedMessage defaultMessage="File Name" id="FileName" />}
                    value={exportRequest.file.name}
                  />
                  <DataListItem
                    label={<FormattedMessage defaultMessage="File Size" id="FileSize" />}
                    value={formatBytes(exportRequest.file.size)}
                  />
                </React.Fragment>
              )}

              {exportRequest.createdBy && (
                <DataListItem
                  label={<FormattedMessage defaultMessage="Requested By" id="RequestedBy" />}
                  value={
                    <div className="flex items-center gap-2">
                      <Avatar collective={exportRequest.createdBy} size={24} />
                      <span>{exportRequest.createdBy.name}</span>
                    </div>
                  }
                />
              )}

              <DataListItem
                label={<FormattedMessage defaultMessage="Date" id="expense.incurredAt" />}
                value={<DateTime value={exportRequest.createdAt} dateStyle="medium" timeStyle="short" />}
              />

              <DataListItem
                label={<FormattedMessage defaultMessage="Last Updated" id="LastUpdated" />}
                value={<DateTime value={exportRequest.updatedAt} dateStyle="medium" timeStyle="short" />}
              />

              {exportRequest.expiresAt && (
                <DataListItem
                  label={<FormattedMessage defaultMessage="Expires" id="Agreement.expiresAt" />}
                  value={<DateTime value={exportRequest.expiresAt} dateStyle="medium" timeStyle="short" />}
                />
              )}

              {exportRequest.parameters && Object.keys(exportRequest.parameters).length > 0 && (
                <DataListItem
                  label={<FormattedMessage defaultMessage="Parameters" id="export.json.parameters.title" />}
                  itemClassName="w-full max-w-full"
                  value={
                    <code className="block max-h-80 w-full overflow-auto rounded-md bg-slate-100 p-2 text-xs">
                      <pre>{JSON.stringify(exportRequest.parameters, null, 2)}</pre>
                    </code>
                  }
                />
              )}
            </DataList>

            {exportRequest.status === ExportRequestStatus.COMPLETED && exportRequest.file && (
              <div className="mt-4 flex justify-end">
                <a
                  href={exportRequest.file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  <FormattedMessage defaultMessage="Download" id="Download" />
                </a>
              </div>
            )}
          </React.Fragment>
        ) : null}
      </DialogContent>
    </Dialog>
  );
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
          return <span className="text-sm">{formatBytes(exportRequest.file.size)}</span>;
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

      <ExportRequestDetailsDialog exportRequestId={selectedExportRequestId} onClose={() => pushSubpath('')} />
    </div>
  );
};

export default Exports;
