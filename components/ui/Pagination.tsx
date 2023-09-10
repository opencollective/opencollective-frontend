import React from 'react';
import { FormattedMessage } from 'react-intl';

import { elementFromClass } from '../../lib/react-utils';

const PaginationButton = elementFromClass(
  'button',
  'inline-flex h-8 items-center justify-center rounded-full border bg-white px-4 py-2 text-sm leading-none outline-none hover:bg-gray-50 data-[disabled]:bg-white data-[disabled]:opacity-50 cursor-pointer',
);

type PaginationProps = {
  onChange: (page: number) => void;
  totalPages: number;
  page: number;
};

export const Pagination = ({ onChange, totalPages, page }: PaginationProps) => {
  const handlePageJump = React.useCallback(
    (event: React.FocusEvent | React.KeyboardEvent) => {
      const key = 'key' in event ? event.key : null;
      const target = event.target;
      const value = 'value' in target ? parseInt(target.value as string) : null;

      if (key && key !== 'Enter') {
        return;
      }

      if (!value || value === page || value > totalPages || value <= 0) {
        return;
      }

      onChange(value);
    },
    [onChange, page],
  );

  return (
    <div className="flex content-center justify-center gap-3 text-sm">
      {page > 1 && (
        <PaginationButton onClick={() => onChange(page - 1)}>
          <FormattedMessage id="Pagination.Prev" defaultMessage="Previous" />
        </PaginationButton>
      )}
      <div className="inline-flex items-center">
        <FormattedMessage
          id="Pagination.Count"
          defaultMessage="Page {current} of {total}"
          values={{
            current: (
              <input
                key={page}
                type="text"
                inputMode="numeric"
                pattern="[0-9]+"
                className="mx-1 w-8 justify-center rounded-md border px-2 py-1"
                defaultValue={page}
                onBlur={handlePageJump}
                onKeyPress={handlePageJump}
                size={totalPages.toString().length}
              />
            ),
            total: totalPages,
          }}
        />
      </div>
      {page < totalPages && (
        <PaginationButton onClick={() => onChange(page + 1)}>
          <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
        </PaginationButton>
      )}
    </div>
  );
};
