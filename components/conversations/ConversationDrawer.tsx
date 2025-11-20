import React from 'react';
import { gql, useApolloClient, useQuery } from '@apollo/client';
import { cloneDeep, uniqBy, update } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
// GraphQL types will be generated after schema update
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConversationDrawerQuery = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConversationDrawerQueryVariables = any;

import { accountHoverCardFields } from '../AccountHoverCard';
import Avatar from '../Avatar';
import { CopyID } from '../CopyId';
import DateTime from '../DateTime';
import DrawerHeader from '../DrawerHeader';
import Link from '../Link';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { Sheet, SheetContent } from '../ui/Sheet';
import { Skeleton } from '../ui/Skeleton';

import CommentForm from './CommentForm';
import { commentFieldsFragment } from './graphql';
import Thread from './Thread';

const conversationDrawerQuery = gql`
  query ConversationDrawer($conversationId: String!) {
    conversation(id: $conversationId) {
      id
      slug
      title
      summary
      createdAt
      updatedAt
      tags
      visibility
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
        ...AccountHoverCardFields
      }
      body {
        id
        ...CommentFields
      }
      comments(limit: 100, offset: 0) {
        totalCount
        nodes {
          id
          ...CommentFields
        }
      }
      followers(limit: 50) {
        totalCount
        nodes {
          id
          slug
          type
          name
          imageUrl(height: 64)
        }
      }
      stats {
        id
        commentsCount
      }
    }
  }
  ${commentFieldsFragment}
  ${accountHoverCardFields}
`;

type ConversationDrawerProps = {
  open: boolean;
  onClose: () => void;
  conversationId?: string;
};

export function ConversationDrawer({ open, onClose, conversationId }: ConversationDrawerProps) {
  const apolloClient = useApolloClient();

  const { data, loading, error, refetch } = useQuery<ConversationDrawerQuery, ConversationDrawerQueryVariables>(
    conversationDrawerQuery,
    {
      context: API_V2_CONTEXT,
      variables: { conversationId: conversationId || '' },
      skip: !open || !conversationId,
    },
  );

  const conversation = data?.conversation;
  const isLoading = !data || loading;

  // Helper function to clone the current query cache data
  const clonePageQueryCacheData = React.useCallback(() => {
    if (!conversationId) {
      return [null, null, null];
    }

    const query = conversationDrawerQuery;
    const variables = { conversationId };
    const cachedData = apolloClient.readQuery({ query, variables });
    const data = cloneDeep(cachedData);

    return [data, query, variables];
  }, [conversationId, apolloClient]);

  // Handle new comment added - update cache and refetch

  const onCommentAdded = React.useCallback(
    async (comment: any) => {
      // Add comment to cache if not already fetched
      const [data, query, variables] = clonePageQueryCacheData();
      if (data && query && variables) {
        update(data, 'conversation.comments.nodes', comments => uniqBy([...comments, comment], 'id'));
        update(data, 'conversation.comments.totalCount', totalCount => totalCount + 1);
        apolloClient.writeQuery({ query, variables, data });

        // Async refetch to make sure everything's up to date
        if (refetch) {
          refetch().catch(() => {
            // Silent error handling for background refetch - errors are expected
          });
        }
      }
    },
    [clonePageQueryCacheData, apolloClient, refetch],
  );

  // Handle comment deleted - remove from cache and refetch

  const onCommentDeleted = React.useCallback(
    async (comment: any) => {
      const [data, query, variables] = clonePageQueryCacheData();
      if (data && query && variables) {
        update(data, 'conversation.comments.nodes', comments => comments.filter(c => c.id !== comment.id));
        update(data, 'conversation.comments.totalCount', totalCount => Math.max(0, totalCount - 1));
        apolloClient.writeQuery({ query, variables, data });

        // Async refetch to make sure everything's up to date
        if (refetch) {
          refetch().catch(() => {
            // Silent error handling for background refetch - errors are expected
          });
        }
      }
    },
    [clonePageQueryCacheData, apolloClient, refetch],
  );

  return (
    <Sheet open={open} onOpenChange={open => !open && onClose()}>
      <SheetContent className="flex max-w-2xl flex-col overflow-hidden">
        <DrawerHeader
          actions={{}}
          dropdownTriggerRef={React.useRef(null)}
          entityName={<FormattedMessage defaultMessage="Conversation" id="conversation.drawer.title" />}
          entityIdentifier={
            conversationId ? (
              <CopyID
                value={conversationId}
                tooltipLabel={
                  <FormattedMessage defaultMessage="Copy conversation ID" id="conversation.drawer.copyId" />
                }
              >
                #{conversationId}
              </CopyID>
            ) : null
          }
          entityLabel={
            isLoading ? (
              <Skeleton className="h-6 w-56" />
            ) : (
              <div className="text-base font-semibold text-foreground">{conversation?.title}</div>
            )
          }
        />

        <div className="grow overflow-auto px-8 py-4">
          {error ? (
            <MessageBoxGraphqlError error={error} />
          ) : isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : conversation ? (
            <div className="space-y-6">
              {conversation.body && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-start space-x-3">
                    <Avatar collective={conversation.fromAccount} radius={32} />
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-2">
                        <Link href={`/${conversation.fromAccount.slug}`}>
                          <span className="font-medium text-foreground">{conversation.fromAccount.name}</span>
                        </Link>
                        <span className="text-sm text-muted-foreground">
                          <DateTime value={conversation.body.createdAt} />
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: conversation.body.html }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments thread */}
              {conversation.comments.totalCount > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    <FormattedMessage
                      defaultMessage="Comments ({count})"
                      id="conversation.drawer.comments.title"
                      values={{ count: conversation.comments.totalCount }}
                    />
                  </h3>
                  <Thread
                    collective={conversation.account}
                    items={conversation.comments.nodes}
                    hasMore={false}
                    onCommentDeleted={onCommentDeleted}
                    getClickedComment={() => null}
                  />
                </div>
              ) : (
                <hr />
              )}

              {/* Add comment form */}
              <div className="pt-6">
                <h3 className="mb-4 text-lg font-semibold">
                  <FormattedMessage defaultMessage="Add a comment" id="conversation.drawer.addComment" />
                </h3>
                <CommentForm
                  id="new-comment"
                  ConversationId={conversation.id}
                  onSuccess={onCommentAdded}
                  richTextEditorVersion="simplified"
                />
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
