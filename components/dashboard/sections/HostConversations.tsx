import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import type { Row } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import { ConversationDrawer } from '../../conversations/ConversationDrawer';
import { type Conversation, ConversationsTable } from '../../conversations/ConversationsTable';
import { CreateHostConversationForm } from '../../conversations/CreateHostConversationForm';
import DrawerHeader from '../../DrawerHeader';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { Button } from '../../ui/Button';
import { Sheet, SheetContent } from '../../ui/Sheet';

// GraphQL types will be generated after schema update
type HostConversationsQuery = {
  account?: {
    id: string;
    slug: string;
    name: string;
    conversations: {
      totalCount: number;
      nodes: Conversation[];
    };
  };
};

type HostConversationsQueryVariables = {
  accountSlug: string;
};

const hostConversationsQuery = gql`
  query HostConversations($accountSlug: String!) {
    account(slug: $accountSlug) {
      id
      slug
      name
      conversations(limit: 20, visibility: ADMINS_AND_HOST) {
        totalCount
        nodes {
          id
          title
          summary
          slug
          createdAt
          updatedAt
          visibility
          lastCommentDate
          fromAccount {
            id
            slug
            name
            type
            imageUrl
          }
          stats {
            id
            commentsCount
          }
        }
      }
    }
  }
`;

type HostConversationsProps = {
  accountSlug: string;
};

export function HostConversations({ accountSlug }: HostConversationsProps) {
  const dropdownTriggerRef = React.useRef(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data, loading, error } = useQuery<HostConversationsQuery, HostConversationsQueryVariables>(
    hostConversationsQuery,
    { context: API_V2_CONTEXT, variables: { accountSlug } },
  );

  const conversations = data?.account?.conversations?.nodes || [];
  const totalCount = data?.account?.conversations?.totalCount || 0;

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsCreating(false);
    setIsDrawerOpen(true);
  };

  const handleRowClick = (row: Row<Conversation>) => {
    handleConversationClick(row.original.id);
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setIsCreating(true);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedConversationId(null);
    setIsCreating(false);
  };

  const handleConversationCreated = (conversation: { id: string }) => {
    setIsCreating(false);
    setSelectedConversationId(conversation.id);
    // Keep drawer open to show the newly created conversation
  };

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            defaultMessage="Private conversations between your collective and fiscal host for ongoing communication, questions, and clarifications."
            id="host.conversations.description"
          />
        </p>
        <Button size="sm" className="whitespace-nowrap" onClick={handleNewConversation}>
          <Plus className="mr-2 h-4 w-4" />
          <FormattedMessage defaultMessage="New Conversation" id="host.conversations.new" />
        </Button>
      </div>

      <ConversationsTable
        conversations={conversations}
        loading={loading}
        totalCount={totalCount}
        onRowClick={handleRowClick}
      />

      {/* Create conversation drawer */}
      <Sheet open={isCreating} onOpenChange={open => !open && handleCloseDrawer()}>
        <SheetContent className="flex max-w-2xl flex-col overflow-hidden p-0">
          <DrawerHeader
            actions={{}}
            dropdownTriggerRef={dropdownTriggerRef}
            entityName={<FormattedMessage defaultMessage="New Conversation" id="host.conversations.new" />}
            entityIdentifier={null}
            entityLabel={null}
          />
          <div className="grow overflow-auto px-6 py-4">
            <CreateHostConversationForm
              accountSlug={accountSlug}
              onSuccess={handleConversationCreated}
              onCancel={handleCloseDrawer}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* View conversation drawer */}
      <ConversationDrawer
        open={isDrawerOpen && !isCreating}
        onClose={handleCloseDrawer}
        conversationId={selectedConversationId || undefined}
      />
    </div>
  );
}
