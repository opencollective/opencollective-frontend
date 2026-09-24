import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { cn } from '../../lib/utils';

import type { ButtonProps } from './Button';
import { Button } from './Button';

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
  ),
);
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(({ className, ...props }, ref) => (
  <li ref={ref} data-cy="pagination-item" className={cn('', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationButtonProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<typeof Button>;

const PaginationButton = ({ className, isActive, size = 'icon', ...props }: PaginationButtonProps) => (
  <Button
    aria-current={isActive ? 'page' : undefined}
    variant={isActive ? 'outline' : 'ghost'}
    size={size}
    className={className}
    {...props}
  />
);
PaginationButton.displayName = 'PaginationButton';

const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationButton>) => (
  <PaginationButton
    aria-label="Go to previous page"
    size="default"
    className={cn('gap-1 pl-2.5', className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>
      <FormattedMessage id="Pagination.Prev" defaultMessage="Previous" />
    </span>
  </PaginationButton>
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationButton>) => (
  <PaginationButton aria-label="Go to next page" size="default" className={cn('gap-1 pr-2.5', className)} {...props}>
    <span>
      <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
    </span>
    <ChevronRight className="h-4 w-4" />
  </PaginationButton>
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center text-muted-foreground', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">
      <FormattedMessage id="Pagination.MorePages" defaultMessage="More pages" />
    </span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationButton,
  PaginationNext,
  PaginationPrevious,
};
