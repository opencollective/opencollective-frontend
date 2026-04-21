import React from 'react';
import { startCase } from 'lodash';

import type { LegalDocumentService } from '../../../../lib/graphql/types/v2/graphql';

import { WebsiteName } from '../../../I18nFormatters';
import type { BadgeProps } from '../../../ui/Badge';
import { Badge } from '../../../ui/Badge';

export const LegalDocumentServiceBadge = ({ service, ...props }: { service: LegalDocumentService } & BadgeProps) => {
  return (
    <Badge className="text-nowrap whitespace-nowrap" {...props}>
      {service === 'OPENCOLLECTIVE' ? WebsiteName : startCase(service.toLowerCase())}
    </Badge>
  );
};
