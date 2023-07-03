import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { ColumnDef, TableMeta } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Agreement } from '../../lib/graphql/types/v2/graphql';
import { useWindowResize } from '../../lib/hooks/useWindowResize';

import Avatar from '../Avatar';
import { DataTable } from '../DataTable';
import DateTime from '../DateTime';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledHr from '../StyledHr';
import StyledLinkButton from '../StyledLinkButton';
import { P, Span } from '../Text';
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
  onFilePreview: (agreement: Agreement) => void;
}

export const cardColumns: ColumnDef<Agreement>[] = [
  {
    accessorKey: 'summary',
    cell: ({ row, table }) => {
      const agreement = row.original;
      const meta = table.options.meta as AgreementMeta;
      return (
        <CellButton onClick={() => meta.openAgreement(agreement)}>
          <Flex alignItems="center" gridGap="16px" mb="16px">
            <Avatar collective={agreement.account} radius={32} />
            <Flex flexDirection="column" gridGap="4px">
              <Span letterSpacing="0" truncateOverflow fontWeight="500">
                {agreement.account.name}
              </Span>
              <Span fontSize="14px" color="black.700" fontWeight="normal">
                <DateTime value={agreement.createdAt} />
                {agreement.expiresAt && agreement.attachment && ' • '}
                {agreement.attachment && (
                  <FormattedMessage
                    id="ExepenseAttachments.count"
                    defaultMessage="{count, plural, one {# attachment} other {# attachments}}"
                    values={{ count: 1 }}
                  />
                )}
              </Span>
            </Flex>
          </Flex>
          <Span fontSize="16px" fontWeight="700" lineHeight="24px" color="black.800">
            {agreement.title}
          </Span>
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
    header: () => <FormattedMessage id="Agreement.expiresAt" defaultMessage="Expires" />,
    cell: ({ cell }) => {
      const expiresAt = cell.getValue() as Agreement['expiresAt'];
      return (
        <Box p={3} fontSize="14px">
          {expiresAt ? (
            <Span letterSpacing="0" truncateOverflow>
              <DateTime value={expiresAt} />
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
    meta: { align: 'right' },
    cell: ({ row, table }) => {
      const agreement = row.original as Agreement;
      const attachment = agreement.attachment;
      if (!attachment?.url) {
        return <Box size={48} m={3} />;
      }

      const meta = table.options.meta as AgreementMeta;
      return (
        <Flex p={3} justifyContent="flex-end">
          <UploadedFilePreview
            url={attachment?.url}
            size={48}
            borderRadius="8px"
            boxShadow="0px 2px 5px rgba(0, 0, 0, 0.14)"
            openFileViewer={() => meta?.onFilePreview(agreement)}
          />
        </Flex>
      );
    },
  },
];

type AgreementsTableProps = {
  agreements: { nodes: Agreement[] };
  openAgreement: (agreement: Agreement) => void;
  resetFilters?: () => void;
  loading?: boolean;
  nbPlaceholders?: number;
  onFilePreview?: (agreement: Agreement) => void;
};

export default function AgreementsTable({
  agreements,
  openAgreement,
  loading,
  nbPlaceholders,
  resetFilters,
  onFilePreview,
}: AgreementsTableProps) {
  const [isTableView, setIsTableView] = React.useState(true);
  useWindowResize(() => setIsTableView(window.innerWidth > 1024));
  const columns = isTableView ? tableColumns : cardColumns;
  return (
    <DataTable
      data-cy="agreements-table"
      hideHeader={!isTableView}
      columns={columns}
      data={agreements?.nodes || []}
      meta={{ openAgreement, onFilePreview } as AgreementMeta}
      loading={loading}
      nbPlaceholders={nbPlaceholders}
      emptyMessage={() => (
        <div>
          <P fontSize="16px">
            <FormattedMessage defaultMessage="No agreements" />
          </P>
          {resetFilters && (
            <div>
              <StyledHr maxWidth={300} m="16px auto" borderColor="black.100" />
              <StyledLinkButton onClick={resetFilters}>
                <FormattedMessage defaultMessage="Reset filters" />
              </StyledLinkButton>
            </div>
          )}
        </div>
      )}
    />
  );
}
