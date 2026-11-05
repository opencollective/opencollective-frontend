import { paginationElements } from '../pagination';

describe('paginationElements', () => {
  it('generates pagination elements without elipsis', () => {
    expect(
      paginationElements({
        currentPage: 1,
        totalPages: 2,
        neighboringPages: 3,
      }),
    ).toEqual([1, 2]);

    expect(
      paginationElements({
        currentPage: 1,
        totalPages: 1,
        neighboringPages: 3,
      }),
    ).toEqual([1]);

    expect(
      paginationElements({
        currentPage: 1,
        totalPages: 0,
        neighboringPages: 3,
      }),
    ).toEqual([]);

    expect(
      paginationElements({
        currentPage: 1,
        totalPages: 3,
        neighboringPages: 3,
      }),
    ).toEqual([1, 2, 3]);

    expect(
      paginationElements({
        currentPage: 2,
        totalPages: 3,
        neighboringPages: 0,
      }),
    ).toEqual([1, 2, 3]);

    expect(
      paginationElements({
        currentPage: 3,
        totalPages: 3,
        neighboringPages: -1,
      }),
    ).toEqual([1, 2, 3]);
  });

  it('generates pagination elements', () => {
    expect(
      paginationElements({
        currentPage: 1,
        totalPages: 100,
        neighboringPages: 2,
      }),
    ).toEqual([1, 2, 3, 4, 5, 'right_elipsis', 100]);

    expect(
      paginationElements({
        currentPage: 2,
        totalPages: 100,
        neighboringPages: 2,
      }),
    ).toEqual([1, 2, 3, 4, 5, 'right_elipsis', 100]);

    expect(
      paginationElements({
        currentPage: 3,
        totalPages: 100,
        neighboringPages: 2,
      }),
    ).toEqual([1, 2, 3, 4, 5, 'right_elipsis', 100]);

    expect(
      paginationElements({
        currentPage: 4,
        totalPages: 100,
        neighboringPages: 2,
      }),
    ).toEqual([1, 2, 3, 4, 5, 'right_elipsis', 100]);

    expect(
      paginationElements({
        currentPage: 5,
        totalPages: 100,
        neighboringPages: 2,
      }),
    ).toEqual([1, 'left_elipsis', 3, 4, 5, 6, 7, 'right_elipsis', 100]);

    expect(
      paginationElements({
        currentPage: 100,
        totalPages: 100,
        neighboringPages: 2,
      }),
    ).toEqual([1, 'left_elipsis', 96, 97, 98, 99, 100]);

    expect(
      paginationElements({
        currentPage: 99,
        totalPages: 100,
        neighboringPages: 2,
      }),
    ).toEqual([1, 'left_elipsis', 96, 97, 98, 99, 100]);

    expect(
      paginationElements({
        currentPage: 98,
        totalPages: 100,
        neighboringPages: 2,
      }),
    ).toEqual([1, 'left_elipsis', 96, 97, 98, 99, 100]);

    expect(
      paginationElements({
        currentPage: 97,
        totalPages: 100,
        neighboringPages: 2,
      }),
    ).toEqual([1, 'left_elipsis', 96, 97, 98, 99, 100]);

    expect(
      paginationElements({
        currentPage: 96,
        totalPages: 100,
        neighboringPages: 2,
      }),
    ).toEqual([1, 'left_elipsis', 94, 95, 96, 97, 98, 'right_elipsis', 100]);

    expect(
      paginationElements({
        currentPage: 95,
        totalPages: 100,
        neighboringPages: 2,
      }),
    ).toEqual([1, 'left_elipsis', 93, 94, 95, 96, 97, 'right_elipsis', 100]);
  });
});
