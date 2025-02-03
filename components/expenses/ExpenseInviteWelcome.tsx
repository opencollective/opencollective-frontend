import React from 'react';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import type { AccountHoverCardFieldsFragment } from '../../lib/graphql/types/v2/graphql';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import DateTime from '../DateTime';
import Image from '../Image';
import { Button } from '../ui/Button';

import DeclineExpenseInviteButton from './DeclineExpenseInviteButton';

type ExpenseInviteWelcomeProps = {
  className?: string;
  expense: {
    id: string;
    legacyId: number;
    createdAt: Date;
    createdByAccount?: AccountHoverCardFieldsFragment;
    draft?: {
      recipientNote?: string;
    };
    permissions: {
      canDeclineExpenseInvite?: boolean;
    };
  };
  draftKey?: string;
  onExpenseInviteDeclined?: () => void;
  onContinueSubmissionClick?: () => void;
};

export default function ExpenseInviteWelcome(props: ExpenseInviteWelcomeProps) {
  return (
    <div className={clsx('items-center gap-4 md:flex', props.className)}>
      <Image
        className="hidden object-contain md:block"
        alt=""
        src="/static/images/pidgeon.png"
        width={132}
        height={132}
      />
      <div className="grow">
        <div className="mb-2 text-lg font-bold">
          <FormattedMessage defaultMessage="You have been invited to submit an expense" id="wyn788" />
        </div>
        <div className="mb-2 text-sm">
          <FormattedMessage
            defaultMessage="Some details were pre-filled for you by the person who invited you. Make sure you double check all the information that was pre-filled and correct it if necessary. If you have any questions contact this person directly off-platform."
            id="5YI3tk"
          />
        </div>
        {(props.expense.permissions.canDeclineExpenseInvite || props.onContinueSubmissionClick) && (
          <div className="mt-2 flex gap-2">
            {props.expense.permissions.canDeclineExpenseInvite && (
              <div>
                <DeclineExpenseInviteButton
                  onExpenseInviteDeclined={props.onExpenseInviteDeclined}
                  expense={props.expense}
                  draftKey={props.draftKey}
                />
              </div>
            )}
            {props.onContinueSubmissionClick && (
              <Button size="xs" onClick={() => props.onContinueSubmissionClick()}>
                <FormattedMessage defaultMessage="Continue submission" id="rfhXwf" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type ExpenseInviteRecipientNoteProps = {
  className?: string;
  expense: {
    id: string;
    legacyId: number;
    createdAt: Date;
    createdByAccount?: AccountHoverCardFieldsFragment;
    draft?: {
      recipientNote?: string;
    };
    permissions: {
      canDeclineExpenseInvite?: boolean;
    };
  };
};

export function ExpenseInviteRecipientNote(props: ExpenseInviteRecipientNoteProps) {
  return (
    props.expense.draft?.recipientNote && (
      <div className={props.className}>
        <div className="mb-3">
          <AccountHoverCard
            account={props.expense.createdByAccount}
            trigger={
              <div className="flex items-center gap-2 truncate">
                <Avatar collective={props.expense.createdByAccount} radius={24} />
                <div>
                  <div className="text-sm font-medium">
                    <FormattedMessage
                      defaultMessage="By {userName}"
                      id="ByUser"
                      values={{
                        userName: props.expense.createdByAccount.name,
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <DateTime value={props.expense.createdAt} />
                  </div>
                </div>
              </div>
            }
          />
        </div>

        <div className="text-sm">{props.expense.draft.recipientNote}</div>
      </div>
    )
  );
}
