import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { SearchCommentFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import Avatar from '../../Avatar';
import { Highlight } from '../Highlight';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';

export function CommentResult({
  comment,
  highlights,
}: {
  comment: SearchCommentFieldsFragment;
  highlights?: SearchHighlights;
}) {
  const highlightFields = getHighlightsFields(highlights, ['html']);
  const otherHighlight = Object.values(highlightFields.others)[0]?.[0];
  return (
    <div className="flex flex-1 items-center gap-2">
      <Avatar collective={comment.fromAccount} size={36} />

      <div className="overflow-hidden">
        <div className="truncate">
          <FormattedMessage
            id="CommentResult.commentFrom"
            defaultMessage="Comment from {name} on {context}"
            values={{
              name: <span className="text-foreground">{comment.fromAccount?.name || 'Incognito'}</span>,
              context: comment.update ? (
                <FormattedMessage defaultMessage="Update #{id}" id="VVgt/a" values={{ id: comment.update.legacyId }} />
              ) : comment.expense ? (
                <FormattedMessage
                  id="E9pJQz"
                  defaultMessage="Expense #{id}"
                  values={{ id: comment.expense.legacyId }}
                />
              ) : comment.hostApplication ? (
                <FormattedMessage
                  defaultMessage="Host Application #{id}"
                  id="a377gv"
                  values={{ id: comment.hostApplication.id }}
                />
              ) : comment.order ? (
                <FormattedMessage
                  defaultMessage="Contribution #{id}"
                  id="Siv4wU"
                  values={{ id: comment.order.legacyId }}
                />
              ) : comment.conversation ? (
                <FormattedMessage defaultMessage="Conversation" id="gegfoA" />
              ) : (
                <FormattedMessage defaultMessage="Unknown" id="5jeq8P" />
              ),
            }}
          />
        </div>
        <div className="truncate font-medium text-muted-foreground">
          <Highlight content={highlightFields.top.html?.[0] || comment.html} />
        </div>
        {otherHighlight && (
          <div className="truncate">
            <Highlight className="text-muted-foreground italic" content={otherHighlight} />
          </div>
        )}
      </div>
    </div>
  );
}
