import React from 'react';
import { useIntl } from 'react-intl';

import FilesViewerModal from '../../../FilesViewerModal';

import { getTaxFormPreviewUrl } from './TaxFormPreview';

export const TaxFormPreviewModal = ({ type, values, onOpenChange }) => {
  const intl = useIntl();
  const url = getTaxFormPreviewUrl(type, values);
  return (
    <FilesViewerModal
      onClose={() => onOpenChange(false)}
      files={[
        {
          name: intl.formatMessage({ defaultMessage: '{type} Tax Form' }, { type }),
          url: url.toString(),
        },
      ]}
    />
  );
};
