import React from 'react';
import type { ColumnDef, TableMeta } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import type { Conversation } from '../../../../lib/graphql/types/v2/schema';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import Link from '../../../Link';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { P } from '../../../Text';

interface ConversationMeta extends TableMeta<Conversation> {
    openConversation: (conversation: Conversation) => void;
}

const columns: ColumnDef<Conversation>[] = [
    {
        accessorKey: 'account',
        header: () => <FormattedMessage defaultMessage="Collective" id="conversation.table.collective" />,
        meta: { className: 'w-40 sm:w-56' },
        cell: ({ cell }) => {
            const account = cell.getValue() as Conversation['account'];
            if (!account) return null;

            return (
                <AccountHoverCard
                    account={account}
                    trigger={
                        <div className="flex items-center gap-2 truncate">
                            <Avatar collective={account} radius={24} />
                            <span className="truncate">{account.name}</span>
                        </div>
                    }
                />
            );
        },
    },
    {
        accessorKey: 'title',
        meta: { className: 'w-32 sm:w-auto' },
        header: () => <FormattedMessage id="Title" defaultMessage="Title" />,
        cell: ({ cell }) => {
            const title = cell.getValue() as Conversation['title'];
            return <div className="truncate font-medium">{title}</div>;
        },
    },
    {
        accessorKey: 'summary',
        meta: { className: 'w-48 sm:w-auto' },
        header: () => <FormattedMessage defaultMessage="Summary" id="conversation.table.summary" />,
        cell: ({ cell }) => {
            const summary = cell.getValue() as Conversation['summary'];
            return <div className="truncate text-sm text-muted-foreground">{summary}</div>;
        },
    },
    {
        accessorKey: 'fromAccount',
        header: () => <FormattedMessage defaultMessage="Started by" id="conversation.table.startedBy" />,
        meta: { className: 'w-32 sm:w-40' },
        cell: ({ cell }) => {
            const fromAccount = cell.getValue() as Conversation['fromAccount'];
            if (!fromAccount) return null;

            return (
                <AccountHoverCard
                    account={fromAccount}
                    trigger={
                        <div className="flex items-center gap-2 truncate">
                            <Avatar collective={fromAccount} radius={16} />
                            <span className="truncate text-sm">{fromAccount.name}</span>
                        </div>
                    }
                />
            );
        },
    },
    {
        accessorKey: 'createdAt',
        header: () => <FormattedMessage defaultMessage="Created" id="conversation.table.created" />,
        meta: { className: 'w-32' },
        cell: ({ cell }) => {
            const createdAt = cell.getValue() as Conversation['createdAt'];
            return (
                <span className="text-sm text-muted-foreground">
                    <DateTime value={createdAt} dateStyle="medium" />
                </span>
            );
        },
    },
    {
        accessorKey: 'stats',
        header: () => <FormattedMessage defaultMessage="Comments" id="conversation.table.comments" />,
        meta: { className: 'w-20 text-center' },
        cell: ({ cell }) => {
            const stats = cell.getValue() as Conversation['stats'];
            const commentsCount = stats?.commentsCount || 0;
            return (
                <span className="text-sm text-muted-foreground">
                    {commentsCount}
                </span>
            );
        },
    },
    {
        accessorKey: 'lastCommentDate',
        header: () => <FormattedMessage defaultMessage="Last Activity" id="conversation.table.lastActivity" />,
        meta: { className: 'w-32' },
        cell: ({ cell }) => {
            const lastCommentDate = cell.getValue() as Conversation['lastCommentDate'];
            return lastCommentDate ? (
                <span className="text-sm text-muted-foreground">
                    <DateTime value={lastCommentDate} dateStyle="medium" />
                </span>
            ) : (
                <span className="text-sm text-muted-foreground italic">
                    <FormattedMessage defaultMessage="No activity" id="conversation.table.noActivity" />
                </span>
            );
        },
    },
    {
        ...actionsColumn,
        meta: { className: 'w-24 text-right' },
        header: () => {
            return <FormattedMessage defaultMessage="Actions" id="CollectivePage.NavBar.ActionMenu.Actions" />;
        },
    },
];

type ConversationsTableProps = {
    conversations: { nodes: Conversation[] };
    openConversation: (conversation: Conversation) => void;
    resetFilters?: () => void;
    loading?: boolean;
    nbPlaceholders?: number;
    getActions?: GetActions<Conversation>;
};

export default function ConversationsTable({
    conversations,
    openConversation,
    loading,
    nbPlaceholders,
    resetFilters,
    getActions,
}: ConversationsTableProps) {
    return (
        <DataTable
            data-cy="conversations-table"
            innerClassName="table-fixed"
            mobileTableView
            columns={columns}
            data={conversations?.nodes || []}
            meta={{ openConversation } as ConversationMeta}
            loading={loading}
            nbPlaceholders={nbPlaceholders}
            onClickRow={row => openConversation(row.original)}
            getActions={getActions}
            emptyMessage={() => (
                <div>
                    <P fontSize="16px">
                        <FormattedMessage defaultMessage="No conversations" id="conversations.table.empty" />
                    </P>
                    {resetFilters && (
                        <div>
                            <p className="mt-4 text-sm text-muted-foreground">
                                <FormattedMessage defaultMessage="Try adjusting your filters or start a new conversation." id="conversations.table.empty.hint" />
                            </p>
                        </div>
                    )}
                </div>
            )}
        />
    );
}
