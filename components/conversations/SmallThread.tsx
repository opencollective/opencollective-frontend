import React from 'react';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import Avatar from '../Avatar';
import { Button } from '../ui/Button';

import { isSupportedActivity } from './activity-helpers';
import Comment from './Comment';
import CommentForm from './CommentForm';
import SmallThreadActivity from './SmallThreadActivity';
import type { SmallThreadProps } from './types';

export default function SmallThread(props: SmallThreadProps) {
  const [replyingToComment, setReplyingToComment] = React.useState(null);
  const { LoggedInUser } = useLoggedInUser();

  const [loading, setLoading] = React.useState(false);

  if (!props.canComment && (!props.items || props.items.length === 0)) {
    return null;
  }

  const isAdmin = LoggedInUser && LoggedInUser.isAdminOfCollective(props.collective);

  const handleLoadMore = async () => {
    setLoading(true);
    await props.fetchMore();
    setLoading(false);
  };

  return (
    <React.Fragment>
      {props.canComment && (
        <div className="flex gap-4 pb-4">
          <div className="relative hidden sm:block">
            <div className="absolute -bottom-4 left-5 top-10 border-l" />
            <Avatar collective={LoggedInUser.collective} radius={40} />
          </div>
          <div className="flex-grow">
            <CommentForm
              {...props.CommentEntity}
              submitButtonJustify="end"
              submitButtonVariant="outline"
              minHeight={60}
              isDisabled={loading}
              replyingToComment={replyingToComment}
              onSuccess={props.onCommentCreated}
              canUsePrivateNote={props.canUsePrivateNote}
              defaultType={props.defaultType}
            />
          </div>
        </div>
      )}
      {/* Override the parent padding with negative margins to make sure the "Note" amber background can take the full width */}
      <div className="mx-[-24px]">
        <div data-cy="thread">
          {props.items.map(item => {
            switch (item.__typename) {
              case 'Comment': {
                return (
                  <Comment
                    key={`comment-${item.id}`}
                    comment={item}
                    variant="small"
                    canDelete={isAdmin || Boolean(LoggedInUser && LoggedInUser.canEditComment(item))}
                    canEdit={Boolean(LoggedInUser && LoggedInUser.canEditComment(item))}
                    canReply={Boolean(LoggedInUser)}
                    onDelete={props.onCommentDeleted}
                    reactions={item.reactions}
                    onReplyClick={setReplyingToComment}
                  />
                );
              }
              case 'Activity':
                return !isSupportedActivity(item) ? null : (
                  <SmallThreadActivity key={`activity-${item.id}`} activity={item} />
                );
              default:
                return null;
            }
          })}
          {props.hasMore && props.fetchMore && (
            <div className="mt-2 flex justify-center">
              <Button variant="outline" onClick={handleLoadMore} loading={loading} className="capitalize">
                <FormattedMessage id="loadMore" defaultMessage="load more" /> ↓
              </Button>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}
