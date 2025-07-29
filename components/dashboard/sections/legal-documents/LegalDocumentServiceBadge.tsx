import React from 'react';
import { startCase } from 'lodash';

import type { LegalDocumentService } from '../../../../lib/graphql/types/v2/schema';

import { WebsiteName } from '../../../I18nFormatters';
import { Badge } from '../../../ui/Badge';

export const LegalDocumentServiceBadge = ({ service }: { service: LegalDocumentService }) => {
  return (
    <Badge className="text-nowrap whitespace-nowrap">
      {service === 'OPENCOLLECTIVE' ? WebsiteName : startCase(service.toLowerCase())}
    </Badge>
  );
};
