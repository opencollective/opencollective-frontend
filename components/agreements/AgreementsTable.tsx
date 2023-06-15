import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { ColumnDef, TableMeta } from '@tanstack/react-table';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Agreement } from '../../lib/graphql/types/v2/graphql';
import { useWindowResize } from '../../lib/hooks/useWindowResize';

import Avatar from '../Avatar';
import { DataTable } from '../DataTable';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
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
            <Avatar collective={agreement.account} radius={20} />
            &nbsp;
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
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Account" />,
    cell: ({ cell }) => {
      const account = cell.getValue() as Agreement['account'];
      return (
        <Flex alignItems="center" p={3} gridGap={2}>
          <Avatar collective={account} radius={20} />
          <LinkCollective collective={account}>
            <Span letterSpacing="0" color="black.700" truncateOverflow fontSize="16px" fontWeight="700">
              {account.name}
            </Span>
          </LinkCollective>
        </Flex>
      );
    },
  },
  {
    accessorKey: 'title',
    header: () => <FormattedMessage id="Title" defaultMessage="Title" />,
    cell: ({ cell, row, table }) => {
      const title = cell.getValue() as Agreement['title'];
      const agreement = row.original;
      const meta = table.options.meta as AgreementMeta;
      return (
        <CellButton onClick={() => meta.openAgreement(agreement)}>
          <Span fontSize="16px" fontWeight="700">
            {title}
          </Span>
        </CellButton>
      );
    },
  },

  {
    accessorKey: 'expiresAt',
    header: () => <FormattedMessage id="Attachment.expiresAt" defaultMessage="Expires" />,
    cell: ({ cell }) => {
      const expiresAt = cell.getValue() as Agreement['expiresAt'];
      return (
        <Box p={3} fontSize="14px">
          {expiresAt ? (
            <Span letterSpacing="0" truncateOverflow>
              <FormattedDate value={expiresAt} month="short" day="numeric" year="numeric" />
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
    header: () => <FormattedMessage id="Expense.Attachment" defaultMessage="Attachment" />,
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
  nbPlaceholders?: number;
};

export default function AgreementsTable({ agreements, openAgreement, loading, nbPlaceholders }: AgreementsTableProps) {
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
      nbPlaceholders={nbPlaceholders}
    />
  );
}
