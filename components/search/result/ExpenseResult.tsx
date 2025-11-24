import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nExpenseType } from '../../../lib/i18n/expense';
import type { SearchExpenseFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import Avatar from '../../Avatar';
import { Badge } from '../../ui/Badge';
import { Highlight } from '../Highlight';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';

export function ExpenseResult({
  expense,
  highlights,
}: {
  expense: SearchExpenseFieldsFragment;
  highlights?: SearchHighlights;
}) {
  const intl = useIntl();
  const highlightFields = getHighlightsFields(highlights, ['description', 'id']);
  const otherHighlight = Object.values(highlightFields.others)[0]?.[0];
  return (
    <div className="flex flex-1 items-center gap-2">
      <Avatar collective={expense.account} size={36} />

      <div className="overflow-hidden">
        <div className="mb-1 flex gap-1">
          <Badge type="outline" size="xs">
            {highlightFields.top.id ? <Highlight content={`#${highlightFields.top.id[0]}`} /> : `#${expense.legacyId}`}
          </Badge>
          <div className="relative overflow-hidden font-medium">
            {highlightFields.top.description ? (
              <Highlight content={highlightFields.top.description[0]} className="truncate" />
            ) : (
              expense.description
            )}
          </div>
        </div>
        <div className="truncate text-muted-foreground">
          <FormattedMessage
            defaultMessage="{expenseType} from {payeeName} to {accountName}"
            id="uYdPRG"
            values={{
              expenseType: i18nExpenseType(intl, expense.type),
              accountName: <span className="text-foreground">{expense.account.name}</span>,
              payeeName: <span className="text-foreground">{expense.payee.name}</span>,
            }}
          />
        </div>
        {otherHighlight && (
          <div className="truncate">
            <Highlight className="text-muted-foreground italic" content={otherHighlight} />
          </div>
        )}
      </div>
    </div>
  );
}
