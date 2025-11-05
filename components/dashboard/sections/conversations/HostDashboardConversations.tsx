import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Plus } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { Conversation } from '../../../../lib/graphql/types/v2/schema';

import { ConversationDrawer } from '../../../conversations/ConversationDrawer';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';

import ConversationsTable from './ConversationsTable';
import { NewConversationModal } from './NewConversationModal';

// GraphQL types will be generated after schema update
type HostDashboardConversationsQuery = unknown;
type HostDashboardConversationsQueryVariables = unknown;

const hostDashboardConversationsQuery = gql`
  query HostDashboardConversations($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      slug
      name
      conversations(limit: 50, visibility: ADMINS_AND_HOST) {
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
          account {
            id
            slug
            name
            type
            imageUrl
          }
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

type HostDashboardConversationsProps = {
  accountSlug: string;
  account?: unknown;
  subpath?: string[];
  isDashboard?: boolean;
};

export function HostDashboardConversations({ accountSlug }: HostDashboardConversationsProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  const { data, loading, error } = useQuery<HostDashboardConversationsQuery, HostDashboardConversationsQueryVariables>(
    hostDashboardConversationsQuery,
    {
      context: API_V2_CONTEXT,
      variables: { hostSlug: accountSlug },
    },
  );

  const conversations = (data as { host?: { conversations?: { nodes?: Conversation[] } } })?.host?.conversations?.nodes || [];

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedConversationId(null);
  };

  const handleNewConversationSuccess = () => {
    // The conversation will be automatically refetched due to refetchQueries in the mutation
    setIsNewConversationModalOpen(false);
  };

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <FormattedMessage defaultMessage="Host Conversations" id="host.dashboard.conversations.title" />
          </h1>
          <p className="mt-2 text-muted-foreground">
            <FormattedMessage
              defaultMessage="Manage conversations with hosted collectives for ongoing communication, questions, and clarifications."
              id="host.dashboard.conversations.description"
            />
          </p>
        </div>
        <Button onClick={() => setIsNewConversationModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          <FormattedMessage defaultMessage="New Conversation" id="host.dashboard.conversations.new" />
        </Button>
      </div>

      <ConversationsTable
        conversations={{ nodes: conversations }}
        openConversation={handleConversationClick}
        loading={loading}
        nbPlaceholders={10}
      />

      <ConversationDrawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        conversationId={selectedConversationId || undefined}
      />

      <NewConversationModal
        hostSlug={accountSlug}
        open={isNewConversationModalOpen}
        onOpenChange={setIsNewConversationModalOpen}
        onSuccess={handleNewConversationSuccess}
      />
    </div>
  );
}
