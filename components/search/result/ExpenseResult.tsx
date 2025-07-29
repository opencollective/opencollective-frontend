import React from 'react';
import { Markup } from 'interweave';
import { useIntl } from 'react-intl';

import { ExpenseType } from '../../../lib/graphql/types/v2/schema';
import { i18nExpenseType } from '../../../lib/i18n/expense';

import Avatar from '../../Avatar';
import { Badge } from '../../ui/Badge';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';
import type { ExpenseResultData } from '../useRecentlyVisited';

// TODO i18n
export function ExpenseResult({ expense, highlights }: { expense: ExpenseResultData; highlights?: SearchHighlights }) {
  const intl = useIntl();
  const highlightFields = getHighlightsFields(highlights, ['description', 'id']);
  const otherHighlight = Object.values(highlightFields.others)[0]?.[0];
  return (
    <div className="flex flex-1 items-center gap-2">
      <Avatar collective={expense.account} size={36} />

      <div className="overflow-hidden">
        <div className="mb-1 flex gap-1">
          <Badge type="outline" size="xs">
            {highlightFields.top.id ? (
              <Markup allowList={['mark']} content={`#${highlightFields.top.id[0]}`} />
            ) : (
              `#${expense.legacyId}`
            )}
          </Badge>
          <div className="truncate font-medium">
            {highlightFields.top.description ? (
              <Markup allowList={['mark']} content={highlightFields.top.description[0]} />
            ) : (
              expense.description
            )}
          </div>
        </div>
        <div className="truncate text-muted-foreground">
          {expense.type !== ExpenseType.UNCLASSIFIED && i18nExpenseType(intl, expense.type)}
          {expense.type === ExpenseType.RECEIPT && ' request'} to{' '}
          <span className="text-foreground">{expense.account.name}</span> from{' '}
          <span className="text-foreground">{expense.payee.name}</span>
        </div>
        {otherHighlight && (
          <div className="truncate">
            <Markup className="text-muted-foreground italic" allowList={['mark']} content={otherHighlight} />
          </div>
        )}
      </div>
    </div>
  );
}
