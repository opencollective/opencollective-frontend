import React from 'react';
import { Download, FileX, Upload } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { Account, Host, LegalDocument, LegalDocumentRequestStatus } from '../../../../lib/graphql/types/v2/graphql';

import { DownloadLegalDocument } from '../../../legal-documents/DownloadLegalDocument';

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
  const [confirmationModal, setConfirmationModal] = React.useState<'invalidate' | 'manual-upload' | null>(null);

  // Callbacks
  const onInvalidateClick = React.useCallback(() => {
    setConfirmationModal('invalidate');
  }, []);

  const onManualUploadClick = React.useCallback(() => {
    setConfirmationModal('manual-upload');
  }, []);

  return (
    <React.Fragment>
      {legalDocument.documentLink && (
        <DownloadLegalDocument legalDocument={legalDocument} account={legalDocument.account}>
          {({ download, isDownloading }) =>
            children({
              loading: isDownloading,
              onClick: download,
              children: (
                <React.Fragment>
                  <Download size={16} />
                  <FormattedMessage id="n+rgej" defaultMessage="Download {format}" values={{ format: 'PDF' }} />
                </React.Fragment>
              ),
            })
          }
        </DownloadLegalDocument>
      )}

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
