import { Download, FileX, Upload } from 'lucide-react';
import { useIntl } from 'react-intl';

import { GetActions } from '../../../../lib/actions/types';
import { downloadLegalDocument } from '../../../../lib/api';
import { formatErrorMessage } from '../../../../lib/errors';
import { Host, LegalDocument } from '../../../../lib/graphql/types/v2/graphql';
import { useTwoFactorAuthenticationPrompt } from '../../../../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import { Sentry } from '../../../../server/sentry';

import { useModal } from '../../../ModalContext';
import { useToast } from '../../../ui/useToast';

import { InvalidateTaxFormModal } from './InvalidateTaxFormModal';
import { UploadTaxFormModal } from './UploadTaxFormModal';

export function useLegalDocumentActions(host: Host, refetch: () => void): GetActions<LegalDocument> {
  const intl = useIntl();
  const { showModal } = useModal();
  const { toast } = useToast();
  const prompt2fa = useTwoFactorAuthenticationPrompt();

  const getActions: GetActions<LegalDocument> = (legalDocument: LegalDocument) => {
    const actions: ReturnType<GetActions<LegalDocument>> = { primary: [], secondary: [] };

    if (legalDocument.documentLink) {
      actions.primary.push({
        label: intl.formatMessage({ defaultMessage: 'Download {format}', id: 'n+rgej' }, { format: 'PDF' }),
        Icon: Download,
        onClick: async () => {
          try {
            await downloadLegalDocument(legalDocument, legalDocument.account, prompt2fa);
          } catch (e) {
            Sentry.captureException(e);
            toast({
              variant: 'error',
              title: intl.formatMessage({ defaultMessage: 'Failed to download PDF', id: 'RTUzqh' }),
              message: formatErrorMessage(intl, e),
            });
          }
        },
      });
    }

    if (legalDocument.status === 'RECEIVED' && !legalDocument.isExpired) {
      actions.primary.push({
        label: intl.formatMessage({ defaultMessage: 'Invalidate', id: 'TaxForm.Invalidate' }),
        Icon: FileX,
        onClick: () => {
          showModal(
            InvalidateTaxFormModal,
            { legalDocument, host, onSuccess: refetch },
            `invalidate-tax-form-${legalDocument.id}`,
          );
        },
      });
    } else if (['REQUESTED', 'ERROR'].includes(legalDocument.status)) {
      actions.primary.push({
        label: intl.formatMessage({ defaultMessage: 'Manual upload', id: 'TaxForm.ManualUpload' }),
        Icon: Upload,
        onClick: () => {
          showModal(UploadTaxFormModal, { legalDocument, host }, `upload-tax-form-${legalDocument.id}`);
        },
      });
    }

    return actions;
  };

  return getActions;
}
