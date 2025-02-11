import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { uniq } from 'lodash';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useKeyboardKey, { PAGE_DOWN_KEY, PAGE_UP_KEY } from '../../../lib/hooks/useKeyboardKey';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';
import { usePrevious } from '../../../lib/hooks/usePrevious';
import { PREVIEW_FEATURE_KEYS } from '../../../lib/preview-features';

import { Button } from '../../ui/Button';
import {
  Pagination as UIPagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '../../ui/Pagination';
import { Select, SelectContent, SelectItem } from '../../ui/Select';

function SelectLimit({ limit, setLimit, defaultLimit }) {
  const options = uniq([20, 40, 60, 80, 100, limit, defaultLimit].filter(Boolean)).sort((a, b) => a - b);

  return (
    <Select value={String(limit)} onValueChange={v => setLimit(v)}>
      <SelectPrimitive.Trigger asChild>
        <Button variant="outline" size="sm" className="shrink-0">
          <FormattedMessage defaultMessage="{rowCount} per page" id="Pagination.PerPage" values={{ rowCount: limit }} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </SelectPrimitive.Icon>
        </Button>
      </SelectPrimitive.Trigger>

      <SelectContent>
        {options.map(option => (
          <SelectItem key={option} value={String(option)} onClick={() => setLimit(option)}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Pagination({ total, queryFilter }) {
  const { LoggedInUser } = useLoggedInUser();
  const { offset, limit } = queryFilter.values;
  const defaultLimit = queryFilter.defaultSchemaValues.limit;
  const prevTotalCount = usePrevious(total);
  total = total ?? prevTotalCount;
  const currentPage = offset / limit + 1;
  const totalPages = Math.ceil((total || 1) / limit);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const goToPage = page => {
    if (page < 1 || page > totalPages) {
      return;
    }
    const offset = (page - 1) * limit;
    queryFilter.setFilter('offset', offset);
  };

  const hasKeyboardShortcutsEnabled = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.KEYBOARD_SHORTCUTS);
  useKeyboardKey({
    keyMatch: PAGE_UP_KEY,
    callback: e => {
      if (hasKeyboardShortcutsEnabled) {
        e.preventDefault();
        goToPage(currentPage - 1);
      }
    },
  });
  useKeyboardKey({
    keyMatch: PAGE_DOWN_KEY,
    callback: e => {
      if (hasKeyboardShortcutsEnabled) {
        e.preventDefault();
        goToPage(currentPage + 1);
      }
    },
  });

  // Show pagination if there is more than 1 page or limit is not default (i.e. the user has changed it)
  const showPagination = totalPages > 1 || limit !== defaultLimit;
  if (!showPagination) {
    return null;
  }

  const renderPageNumbers = () => {
    const pages = [];

    if (totalPages < 1) {
      return pages;
    }

    // Always show the first page
    pages.push(
      <PaginationItem key={1}>
        <PaginationButton size="icon-sm" onClick={() => goToPage(1)} isActive={currentPage === 1}>
          1
        </PaginationButton>
      </PaginationItem>,
    );

    let startPage, endPage;
    if (totalPages <= 7) {
      startPage = 2;
      endPage = totalPages - 1;
    } else {
      if (currentPage <= 4) {
        startPage = 2;
        endPage = 5;
      } else if (currentPage + 3 >= totalPages) {
        startPage = totalPages - 4;
        endPage = totalPages - 1;
      } else {
        startPage = currentPage - 1;
        endPage = currentPage + 1;
      }
    }

    if (startPage > 2) {
      pages.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>,
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationButton size="icon-sm" onClick={() => goToPage(i)} isActive={currentPage === i}>
            {i}
          </PaginationButton>
        </PaginationItem>,
      );
    }

    if (endPage < totalPages - 1) {
      pages.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>,
      );
    }

    // Always show the last page
    if (totalPages > 1) {
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationButton size="icon-sm" onClick={() => goToPage(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationButton>
        </PaginationItem>,
      );
    }

    return pages;
  };
  return (
    <div className="flex items-center justify-between gap-1">
      <UIPagination className="flex-1 items-center justify-between sm:flex">
        <div className="hidden lg:block">
          <SelectLimit limit={limit} defaultLimit={defaultLimit} setLimit={l => queryFilter.setFilter('limit', l)} />
        </div>

        <div className="block text-sm font-medium text-muted-foreground lg:hidden">
          <FormattedMessage
            id="Pagination.Count"
            defaultMessage="Page {current} of {total}"
            values={{
              current: currentPage,
              total: totalPages,
            }}
          />
        </div>

        <PaginationContent className="hidden lg:flex">{renderPageNumbers()}</PaginationContent>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              size="sm"
              variant="outline"
              onClick={() => goToPage(currentPage - 1)}
              disabled={!hasPrevious}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext size="sm" variant="outline" onClick={() => goToPage(currentPage + 1)} disabled={!hasNext} />
          </PaginationItem>
        </PaginationContent>
      </UIPagination>
    </div>
  );
}
