import React from 'react';
import { useQuery } from '@apollo/client';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { Markup } from 'interweave';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import CommentForm from '../../conversations/CommentForm';
import EmojiReactionPicker from '../../conversations/EmojiReactionPicker';
import EmojiReactions from '../../conversations/EmojiReactions';
import Thread from '../../conversations/Thread';
import { updatesViewQuery } from '../../dashboard/sections/updates/queries';
import { Skeleton } from '../../ui/Skeleton';

import { UpdateHeader } from './UpdateHeader';

export function SingleUpdate({ updateId }) {
  const { data, loading } = useQuery(updatesViewQuery, {
    variables: {
      id: updateId,
    },
    context: API_V2_CONTEXT,
  });
  const update = data?.update;
  const comments = update?.comments;

  return (
    <div className="flex flex-col gap-3">
      <UpdateHeader update={update} loading={loading} />
      <Separator className="mb-3" />
      <div className="prose prose-slate">
        {loading ? <Skeleton className="h-48 w-full" /> : <Markup noWrap content={update.html} allowAttributes />}
      </div>
      {update && (
        <div className="flex gap-1">
          <EmojiReactions reactions={update?.reactions} />
          <EmojiReactionPicker update={update} />
        </div>
      )}

      <Separator className="mt-3" />
      {update?.userCanSeeUpdate && (
        <footer>
          {comments?.nodes?.length > 0 && (
            <Thread
              // collective={account}
              hasMore={comments?.nodes?.length < comments?.totalCount}
              // fetchMore={handleFetchMoreComments}
              items={comments?.nodes}
              // onCommentDeleted={refetchUpdate}
              // getClickedComment={setReplyingToComment}
            />
          )}
          <div className="flex justify-center">
            <CommentForm
              id="new-update"
              UpdateId={update.id}
              // onSuccess={refetchUpdate}
              // replyingToComment={replyingToComment}
            />
          </div>
        </footer>
      )}
    </div>
  );
}
