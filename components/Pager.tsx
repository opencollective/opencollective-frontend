import React from 'react';
import { ChevronLeft } from '@styled-icons/boxicons-regular/ChevronLeft';
import { ChevronRight } from '@styled-icons/boxicons-regular/ChevronRight';
import styled from 'styled-components';

import { paginationElements } from '../lib/pagination';

import { Box, Flex } from './Grid';

const Page = styled(Box)<{ selected: boolean }>`
  border-style: ${({ selected }) => (selected ? 'solid' : 'none')};
  border-width: 1px;
  border-radius: 5px;
  font-weight: 400;
  color: ${({ selected }) => (selected ? '#1153D6' : '#4D4F51')};
  padding: ${({ selected }) => (selected ? '2px' : '3px')};
  line-height: 14px;
  font-size: 14px;
  height: 22px;
  min-width: 22px;
  text-align: center;
  cursor: pointer;
`;

const Arrow = styled(Box)<{ enabled: boolean }>`
  cursor: ${({ enabled }) => (enabled ? 'pointer' : undefined)};
  height: 22px;
  width: 22px;
`;

export default function Pager(props: {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}) {
  const elements = React.useMemo(
    () =>
      paginationElements({
        currentPage: props.currentPage,
        totalPages: props.totalPages,
      }),
    [props.currentPage, props.totalPages],
  );

  return (
    <Flex gap="5px">
      <Arrow
        mr="5px"
        enabled={props.currentPage > 1}
        onClick={props.currentPage > 1 ? () => props.onPageChange(props.currentPage - 1) : undefined}
      >
        <ChevronLeft />
      </Arrow>

      <React.Fragment>
        {elements.map(el => {
          const isElipsis = el === 'left_elipsis' || el === 'right_elipsis';
          return (
            <Page
              selected={el === props.currentPage}
              key={el}
              onClick={isElipsis ? undefined : () => props.onPageChange(el)}
            >
              {isElipsis ? '...' : el}
            </Page>
          );
        })}
      </React.Fragment>
      <Arrow
        ml="5px"
        enabled={props.currentPage < props.totalPages}
        onClick={props.currentPage < props.totalPages ? () => props.onPageChange(props.currentPage + 1) : undefined}
      >
        <ChevronRight />
      </Arrow>
    </Flex>
  );
}
