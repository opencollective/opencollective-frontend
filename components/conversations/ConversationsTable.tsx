import React from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { Markup } from 'interweave';
import { MessageSquare } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import DateTime from '../DateTime';
import { DataTable } from '../table/DataTable';

export type Conversation = {
  id: string;
  title: string;
  summary: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  visibility: string;
  lastCommentDate?: string;
  fromAccount: {
    id: string;
    slug: string;
    name: string;
    type: string;
    imageUrl?: string;
  };
  stats: {
    id: string;
    commentsCount: number;
  };
};

const conversationColumns: ColumnDef<Conversation>[] = [
  {
    accessorKey: 'title',
    header: () => <FormattedMessage defaultMessage="Title" id="host.conversations.table.title" />,
    cell: ({ row }) => {
      const conversation = row.original;
      return (
        <div className="min-w-0">
          <h3 className="truncate font-medium text-foreground">{conversation.title}</h3>
          {conversation.summary && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              <Markup noWrap content={conversation.summary} />
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage defaultMessage="Date" id="host.conversations.table.date" />,
    cell: ({ row }) => {
      const conversation = row.original;
      return <DateTime value={conversation.createdAt} className="whitespace-nowrap" />;
    },
  },
  {
    accessorKey: 'lastCommentDate',
    header: () => <FormattedMessage defaultMessage="Last commented" id="host.conversations.table.lastCommented" />,
    cell: ({ row }) => {
      const conversation = row.original;
      return conversation.lastCommentDate ? (
        <DateTime value={conversation.lastCommentDate} className="whitespace-nowrap" />
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
];

type ConversationsTableProps = {
  conversations: Conversation[];
  loading?: boolean;
  totalCount?: number;
  onRowClick?: (row: Row<Conversation>) => void;
};

export function ConversationsTable({ conversations, loading, totalCount, onRowClick }: ConversationsTableProps) {
  return (
    <DataTable
      columns={conversationColumns}
      data={conversations}
      loading={loading}
      onClickRow={onRowClick}
      emptyMessage={() => (
        <div className="p-8 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">
            <FormattedMessage defaultMessage="No conversations yet" id="host.conversations.empty.title" />
          </h3>
          <p className="text-muted-foreground">
            <FormattedMessage
              defaultMessage="Start a conversation with your fiscal host to ask questions or discuss ongoing matters."
              id="host.conversations.empty.description"
            />
          </p>
        </div>
      )}
      footer={
        totalCount &&
        totalCount > conversations.length && (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <FormattedMessage
                defaultMessage="Showing {shown} of {total} conversations"
                id="host.conversations.showingCount"
                values={{ shown: conversations.length, total: totalCount }}
              />
            </p>
          </div>
        )
      }
    />
  );
}
