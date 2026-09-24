import React from 'react';

import { getTaxFormPDFServiceUrl } from '../../../../lib/url-helpers';

import FilesViewerModal from '../../../FilesViewerModal';

export const TaxFormPreviewModal = ({ type, values, onOpenChange }) => {
  const url = getTaxFormPDFServiceUrl(type, values, { isFinal: false });
  return (
    <FilesViewerModal
      onClose={() => onOpenChange(false)}
      canDownload={false}
      canOpenInNewWindow={false}
      files={[
        {
          name: `${type} Tax Form`,
          url: url.toString(),
        },
      ]}
    />
  );
};
