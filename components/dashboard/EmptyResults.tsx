import React from 'react';
import { RotateCcw } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import Image from '../Image';
import { Button } from '../ui/Button';

export function EmptyResults({
  onResetFilters,
  hasFilters,
  entityType,
}: {
  onResetFilters: (e) => void;
  hasFilters: boolean;
  entityType?:
    | 'EXPENSES'
    | 'CONTRIBUTIONS'
    | 'AGREEMENTS'
    | 'COLLECTIVES'
    | 'HOST_APPLICATIONS'
    | 'VIRTUAL_CARDS'
    | 'VIRTUAL_CARD_REQUESTS'
    | 'TAX_FORM'
    | 'TRANSACTIONS';
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 sm:py-12" data-cy="zero-results-message">
      <div className="relative flex items-center justify-center rounded-full ">
        <div className={'absolute inset-0 m-2 rounded-full bg-slate-50'} />
        <Image
          alt="No results found illustration with a magnifying glass."
          className="z-10 h-32 w-32 sm:h-40 sm:w-40"
          src="/static/images/no-results.png"
          height={160}
          width={160}
        />
      </div>
      <h3 className="text-2xl text-foreground">
        {hasFilters ? (
          <FormattedMessage
            id="filter.NoMatchingResults"
            defaultMessage="No matching {type, select, EXPENSES {expenses} CONTRIBUTIONS {contributions} VIRTUAL_CARDS {virtual cards} VIRTUAL_CARD_REQUESTS {virtual card requests} TRANSACTIONS {transactions} AGREEMENTS {agreements} COLLECTIVES {collectives} HOST_APPLICATIONS {host applications} TAX_FORM {tax forms} other {results}}"
            values={{ type: entityType }}
          />
        ) : (
          <FormattedMessage
            id="filter.NoResults"
            defaultMessage="No {type, select, EXPENSES {expenses} CONTRIBUTIONS {contributions} VIRTUAL_CARDS {virtual cards} VIRTUAL_CARD_REQUESTS {virtual card requests} TRANSACTIONS {transactions} AGREEMENTS {agreements} COLLECTIVES {collectives} HOST_APPLICATIONS {host applications} TAX_FORM {tax forms} other {results}}"
            values={{ type: entityType }}
          />
        )}
      </h3>

      {hasFilters && (
        <React.Fragment>
          <p className="text-balance text-center text-muted-foreground">
            <FormattedMessage
              id="filter.NoMatchingResults.subtitle"
              defaultMessage="We can't find any {type, select, EXPENSES {expenses} CONTRIBUTIONS {contributions} VIRTUAL_CARDS {virtual cards} VIRTUAL_CARD_REQUESTS {virtual card requests} TRANSACTIONS {transactions} AGREEMENTS {agreements} COLLECTIVES {collectives} HOST_APPLICATIONS {host applications} other {results}} matching the given filters."
              values={{ type: entityType }}
            />
          </p>
          {onResetFilters && (
            <Button
              data-cy="reset-filters"
              size="lg"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={onResetFilters}
            >
              <RotateCcw size={16} />
              <span>
                <FormattedMessage defaultMessage="Reset filters" id="jZ0o74" />
              </span>
            </Button>
          )}
        </React.Fragment>
      )}
    </div>
  );
}
