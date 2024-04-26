import React from 'react';
import { Download, FileX } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { downloadLegalDocument } from '../../../../lib/api';
import { formatErrorMessage } from '../../../../lib/errors';
import { Account, Host, LegalDocument, LegalDocumentRequestStatus } from '../../../../lib/graphql/types/v2/graphql';
import { useTwoFactorAuthenticationPrompt } from '../../../../lib/two-factor-authentication/TwoFactorAuthenticationContext';

import { useToast } from '../../../ui/useToast';

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
  const intl = useIntl();
  const prompt2fa = useTwoFactorAuthenticationPrompt();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [confirmationModal, setConfirmationModal] = React.useState<'invalidate' | null>(null);
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
