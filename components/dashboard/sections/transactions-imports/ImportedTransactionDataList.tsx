import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { filterRawValueEntries, removeEmptyValues } from './lib/import-row-data';
import type { getMatchInfo } from './lib/match';
import type { TransactionsImport, TransactionsImportRow } from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

import DateTime from '@/components/DateTime';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';

import { Button } from '../../../ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/Collapsible';
import { DataList, DataListItem, NestedObjectDataListItem } from '../../../ui/DataList';
import { Separator } from '../../../ui/Separator';

import { MatchBadge } from './MatchBadge';

export const ImportedTransactionDataList = ({
  matchInfo,
  row,
  transactionsImport,
  collapsible,
  hideBasics,
}: {
  matchInfo?: ReturnType<typeof getMatchInfo>;
  row: Pick<TransactionsImportRow, 'amount' | 'date' | 'description' | 'rawValue' | 'sourceId'>;
  transactionsImport: Pick<TransactionsImport, 'id' | 'source' | 'csvConfig'>;
  collapsible?: boolean;
  hideBasics?: boolean;
}) => {
  const [hasViewMore, setHasViewMore] = React.useState(false);
  return (
    <Collapsible open={hasViewMore || !collapsible}>
      <DataList className={cn('rounded bg-slate-50 p-4', collapsible && 'pb-1')}>
        {!hideBasics && (
          <React.Fragment>
            <DataListItem
              label={<FormattedMessage id="Fields.amount" defaultMessage="Amount" />}
              labelClassName="basis-1/3 min-w-auto max-w-auto"
              value={
                <MatchBadge hasMatch={matchInfo?.amount}>
                  <FormattedMoneyAmount amount={row.amount.valueInCents} currency={row.amount.currency} />
                </MatchBadge>
              }
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="Date" id="expense.incurredAt" />}
              labelClassName="basis-1/3 min-w-auto max-w-auto"
              value={
                <MatchBadge hasMatch={matchInfo?.date}>
                  <DateTime value={row.date} />
                </MatchBadge>
              }
            />
            <DataListItem
              label={<FormattedMessage id="AddFundsModal.source" defaultMessage="Source" />}
              value={transactionsImport.source}
              itemClassName="truncate max-w-full"
              labelClassName="basis-1/3 min-w-auto max-w-auto"
              showValueAsItemTitle
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="Transaction ID" id="oK0S4l" />}
              value={row.sourceId}
              itemClassName="truncate max-w-full"
              labelClassName="basis-1/3 min-w-auto max-w-auto"
              showValueAsItemTitle
            />
            <DataListItem
              label={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
              value={row.description}
              labelClassName="basis-1/3 min-w-auto max-w-auto"
              showValueAsItemTitle
            />
          </React.Fragment>
        )}

        <CollapsibleContent className="flex flex-col gap-2">
          {Object.entries(row.rawValue as Record<string, string>)
            .map(entry => removeEmptyValues(entry))
            .filter(entry => filterRawValueEntries(entry, transactionsImport.csvConfig))
            .map(([key, value]) => (
              <NestedObjectDataListItem
                key={key}
                label={key}
                itemClassName="truncate max-w-full"
                labelClassName="basis-1/3 min-w-auto max-w-auto"
                value={value as object | React.ReactNode}
                showValueAsItemTitle
              />
            ))}
        </CollapsibleContent>

        {Boolean(collapsible) && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <Separator />
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full text-xs font-normal"
                onClick={() => {
                  setHasViewMore(!hasViewMore);
                }}
              >
                {hasViewMore ? (
                  <React.Fragment>
                    <FormattedMessage defaultMessage="View less" id="EVFai9" />
                    <ChevronUp size={16} />
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <FormattedMessage defaultMessage="View more" id="34Up+l" />
                    <ChevronDown size={16} />
                  </React.Fragment>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        )}
      </DataList>
    </Collapsible>
  );
};
