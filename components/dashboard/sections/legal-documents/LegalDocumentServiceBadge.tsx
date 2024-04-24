import React from 'react';
import { startCase } from 'lodash';

import { LegalDocumentService } from '../../../../lib/graphql/types/v2/graphql';

import { WebsiteName } from '../../../I18nFormatters';
import { Badge } from '../../../ui/Badge';

export const LegalDocumentServiceBadge = ({ service }: { service: LegalDocumentService }) => {
  return (
    <Badge className="whitespace-nowrap text-nowrap">
      {service === 'OPENCOLLECTIVE' ? WebsiteName : startCase(service.toLowerCase())}
    </Badge>
  );
};
