import { defineMessage } from 'react-intl';

import type { MissingInformationField } from '../graphql/types/v2/graphql';

const US_TAX_FORM_FOR_YEAR = defineMessage({ defaultMessage: 'US Tax Form for {year}', id: 'USTaxFormForYear' });

export const formatMissingInformation = (intl, field: MissingInformationField) => {
  switch (field) {
    case 'LEGAL_NAME':
      return intl.formatMessage({ defaultMessage: 'Legal name', id: 'OozR1Y' });
    case 'ADDRESS':
      return intl.formatMessage({ defaultMessage: 'Address', id: 'collective.address.label' });
    case 'US_TAX_FORM_CURRENT_YEAR':
      return intl.formatMessage(US_TAX_FORM_FOR_YEAR, { year: new Date().getUTCFullYear() });
    case 'US_TAX_FORM_PREVIOUS_YEAR':
      return intl.formatMessage(US_TAX_FORM_FOR_YEAR, { year: new Date().getUTCFullYear() - 1 });
    case 'COUNTRY_OF_INCORPORATION':
      return intl.formatMessage({ defaultMessage: 'Country of incorporation', id: 'TaxableCountry.incorporation' });
    default:
      return field;
  }
};
