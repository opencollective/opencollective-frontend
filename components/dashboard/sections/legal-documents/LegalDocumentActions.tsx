import React from 'react';
import { Download, FileX, Upload } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { downloadLegalDocument } from '../../../../lib/api';
import { formatErrorMessage } from '../../../../lib/errors';
import { Account, Host, LegalDocument, LegalDocumentRequestStatus } from '../../../../lib/graphql/types/v2/graphql';
import { useTwoFactorAuthenticationPrompt } from '../../../../lib/two-factor-authentication/TwoFactorAuthenticationContext';

import { useToast } from '../../../ui/useToast';

import { InvalidateTaxFormModal } from './InvalidateTaxFormModal';
import { UploadTaxFormModal } from './UploadTaxFormModal';

export const LegalDocumentActions = ({
  legalDocument,
  host,
  children,
  onInvalidateSuccess,
  onUploadSuccess,
}: {
  legalDocument: LegalDocument;
  host: Host | Account;
  onInvalidateSuccess?: () => void;
  onUploadSuccess?: () => void;
  children: (props: { loading?: boolean; onClick: () => void; children: React.ReactNode }) => React.ReactNode;
}) => {
  const intl = useIntl();
  const prompt2fa = useTwoFactorAuthenticationPrompt();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [confirmationModal, setConfirmationModal] = React.useState<'invalidate' | 'manual-upload' | null>(null);
  const { toast } = useToast();

  // Callbacks
  const onDownloadClick = React.useCallback(async () => {
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

  const onInvalidateClick = React.useCallback(() => {
    setConfirmationModal('invalidate');
  }, []);

  const onManualUploadClick = React.useCallback(() => {
    setConfirmationModal('manual-upload');
  }, []);

  return (
    <React.Fragment>
      {legalDocument.documentLink &&
        children({
          loading: isDownloading,
          onClick: onDownloadClick,
          children: (
            <React.Fragment>
              <Download size={16} />
              <FormattedMessage id="n+rgej" defaultMessage="Download {format}" values={{ format: 'PDF' }} />
            </React.Fragment>
          ),
        })}
      {legalDocument.status === LegalDocumentRequestStatus.RECEIVED &&
        children({
          onClick: onInvalidateClick,
          children: (
            <React.Fragment>
              <FileX size={16} />
              <FormattedMessage defaultMessage="Invalidate" id="TaxForm.Invalidate" />
            </React.Fragment>
          ),
        })}
      {[LegalDocumentRequestStatus.REQUESTED, LegalDocumentRequestStatus.ERROR].includes(legalDocument.status) &&
        children({
          onClick: onManualUploadClick,
          children: (
            <React.Fragment>
              <Upload size={16} />
              <FormattedMessage defaultMessage="Manual upload" id="TaxForm.ManualUpload" />
            </React.Fragment>
          ),
        })}
      {confirmationModal === 'invalidate' ? (
        <InvalidateTaxFormModal
          open
          legalDocument={legalDocument}
          onOpenChange={() => setConfirmationModal(null)}
          host={host}
          onSuccess={onInvalidateSuccess}
        />
      ) : confirmationModal === 'manual-upload' ? (
        <UploadTaxFormModal
          open
          legalDocument={legalDocument}
          onOpenChange={() => setConfirmationModal(null)}
          host={host}
          onSuccess={onUploadSuccess}
        />
      ) : null}
    </React.Fragment>
  );
};
