import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import styled from 'styled-components';

import Avatar from '../Avatar';
import { DataTable } from '../DataTable';
import { Box, Flex } from '../Grid';
import { P, Span } from '../Text';
import UploadedFilePreview from '../UploadedFilePreview';

export type Agreement = {
  id: string;
  title: string;
  account: {
    id: string;
    slug: string;
    imageUrl: string;
    name: string;
  };
  attachment?: {
    id: string;
    url: string;
  };
};

const CellButton = styled.button`
  border: 0;
  width: 100%;
  outline: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 16px;
  font-weight: 500;
  color: ${themeGet('colors.black.900')};

  &:hover,
  :focus-visible {
    .title {
      text-decoration: underline;
    }
  }
`;

export const cardColumns: ColumnDef<Agreement>[] = [
  {
    accessorKey: 'summary',
    cell: ({ row, table }) => {
      const agreement = row.original;
      return (
        <CellButton onClick={() => table.options.meta.openAgreement(agreement)}>
          <span className="title">{agreement.title}</span>
          <Flex alignItems="center" py={2} gridGap={2}>
            <Avatar collective={agreement.account} radius={20} />{' '}
            <Span letterSpacing="0" truncateOverflow fontWeight="500">
              {agreement.account.name}
            </Span>
          </Flex>
        </CellButton>
      );
    },
  },
];

export const tableColumns: ColumnDef<Agreement>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ cell, row, table }) => {
      const title = cell.getValue();
      const agreement = row.original;
      return (
        <CellButton onClick={() => table.options.meta.openAgreement(agreement)}>
          <span className="title">{title}</span>
        </CellButton>
      );
    },
  },
  {
    accessorKey: 'account',
    header: 'Collective',
    cell: ({ cell }) => {
      const account = cell.getValue();
      return (
        <Flex alignItems="center" p={3} gridGap={2}>
          <Avatar collective={account} radius={20} />{' '}
          <Span letterSpacing="0" truncateOverflow fontWeight="500">
            {account?.name}
          </Span>
        </Flex>
      );
    },
  },
  {
    accessorKey: 'expiresAt',
    header: 'Expires at',
    cell: ({ cell }) => {
      const expiresAt = cell.getValue();
      if (!expiresAt) {
        return null;
      }
      return (
        <Box p={3} className="whitespace-nowrap p-4 text-slate-500">
          <Span letterSpacing="0" truncateOverflow>
            {dayjs(expiresAt).format('MMM D, YYYY')}
          </Span>
        </Box>
      );
    },
  },
  {
    accessorKey: 'attachment',
    header: '',
    cell: ({ cell }) => {
      const attachment = cell.getValue();
      if (!attachment?.url) {
        return null;
      }
      return (
        <Box p={3}>
          <UploadedFilePreview url={attachment?.url} />
        </Box>
      );
    },
  },
];

export default function AgreementsTable({ agreements, openAgreement, error, loading }) {
  const [isTableView, setIsTableView] = React.useState(true);
  React.useEffect(() => {
    const handleResize = () => setIsTableView(window.innerWidth > 1024);

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columns = isTableView ? tableColumns : cardColumns;

  return (
    <DataTable
      hideHeader={!isTableView}
      columns={columns}
      data={agreements?.nodes || []}
      meta={{ openAgreement }}
      loading={loading}
    />
  );
}
