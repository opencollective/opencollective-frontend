import qs from 'querystring';

import React from 'react';
import { ChevronLeft } from '@styled-icons/boxicons-regular/ChevronLeft';
import { ChevronRight } from '@styled-icons/boxicons-regular/ChevronRight';
import { omit } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { paginationElements } from '../lib/pagination';

import Container from './Container';
import { Box, Flex } from './Grid';
import Link from './Link';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';

type PaginationProps = BasePaginationProps &
  (
    | ({
        variant?: 'input';
      } & InputPaginationProps)
    | ({
        variant: 'list';
      } & ListPaginationProps)
  );

type BasePaginationProps = {
  offset: number;
  limit: number;
  total: number;
  isDisabled?: boolean;
} & (
  | {
      onPageChange: (page: number) => void;
    }
  | {
      route?: string;
      ignoredQueryParams?: string[];
    }
);

export default function Pagination(props: PaginationProps) {
  const router = useRouter();
  const useCallback = 'onPageChange' in props;

  const totalPages = Math.ceil(props.total / props.limit);
  const currentPage = Math.ceil(props.offset / props.limit) + 1;

  const pageUrl = React.useMemo(() => {
    if (useCallback) {
      return null;
    }

    const baseUrl = 'route' in props ? props.route : router.asPath.split('?')[0];
    return (page: number) => {
      const query = new URLSearchParams(qs.encode(omit(router.query, props.ignoredQueryParams)));
      query.set('offset', `${props.limit * (page - 1)}`);
      query.set('limit', `${props.limit}`);
      return `${baseUrl}?${query.toString()}`;
    };
  }, [props.limit, !useCallback && props.route, !useCallback && props.ignoredQueryParams, !useCallback && router]);

  const onPageChange = React.useCallback(
    (page: number) => {
      if (page <= 0 || page > totalPages) {
        return;
      }

      if (!useCallback) {
        router.push(pageUrl(page));
      } else {
        props.onPageChange(page);
      }
    },
    [router, useCallback, pageUrl, totalPages],
  );

  const PageComponent = React.useMemo(() => {
    if (useCallback) {
      return function PageComponent(props: PageComponentProps) {
        return <Box onClick={() => onPageChange(props.page)}>{props.children}</Box>;
      };
    }

    return function PageComponent(props: PageComponentProps) {
      return <Link href={pageUrl(props.page)}>{props.children}</Link>;
    };
  }, [useCallback, onPageChange]);

  const isDisabled = props.isDisabled || totalPages <= 1;

  const variantProps: CommonVariantProps = {
    isDisabled,
    pageUrl,
    currentPage,
    totalPages,
    onPageChange,
    useCallback,
    PageComponent,
  };

  switch (props.variant) {
    case 'list': {
      return <ListPagination {...props} {...variantProps} />;
    }
    default: {
      return <InputPagination {...props} {...variantProps} />;
    }
  }
}

// variants

type CommonVariantProps = {
  currentPage: number;
  totalPages: number;
  isDisabled: boolean;
  onPageChange?: (page: number) => void;
  pageUrl?: (page: number) => string;
  useCallback: boolean;
  PageComponent: React.FC<PageComponentProps>;
};
type PageComponentProps = React.PropsWithChildren<{ page: number }>;

type InputPaginationProps = object;

function InputPagination(props: InputPaginationProps & CommonVariantProps) {
  const changePage = React.useCallback(
    ({ target, key }) => {
      if (key && key !== 'Enter') {
        return;
      }

      const { value } = target;
      if (!value || !parseInt(value) || parseInt(value) === props.currentPage) {
        return;
      }

      props.onPageChange(value);
    },
    [props.currentPage, props.onPageChange],
  );

  return (
    <Flex alignItems="center">
      {props.currentPage > 1 && (
        <props.PageComponent page={props.currentPage - 1}>
          <StyledButton buttonSize="small" disabled={props.isDisabled}>
            <FormattedMessage id="Pagination.Prev" defaultMessage="Previous" />
          </StyledButton>
        </props.PageComponent>
      )}
      <Container display="inline-block" mx={2}>
        <FormattedMessage
          id="Pagination.Count"
          defaultMessage="Page {current} of {total}"
          values={{
            current: (
              <StyledInput
                key={props.currentPage}
                defaultValue={props.currentPage}
                onBlur={changePage}
                onKeyPress={changePage}
                textAlign="center"
                mx={1}
                px={1}
                py={1}
                width={30}
                disabled={props.isDisabled}
                type="text"
                pattern="[0-9]+"
                inputMode="numeric"
                data-cy="pagination-current"
              />
            ),
            total: <span data-cy="pagination-total">{props.totalPages || 1}</span>,
          }}
        />
      </Container>
      {props.currentPage < props.totalPages && (
        <props.PageComponent page={props.currentPage + 1}>
          <StyledButton buttonSize="small" disabled={props.isDisabled}>
            <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
          </StyledButton>
        </props.PageComponent>
      )}
    </Flex>
  );
}

type ListPaginationProps = {
  neighbooringPages?: number;
};

const ListPaginationPage = styled(Box)<{ selected?: boolean }>`
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

const ListPaginationArrow = styled(Box)<{ enabled: boolean }>`
  cursor: ${({ enabled }) => (enabled ? 'pointer' : undefined)};
  height: 22px;
  width: 22px;
`;

function ListPagination(props: ListPaginationProps & CommonVariantProps) {
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
      <props.PageComponent page={props.currentPage - 1}>
        <ListPaginationArrow mr="5px" enabled={props.currentPage > 1}>
          <ChevronLeft />
        </ListPaginationArrow>
      </props.PageComponent>

      <React.Fragment>
        {elements.map(el => {
          const isElipsis = el === 'left_elipsis' || el === 'right_elipsis';

          if (isElipsis) {
            return <ListPaginationPage key={el}>{'...'}</ListPaginationPage>;
          }

          return (
            <props.PageComponent key={el} page={el}>
              <ListPaginationPage selected={el === props.currentPage}>{el}</ListPaginationPage>
            </props.PageComponent>
          );
        })}
      </React.Fragment>
      <props.PageComponent page={props.currentPage + 1}>
        <ListPaginationArrow ml="5px" enabled={props.currentPage < props.totalPages}>
          <ChevronRight />
        </ListPaginationArrow>
      </props.PageComponent>
    </Flex>
  );
}
