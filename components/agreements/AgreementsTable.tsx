import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { ColumnDef, TableMeta } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Agreement } from '../../lib/graphql/types/v2/graphql';
import { useWindowResize } from '../../lib/hooks/useWindowResize';

import Avatar from '../Avatar';
import { DataTable } from '../DataTable';
import { Box, Flex } from '../Grid';
import { Span } from '../Text';
import UploadedFilePreview from '../UploadedFilePreview';

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

interface AgreementMeta extends TableMeta<Agreement> {
  openAgreement: (agreement: Agreement) => void;
}

export const cardColumns: ColumnDef<Agreement>[] = [
  {
    accessorKey: 'summary',
    cell: ({ row, table }) => {
      const agreement = row.original;
      const meta = table.options.meta as AgreementMeta;
      return (
        <CellButton onClick={() => meta.openAgreement(agreement)}>
          <span>{agreement.title}</span>
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
      const title = cell.getValue() as Agreement['title'];
      const agreement = row.original;
      const meta = table.options.meta as AgreementMeta;
      return (
        <CellButton onClick={() => meta.openAgreement(agreement)}>
          <span>{title}</span>
        </CellButton>
      );
    },
  },
  {
    accessorKey: 'account',
    header: 'Collective',
    cell: ({ cell }) => {
      const account = cell.getValue() as Agreement['account'];
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
      const expiresAt = cell.getValue() as Agreement['expiresAt'];
      return (
        <Box p={3}>
          {expiresAt ? (
            <Span letterSpacing="0" truncateOverflow>
              {dayjs(expiresAt).format('MMM D, YYYY')}
            </Span>
          ) : (
            <Span fontStyle="italic" color="black.500">
              <FormattedMessage defaultMessage="Never" />
            </Span>
          )}
        </Box>
      );
    },
  },
  {
    accessorKey: 'attachment',
    header: '',
    cell: ({ cell }) => {
      const attachment = cell.getValue() as Agreement['attachment'];
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

type AgreementsTableProps = {
  agreements: { nodes: Agreement[] };
  openAgreement: (agreement: Agreement) => void;
  loading?: boolean;
};

export default function AgreementsTable({ agreements, openAgreement, loading }: AgreementsTableProps) {
  const [isTableView, setIsTableView] = React.useState(true);
  useWindowResize(() => setIsTableView(window.innerWidth > 1024));
  const columns = isTableView ? tableColumns : cardColumns;
  return (
    <DataTable
      hideHeader={!isTableView}
      columns={columns}
      data={agreements?.nodes || []}
      meta={{ openAgreement } as AgreementMeta}
      loading={loading}
    />
  );
}
