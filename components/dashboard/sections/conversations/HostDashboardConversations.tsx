import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { MessageSquare, Plus } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
// GraphQL types will be generated after schema update
type HostDashboardConversationsQuery = any;
type HostDashboardConversationsQueryVariables = any;

import Avatar from '../../../Avatar';
import { ConversationDrawer } from '../../../conversations/ConversationDrawer';
import DateTime from '../../../DateTime';
import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Card, CardContent } from '../../../ui/Card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../../ui/Sheet';
import { Skeleton } from '../../../ui/Skeleton';

const hostDashboardConversationsQuery = gql`
  query HostDashboardConversations($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      slug
      name
      conversations(limit: 50, host: { slug: $hostSlug }, orderBy: { field: LAST_COMMENT_DATE, direction: DESC }) {
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
  account?: any;
  subpath?: string[];
  isDashboard?: boolean;
};

export function HostDashboardConversations({ accountSlug }: HostDashboardConversationsProps) {
  const intl = useIntl();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, loading, error } = useQuery<HostDashboardConversationsQuery, HostDashboardConversationsQueryVariables>(
    hostDashboardConversationsQuery,
    {
      context: API_V2_CONTEXT,
      variables: { hostSlug: accountSlug },
    },
  );

  const conversations = data?.host?.conversations?.nodes || [];
  const totalCount = data?.host?.conversations?.totalCount || 0;

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return intl.formatMessage({ defaultMessage: 'Public', id: 'conversation.visibility.public' });
      case 'ADMINS_AND_HOST':
        return intl.formatMessage({ defaultMessage: 'Private', id: 'conversation.visibility.private' });
      default:
        return visibility;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return 'info';
      case 'ADMINS_AND_HOST':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedConversationId(null);
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
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <FormattedMessage defaultMessage="New Conversation" id="host.dashboard.conversations.new" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                <FormattedMessage defaultMessage="New Conversation" id="host.dashboard.conversations.new" />
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                <FormattedMessage
                  defaultMessage="Creating new conversations is not yet implemented. Please use the existing conversations or contact collectives directly."
                  id="host.dashboard.conversations.new.notImplemented"
                />
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              <FormattedMessage defaultMessage="No conversations yet" id="host.dashboard.conversations.empty.title" />
            </h3>
            <p className="text-muted-foreground">
              <FormattedMessage
                defaultMessage="Start conversations with hosted collectives to discuss ongoing matters, answer questions, or provide clarifications."
                id="host.dashboard.conversations.empty.description"
              />
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map(conversation => (
            <Card
              key={conversation.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleConversationClick(conversation.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 items-start space-x-3">
                    <Avatar collective={conversation.account} radius={32} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center space-x-2">
                        <h3 className="truncate font-medium text-foreground">{conversation.title}</h3>
                        <Badge type={getVisibilityColor(conversation.visibility)} size="sm">
                          {getVisibilityLabel(conversation.visibility)}
                        </Badge>
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground">
                        <FormattedMessage
                          defaultMessage="With {collective} • Started by {author} on {date}"
                          id="host.dashboard.conversations.withCollective"
                          values={{
                            collective: (
                              <Link href={`/${conversation.account.slug}`} className="font-medium">
                                {conversation.account.name}
                              </Link>
                            ),
                            author: (
                              <Link href={`/${conversation.fromAccount.slug}`} className="font-medium">
                                {conversation.fromAccount.name}
                              </Link>
                            ),
                            date: <DateTime value={conversation.createdAt} />,
                          }}
                        />
                      </p>
                      <p className="line-clamp-2 text-sm text-foreground">{conversation.summary}</p>
                      {conversation.stats.commentsCount > 0 && (
                        <div className="mt-3 flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>
                            <FormattedMessage
                              defaultMessage="{count} comments"
                              id="host.dashboard.conversations.commentsCount"
                              values={{ count: conversation.stats.commentsCount }}
                            />
                          </span>
                          {conversation.lastCommentDate && (
                            <span>
                              <FormattedMessage
                                defaultMessage="Last activity: {date}"
                                id="host.dashboard.conversations.lastActivity"
                                values={{ date: <DateTime value={conversation.lastCommentDate} /> }}
                              />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalCount > conversations.length && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <FormattedMessage
                  defaultMessage="Showing {shown} of {total} conversations"
                  id="host.dashboard.conversations.showingCount"
                  values={{ shown: conversations.length, total: totalCount }}
                />
              </p>
            </div>
          )}
        </div>
      )}

      <ConversationDrawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        conversationId={selectedConversationId || undefined}
      />
    </div>
  );
}
