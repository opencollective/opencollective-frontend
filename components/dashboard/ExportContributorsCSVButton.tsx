import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { fetchCSVFileFromRESTService } from '../../lib/api';
import { formatErrorMessage } from '@/lib/errors';

import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

type ExportContributorsCSVButtonProps = {
  accountSlug: string;
  label?: React.ReactNode;
};

const ExportContributorsCSVButton = ({ accountSlug, label }: ExportContributorsCSVButtonProps) => {
  const { toast } = useToast();
  const [isDownloadingCsv, setDownloadingCsv] = React.useState(false);
  const intl = useIntl();

  return (
    <Button
      size="sm"
      variant="outline"
      loading={isDownloadingCsv}
      onClick={async () => {
        try {
          setDownloadingCsv(true);
          const filename = `${accountSlug}-contributors`;
          const url = `${process.env.REST_URL}/v2/${accountSlug}/contributors.csv?fetchAll=1`;
          await fetchCSVFileFromRESTService(url, filename);
        } catch (error) {
          toast({
            variant: 'error',
            message: formatErrorMessage(intl, error),
          });
        } finally {
          setDownloadingCsv(false);
        }
      }}
    >
      {label || <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />}
    </Button>
  );
};

export default ExportContributorsCSVButton;
