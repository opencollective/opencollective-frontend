import React from 'react';
import { FormattedMessage } from 'react-intl';

import { type Comment, CommentType } from '../../lib/graphql/types/v2/graphql';

import Avatar from '../Avatar';
import DateTime from '../DateTime';
import LinkCollective from '../LinkCollective';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

const formatPrivateNoteLabel = msg => {
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help underline decoration-slate-400 decoration-dashed">{msg}</TooltipTrigger>
      <TooltipContent>
        <FormattedMessage defaultMessage="Private notes are only visible to you and other Host admins." id="0b9yMU" />
      </TooltipContent>
    </Tooltip>
  );
};

export const CommentMetadata = ({
  comment,
  withoutAvatar = false,
}: {
  withoutAvatar: boolean;
  comment: Pick<Comment, 'createdAt' | 'type'> & {
    account?: { slug: string };
    fromAccount?: React.ComponentProps<typeof Avatar>['collective'];
  };
}) => {
  return (
    <div className="flex">
      {!withoutAvatar && (
        <div className="mr-3">
          <LinkCollective collective={comment.fromAccount}>
            <Avatar collective={comment.fromAccount} className="h-10 w-10 rounded-full" />
          </LinkCollective>
        </div>
      )}
      <div className="flex flex-col">
        <div className="mb-1 text-sm">
          <LinkCollective
            collective={comment.fromAccount}
            withHoverCard
            className="truncate font-medium text-slate-800"
            hoverCardProps={{
              hoverCardContentProps: { side: 'top' },
              includeAdminMembership: { accountSlug: comment.account?.slug, hostSlug: comment.account?.['host']?.slug },
            }}
          >
            {comment.fromAccount?.name || <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />}
          </LinkCollective>
          {comment.type === CommentType.PRIVATE_NOTE && (
            <span className="ml-1 text-slate-700">
              <FormattedMessage
                defaultMessage="added a <strong>private note</strong>"
                id="vZOjHk"
                values={{ strong: formatPrivateNoteLabel }}
              />
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          <FormattedMessage
            defaultMessage="on {date}"
            id="mzGohi"
            values={{ date: <DateTime value={comment.createdAt} /> }}
          />
        </p>
      </div>
    </div>
  );
};
