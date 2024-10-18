import React from 'react';
import clsx from 'clsx';
import { NotepadText } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import commentTypes from '../../lib/constants/commentTypes';
import { cn } from '../../lib/utils';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import HTMLContent from '../HTMLContent';
import InlineEditField from '../InlineEditField';
import RichTextEditor from '../RichTextEditor';

import CommentActions from './CommentActions';
import { CommentMetadata } from './CommentMetadata';
import { editCommentMutation, mutationOptions } from './graphql';
import type { CommentProps } from './types';

export default function SmallComment(props: CommentProps) {
  const [isEditing, setEditing] = React.useState(false);
  const hasActions = !isEditing;
  const comment = props.comment;
  const anchorHash = `comment-${new Date(comment.createdAt).getTime()}`;
  const isPrivateNote = comment.type === commentTypes.PRIVATE_NOTE;

  return (
    <div
      className={cn(
        'relative w-full border-slate-200 px-6 py-4 first:border-none [&:last-child_.timeline-indicator]:-bottom-4 [&:last-child_.timeline-separator]:hidden',
        isPrivateNote && 'bg-amber-50',
      )}
      data-cy="comment"
      id={anchorHash}
    >
      <div className="timeline-separator absolute bottom-0 left-11 right-0 border-b" />
      <div className="flex justify-between">
        <div className="flex gap-4">
          <div className="relative">
            <div className={clsx('timeline-indicator absolute bottom-[-16px] left-[20px] top-[-16px] border-l')} />
            <AccountHoverCard
              account={comment.fromAccount}
              trigger={
                <div className="relative">
                  <Avatar collective={comment.fromAccount} radius={40} />
                  {isPrivateNote && (
                    <div className="absolute bottom-[-4px] right-[-4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-white shadow">
                      <NotepadText className="text-amber-500" size={13} />
                    </div>
                  )}
                </div>
              }
            />
          </div>
          <div>
            <CommentMetadata comment={comment} withoutAvatar />
            <div className="mt-4">
              <InlineEditField
                mutation={editCommentMutation}
                mutationOptions={mutationOptions}
                values={comment}
                field="html"
                canEdit={props.canEdit}
                canDelete={props.canDelete}
                isEditing={isEditing}
                showEditIcon={false}
                prepareVariables={(comment, html) => ({ comment: { id: comment.id, html } })}
                disableEditor={() => setEditing(false)}
                warnIfUnsavedChanges
                required
              >
                {({ isEditing, setValue, setUploading }) =>
                  !isEditing ? (
                    <HTMLContent
                      fontSize="14px"
                      maxCollapsedHeight={140}
                      collapsable
                      collapsePadding={22}
                      content={comment.html}
                      data-cy="comment-body"
                      readMoreMessage={<FormattedMessage defaultMessage="Read more" id="ContributeCard.ReadMore" />}
                    />
                  ) : (
                    <RichTextEditor
                      kind="COMMENT"
                      defaultValue={comment.html}
                      onChange={e => setValue(e.target.value)}
                      fontSize="14px"
                      autoFocus
                      setUploading={setUploading}
                    />
                  )
                }
              </InlineEditField>
            </div>
          </div>
        </div>
        {hasActions && (
          <CommentActions
            comment={comment}
            anchorHash={anchorHash}
            isConversationRoot={props.isConversationRoot}
            canEdit={props.canEdit}
            canDelete={props.canDelete}
            canReply={props.canReply}
            onDelete={props.onDelete}
            onEditClick={() => setEditing(true)}
            onReplyClick={() => {
              props.onReplyClick(comment);
            }}
          />
        )}
      </div>
    </div>
  );
}
