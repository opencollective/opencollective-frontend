import React from 'react';
import { useIntl } from 'react-intl';

import { downloadLegalDocument } from '../../../../lib/api';
import { formatErrorMessage } from '../../../../lib/errors';
import { LegalDocument } from '../../../../lib/graphql/types/v2/graphql';
import { useTwoFactorAuthenticationPrompt } from '../../../../lib/two-factor-authentication/TwoFactorAuthenticationContext';

import { useToast } from '../../../ui/useToast';

export const DownloadLegalDocument = ({
  children,
  legalDocument,
}: {
  legalDocument: LegalDocument;
  children: (props: { download: () => Promise<void>; isDownloading: boolean }) => React.ReactNode;
}) => {
  const intl = useIntl();
  const prompt2fa = useTwoFactorAuthenticationPrompt();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const { toast } = useToast();
  const download = React.useCallback(async () => {
    setIsDownloading(true);
    try {
      await downloadLegalDocument(legalDocument, legalDocument.account, prompt2fa);
    } catch (e) {
      toast({
        variant: 'error',
        title: intl.formatMessage({ defaultMessage: 'Failed to download PDF', id: 'RTUzqh' }),
        message: formatErrorMessage(intl, e),
      });
    } finally {
      setIsDownloading(false);
    }
  }, [legalDocument, prompt2fa, toast, intl]);

  return children({ download, isDownloading });
};
