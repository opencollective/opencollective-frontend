import React from 'react';
import { Download, FileX } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { Account, Host, LegalDocument, LegalDocumentRequestStatus } from '../../../../lib/graphql/types/v2/graphql';

import { DownloadLegalDocument } from '../../../legal-documents/DownloadLegalDocument';

import { InvalidateTaxFormModal } from './InvalidateTaxFormModal';

export const LegalDocumentActions = ({
  legalDocument,
  host,
  children,
  onInvalidateSuccess,
}: {
  legalDocument: LegalDocument;
  host: Host | Account;
  onInvalidateSuccess?: () => void;
  children: (props: { loading?: boolean; onClick: () => void; children: React.ReactNode }) => React.ReactNode;
}) => {
  const [confirmationModal, setConfirmationModal] = React.useState<'invalidate' | null>(null);
  const onInvalidateClick = React.useCallback(() => {
    setConfirmationModal('invalidate');
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
      {confirmationModal && (
        <InvalidateTaxFormModal
          open
          legalDocument={legalDocument}
          onOpenChange={() => setConfirmationModal(null)}
          host={host}
          onSuccess={onInvalidateSuccess}
        />
      )}
    </React.Fragment>
  );
};
