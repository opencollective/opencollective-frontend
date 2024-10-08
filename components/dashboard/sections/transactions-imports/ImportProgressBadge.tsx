import React from 'react';
import { isNil } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { Badge } from '../../../ui/Badge';

export const ImportProgressBadge = ({ progress }: { progress: number }) => {
  if (isNil(progress)) {
    return (
      <Badge type="neutral">
        <FormattedMessage defaultMessage="Not started" id="d5xXmT" />
      </Badge>
    );
  }
  const percent = Math.floor(progress * 100);
  return <Badge type={percent === 100 ? 'success' : 'neutral'}>{percent}%</Badge>;
};
