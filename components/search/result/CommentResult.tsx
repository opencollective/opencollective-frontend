import React from 'react';
import { Markup } from 'interweave';

import Avatar from '../../Avatar';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';
import type { CommentResultData } from '../useRecentlyVisited';

// TODO i18n
export function CommentResult({ comment, highlights }: { comment: CommentResultData; highlights?: SearchHighlights }) {
  const highlightFields = getHighlightsFields(highlights, ['html']);
  const otherHighlight = Object.values(highlightFields.others)[0]?.[0];
  return (
    <div className="flex flex-1 items-center gap-2">
      <Avatar collective={comment.fromAccount} size={36} />

      <div className="overflow-hidden">
        <div className="truncate">
          Comment from <span className="text-foreground">{comment.fromAccount.name}</span>
          {' on '}
          {comment.update ? (
            <span>Update #{comment.update.legacyId}</span>
          ) : comment.expense ? (
            <span>Expense #{comment.expense.legacyId}</span>
          ) : comment.hostApplication ? (
            <span>Host Application #{comment.hostApplication.id}</span>
          ) : comment.order ? (
            <span>Order #{comment.order.legacyId}</span>
          ) : comment.conversation ? (
            <span>Conversation</span>
          ) : (
            <span>Unknown</span>
          )}
        </div>
        <div className="truncate font-medium text-muted-foreground">
          <Markup allowList={['mark']} content={highlightFields.top.html?.[0] || comment.html} />
        </div>
        {otherHighlight && (
          <div className="truncate">
            <Markup className="text-muted-foreground italic" allowList={['mark']} content={otherHighlight} />
          </div>
        )}
      </div>
    </div>
  );
}
