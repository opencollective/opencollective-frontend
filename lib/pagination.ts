import lodashRange from 'lodash/range';

export type PaginationElement = number | 'right_elipsis' | 'left_elipsis';

function range(start: number, end: number): number[] {
  if (end <= start) {
    return [];
  }

  return lodashRange(start, end);
}

export function paginationElements(options: {
  currentPage: number;
  totalPages: number;
  neighboringPages?: number;
}): PaginationElement[] {
  const totalPages = Math.max(options.totalPages, 0);
  if ([1, 'left_elipsis', 10, 'right_elipsis', 20].length >= totalPages) {
    return range(1, totalPages + 1);
  }

  const currentPage = Math.min(Math.max(options.currentPage, 0), options.totalPages);
  const neighboringPages = Math.max(options.neighboringPages ?? 2, 1);

  const leftmostNeighboorPage = Math.max(1, currentPage - neighboringPages);
  const hasLeftElipsis = leftmostNeighboorPage > 2;
  const rightmostNeighboorPage = Math.min(totalPages, currentPage + neighboringPages);
  const hasRightElipsis = rightmostNeighboorPage <= totalPages - 2;

  if (!hasLeftElipsis && hasRightElipsis) {
    return [...range(1, 2 + 2 * neighboringPages), 'right_elipsis', totalPages];
  }

  if (!hasRightElipsis && hasLeftElipsis) {
    return [1, 'left_elipsis', ...range(totalPages - 2 * neighboringPages, totalPages), totalPages];
  }

  return [1, 'left_elipsis', ...range(leftmostNeighboorPage, rightmostNeighboorPage + 1), 'right_elipsis', totalPages];
}
