import React from 'react';
import { useQuery } from '@apollo/client';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { Markup } from 'interweave';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import CommentForm from '../../conversations/CommentForm';
import EmojiReactionPicker from '../../conversations/EmojiReactionPicker';
import EmojiReactions from '../../conversations/EmojiReactions';
import Thread from '../../conversations/Thread';
import { updatesViewQuery } from '../../dashboard/sections/updates/queries';
import Link from '../../Link';
import { Button } from '../../ui/Button';
import { Skeleton } from '../../ui/Skeleton';

import { UpdateHeader } from './UpdateHeader';

export function SingleUpdate() {
  const router = useRouter();

  const { data, loading } = useQuery(updatesViewQuery, {
    variables: {
      id: router.query.updateSlug,
    },
    context: API_V2_CONTEXT,
  });
  const update = data?.update;
  const comments = update?.comments;

  return (
    <div className="flex-1 bg-background">
      <div className="relative mx-auto flex max-w-[650px] flex-col gap-8 px-6 py-12">
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/preview/${router.query.collectiveSlug}/updates`} scroll={false}>
              <ArrowLeft size={16} className="inline" /> All updates
            </Link>
          </Button>
        </div>
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
      </div>
    </div>
  );
}
