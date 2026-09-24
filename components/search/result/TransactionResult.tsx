import React from 'react';
import { clsx } from 'clsx';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { useIntl } from 'react-intl';

import { i18nTransactionKind } from '../../../lib/i18n/transaction';
import type { SearchTransactionFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import { Badge } from '../../ui/Badge';
import { Highlight } from '../Highlight';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';

export function TransactionResult({
  transaction,
  highlights,
}: {
  transaction: SearchTransactionFieldsFragment;
  highlights?: SearchHighlights;
}) {
  const intl = useIntl();
  const highlightFields = getHighlightsFields(highlights, ['id']);
  const otherHighlight = Object.values(highlightFields.others)[0]?.[0];
  return (
    <div className="flex flex-1 items-center gap-2">
      <div
        className={clsx(
          'flex size-9 shrink-0 items-center justify-center rounded-md',
          transaction.type === 'DEBIT' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600',
        )}
      >
        {transaction.type === 'DEBIT' ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
      </div>
      <div className="w-full min-w-0 overflow-hidden">
        <div className="flex justify-between gap-2">
          <div className="flex gap-1">
            <Badge type="outline" size="xs">
              <Highlight content={`#${highlightFields.top.id?.[0] ?? transaction.legacyId}`} />
            </Badge>
            <div>{i18nTransactionKind(intl, transaction.kind)}</div>
          </div>
          <span className="font-medium text-foreground">
            <FormattedMoneyAmount
              amount={transaction.netAmount.valueInCents}
              currency={transaction.netAmount.currency}
              showCurrencyCode={false}
            />
          </span>
        </div>

        <div className="overflow-hidden">
          <div className="flex items-center gap-2 truncate text-muted-foreground">
            <span className="text-foreground">{transaction.account.name}</span>
            {transaction.type === 'DEBIT' ? (
              <ArrowRight className="!size-4" />
            ) : (
              <ArrowLeft className="!size-4 text-green-600" />
            )}
            <span className="text-foreground">{transaction.oppositeAccount.name}</span>
          </div>
          {otherHighlight && (
            <div className="truncate">
              <Highlight className="text-muted-foreground italic" content={otherHighlight} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
