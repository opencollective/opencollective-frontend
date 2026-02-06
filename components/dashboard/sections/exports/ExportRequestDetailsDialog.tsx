import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { AlertCircle, CheckCircle2, Clock, Download, FileText, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';

import type { CSVField } from '../../../../lib/export-csv/transactions-csv';
import { FieldLabels } from '../../../../lib/export-csv/transactions-csv';
import type { AccountReferenceInput, PaymentMethodType } from '../../../../lib/graphql/types/v2/schema';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { i18nTransactionKind, i18nTransactionType } from '../../../../lib/i18n/transaction';
import type { TransactionsTableQueryVariables } from '@/lib/graphql/types/v2/graphql';

import { PaymentMethodLabel } from '@/components/PaymentMethodLabel';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Badge } from '../../../ui/Badge';
import { Checkbox } from '../../../ui/Checkbox';
import { DataList, DataListItem } from '../../../ui/DataList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/Dialog';

const exportRequestFieldsFragment = gql`
  fragment ExportRequestDetailsFields on ExportRequest {
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

const exportRequestQuery = gql`
  query ExportRequestDetails($exportRequest: ExportRequestReferenceInput!) {
    exportRequest(exportRequest: $exportRequest) {
      ...ExportRequestDetailsFields
    }
  }
  ${exportRequestFieldsFragment}
`;

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

type ExportRequestQueryResult = {
  exportRequest: ExportRequestNode | null;
};

type ExportRequestQueryVariables = {
  exportRequest: { id: string };
};

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

type TransactionExportParameters = {
  isHostReport?: boolean;
  variables: Partial<TransactionsTableQueryVariables>;
  flattenTaxesAndPaymentProcessorFees?: boolean;
  useFieldNames?: boolean;
  fields?: string[];
};

const safeFormatArray = <T,>(value: T | T[], formatter?: (T) => string | ReactNode): string | ReactNode => {
  if (Array.isArray(value)) {
    return value.map(v => (formatter ? formatter(v) : v)).join(', ');
  }
  return formatter ? formatter(value) : (value as unknown as string);
};

const formatExportParameters = (
  exportType: ExportRequestType,
  parameters: Record<string, unknown> | undefined,
  intl: IntlShape,
): React.ReactNode => {
  if (!parameters || Object.keys(parameters).length === 0) {
    return null;
  }

  switch (exportType) {
    case ExportRequestType.TRANSACTIONS: {
      const params = parameters as TransactionExportParameters;
      const items: Array<{ label: string; value: React.ReactNode }> = [];

      if (params.useFieldNames) {
        items.push({
          label: intl.formatMessage({ defaultMessage: 'Use Field Names', id: 'C3eg9o' }),
          value: <Checkbox checked disabled />,
        });
      }

      if (params.flattenTaxesAndPaymentProcessorFees) {
        items.push({
          label: intl.formatMessage({ defaultMessage: 'Flatten Fees', id: 'ld+YLg' }),
          value: <Checkbox checked disabled />,
        });
      }

      // Add filters from variables
      if (params.variables) {
        const vars = params.variables;

        if (vars.dateFrom || vars.dateTo) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Date Range', id: 'DateRange' }),
            value: `${vars.dateFrom || '—'} to ${vars.dateTo || '—'}`,
          });
        }

        if (vars.clearedFrom || vars.clearedTo) {
          items.push({
            label: intl.formatMessage({ id: 'Gh3Obs', defaultMessage: 'Effective Date' }),
            value: `${vars.clearedFrom || '—'} to ${vars.clearedTo || '—'}`,
          });
        }

        if (vars.searchTerm) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Search', id: 'Search' }),
            value: vars.searchTerm,
          });
        }

        if (vars.kind) {
          items.push({
            label: intl.formatMessage({ id: 'Transaction.Kind', defaultMessage: 'Kind' }),
            value: safeFormatArray(vars.kind, k => i18nTransactionKind(intl, k)),
          });
        }

        if (vars.type) {
          items.push({
            label: intl.formatMessage({ id: 'Type', defaultMessage: 'Type' }),
            value: i18nTransactionType(intl, vars.type),
          });
        }

        if (vars.expenseType && vars.expenseType.length > 0) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Expense type', id: '9cwufA' }),
            value: safeFormatArray(vars.expenseType, et => i18nExpenseType(intl, et)),
          });
        }

        if (vars.paymentMethodService) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Payment Method', id: 'paymentmethod.label' }),
            value: safeFormatArray(vars.paymentMethodService, s => (
              <PaymentMethodLabel service={s} type={vars.paymentMethodType as PaymentMethodType} />
            )),
          });
        } else if (vars.paymentMethodType) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Payment Method Type', id: 'LxSEfN' }),
            value: vars.paymentMethodType,
          });
        }

        if (vars.account) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
            value: safeFormatArray(vars.account, (a: AccountReferenceInput) => a.slug),
          });
        }

        if (vars.excludeAccount) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Exclude Account', id: 'WS2dqR' }),
            value: safeFormatArray(vars.excludeAccount, (a: AccountReferenceInput) => a.slug),
          });
        }

        if (vars.merchantId) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Merchant ID', id: 'EvIfQD' }),
            value: vars.merchantId,
          });
        }

        if (vars.order) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Contribution ID', id: 'cVkF3C' }),
            value: vars.order.legacyId,
          });
        }

        if (vars.expense) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Expense ID', id: 'aJWAKv' }),
            value: vars.expense.legacyId,
          });
        }

        if (vars.amount) {
          const parts: string[] = [];
          if (vars.amount.gte && vars.amount.lte && vars.amount.gte.valueInCents === vars.amount.lte.valueInCents) {
            parts.push(`= ${(vars.amount.gte.valueInCents / 100).toFixed(2)}`);
          } else {
            if (vars.amount.gte) {
              parts.push(`≥ ${(vars.amount.gte.valueInCents / 100).toFixed(2)}`);
            }
            if (vars.amount.lte) {
              parts.push(`≤ ${(vars.amount.lte.valueInCents / 100).toFixed(2)}`);
            }
          }
          if (parts.length > 0) {
            items.push({
              label: intl.formatMessage({ defaultMessage: 'Amount', id: 'Fields.amount' }),
              value: parts.join(' '),
            });
          }
        }

        if (vars.isRefund !== undefined) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Is Refund', id: 'o+jEZR' }),
            value: <Checkbox checked={vars.isRefund} disabled />,
          });
        }

        if (vars.hasDebt !== undefined) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Has Debt', id: 'ihvDCr' }),
            value: <Checkbox checked={vars.hasDebt} disabled />,
          });
        }

        if (vars.accountingCategory && vars.accountingCategory.length > 0) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Accounting Category', id: 'ckcrQ7' }),
            value: safeFormatArray(vars.accountingCategory),
          });
        }

        if (vars.group && vars.group.length > 0) {
          items.push({
            label: intl.formatMessage({ defaultMessage: 'Group ID', id: 'nBKj/i' }),
            value: safeFormatArray(vars.group, g => g.substring(0, 8)),
          });
        }
      }

      // Add selected fields
      if (params.fields && params.fields.length > 0) {
        items.push({
          label: intl.formatMessage({ defaultMessage: 'Selected Fields', id: 'PtUUNb' }),
          value: (
            <div className="flex flex-wrap gap-1">
              {params.fields.map(field => (
                <span key={field} className="rounded-lg bg-slate-100 px-2 py-1 text-xs" title={field}>
                  {FieldLabels[field as CSVField] || field}
                </span>
              ))}
            </div>
          ),
        });
      }

      if (items.length === 0) {
        return null;
      }

      return (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              <span className="text-sm">{item.value}</span>
            </div>
          ))}
        </div>
      );
    }

    case ExportRequestType.HOSTED_COLLECTIVES:
      // Add formatting for hosted collectives when implemented
      return (
        <code className="block max-h-80 w-full overflow-auto rounded-md bg-slate-100 p-2 text-xs">
          <pre>{JSON.stringify(parameters, null, 2)}</pre>
        </code>
      );

    default:
      return (
        <code className="block max-h-80 w-full overflow-auto rounded-md bg-slate-100 p-2 text-xs">
          <pre>{JSON.stringify(parameters, null, 2)}</pre>
        </code>
      );
  }
};

type ExportRequestDetailsDialogProps = {
  exportRequestId: string | null;
  onClose: () => void;
};

export const ExportRequestDetailsDialog = ({ exportRequestId, onClose }: ExportRequestDetailsDialogProps) => {
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
                  className="sm:flex-col"
                  label={<FormattedMessage defaultMessage="Parameters" id="export.json.parameters.title" />}
                  labelClassName="basis-0"
                  itemClassName="w-full max-w-full "
                  value={formatExportParameters(exportRequest.type, exportRequest.parameters, intl)}
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
