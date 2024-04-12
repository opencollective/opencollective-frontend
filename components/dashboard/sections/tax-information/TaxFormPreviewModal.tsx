import React from 'react';
import { useIntl } from 'react-intl';

import { getTaxFormPDFServiceUrl } from '../../../../lib/url-helpers';

import FilesViewerModal from '../../../FilesViewerModal';

export const TaxFormPreviewModal = ({ type, values, onOpenChange }) => {
  const intl = useIntl();
  const url = getTaxFormPDFServiceUrl(type, values, { isFinal: true });
  return (
    <FilesViewerModal
      onClose={() => onOpenChange(false)}
      canDownload={false}
      canOpenInNewWindow={false}
      files={[
        {
          name: intl.formatMessage({ defaultMessage: '{type} Tax Form', id: 'oWNtKa' }, { type }),
          url: url.toString(),
        },
      ]}
    />
  );
};
