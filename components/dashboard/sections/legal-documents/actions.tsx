import { Download, FileX, Upload } from 'lucide-react';
import { useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import { downloadLegalDocument } from '../../../../lib/api';
import { formatErrorMessage } from '../../../../lib/errors';
import { useTwoFactorAuthenticationPrompt } from '../../../../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import type { LegalDocumentFieldsFragment } from '@/lib/graphql/types/v2/graphql';
import { Sentry } from '../../../../server/sentry';

import { useModal } from '../../../ModalContext';
import { useToast } from '../../../ui/useToast';

import { InvalidateTaxFormModal } from './InvalidateTaxFormModal';
import { UploadTaxFormModal } from './UploadTaxFormModal';

export function useLegalDocumentActions(
  host: { id: string },
  refetch: () => void,
  isUpgradeRequired: boolean,
): GetActions<LegalDocumentFieldsFragment> {
  const intl = useIntl();
  const { showModal } = useModal();
  const { toast } = useToast();
  const prompt2fa = useTwoFactorAuthenticationPrompt();

  const getActions: GetActions<LegalDocumentFieldsFragment> = (legalDocument: LegalDocumentFieldsFragment) => {
    const actions: ReturnType<GetActions<LegalDocumentFieldsFragment>> = { primary: [], secondary: [] };

    if (legalDocument.documentLink) {
      actions.primary.push({
        key: 'download-pdf',
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
        key: 'invalidate',
        label: intl.formatMessage({ defaultMessage: 'Invalidate', id: 'TaxForm.Invalidate' }),
        Icon: FileX,
        disabled: isUpgradeRequired,
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
        key: 'manual-upload',
        label: intl.formatMessage({ defaultMessage: 'Manual upload', id: 'TaxForm.ManualUpload' }),
        Icon: Upload,
        disabled: isUpgradeRequired,
        onClick: () => {
          showModal(UploadTaxFormModal, { legalDocument, host }, `upload-tax-form-${legalDocument.id}`);
        },
      });
    }

    return actions;
  };

  return getActions;
}
