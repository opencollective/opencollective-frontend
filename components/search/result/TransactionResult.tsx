import React from 'react';
import clsx from 'clsx';
import { Markup } from 'interweave';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useIntl } from 'react-intl';

import { i18nTransactionKind } from '../../../lib/i18n/transaction';

import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import { Badge } from '../../ui/Badge';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';
import type { TransactionResultData } from '../useRecentlyVisited';

// TODO: i18n
export function TransactionResult({
  transaction,
  highlights,
}: {
  transaction: TransactionResultData;
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
              {highlightFields.top.id ? (
                <Markup allowList={['mark']} content={`#${highlightFields.top.id[0]}`} />
              ) : (
                `#${transaction.legacyId}`
              )}
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
          <div className="truncate text-muted-foreground">
            <span className="text-foreground">{transaction.account.name}</span>{' '}
            {transaction.type === 'DEBIT' ? 'sent' : 'received'} transaction{' '}
            {transaction.type === 'DEBIT' ? 'to' : 'from'}{' '}
            <span className="text-foreground">{transaction.oppositeAccount.name}</span>
          </div>
        </div>

        {otherHighlight && (
          <div className="overflow-hidden">
            <div className="truncate">
              <Markup className="text-muted-foreground italic" allowList={['mark']} content={otherHighlight} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
