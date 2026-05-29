import { AlertCircle, CheckCircle2, Clock, FileText, Loader2, TimerOff } from 'lucide-react';
import { defineMessage } from 'react-intl';

import { ExportRequestStatus, ExportRequestType } from '@/lib/graphql/types/v2/graphql';

export const ExportTypeLabels = {
  [ExportRequestType.TRANSACTIONS]: defineMessage({ defaultMessage: 'Transactions', id: 'menu.transactions' }),
  [ExportRequestType.HOSTED_COLLECTIVES]: defineMessage({
    defaultMessage: 'Hosted Collectives',
    id: 'HostedCollectives',
  }),
};

export const ExportStatusLabels = {
  [ExportRequestStatus.ENQUEUED]: defineMessage({ defaultMessage: 'Queued', id: 'ExportStatus.Enqueued' }),
  [ExportRequestStatus.PROCESSING]: defineMessage({ defaultMessage: 'Processing', id: 'processing' }),
  [ExportRequestStatus.COMPLETED]: defineMessage({ defaultMessage: 'Completed', id: 'ExportStatus.Completed' }),
  [ExportRequestStatus.FAILED]: defineMessage({ defaultMessage: 'Failed', id: 'ExportStatus.Failed' }),
  [ExportRequestStatus.EXPIRED]: defineMessage({ defaultMessage: 'Expired', id: 'ExportStatus.Expired' }),
};

export const getStatusIcon = (status: ExportRequestStatus) => {
  switch (status) {
    case ExportRequestStatus.ENQUEUED:
      return Clock;
    case ExportRequestStatus.PROCESSING:
      return Loader2;
    case ExportRequestStatus.COMPLETED:
      return CheckCircle2;
    case ExportRequestStatus.FAILED:
      return AlertCircle;
    case ExportRequestStatus.EXPIRED:
      return TimerOff;
    default:
      return FileText;
  }
};

export const getStatusClassName = (status: ExportRequestStatus): string => {
  switch (status) {
    case ExportRequestStatus.ENQUEUED:
      return 'bg-slate-100 text-slate-800';
    case ExportRequestStatus.PROCESSING:
      return 'bg-blue-100 text-blue-800';
    case ExportRequestStatus.COMPLETED:
      return 'bg-green-100 text-green-800';
    case ExportRequestStatus.FAILED:
      return 'bg-red-100 text-red-800';
    case ExportRequestStatus.EXPIRED:
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};
