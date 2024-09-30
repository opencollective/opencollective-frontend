import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { AccountHoverCardFieldsFragment } from '../../lib/graphql/types/v2/graphql';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import DateTime from '../DateTime';
import Image from '../Image';

import DeclineExpenseInviteButton from './DeclineExpenseInviteButton';

type ExpenseInviteWelcomeProps = {
  expense: {
    id: string;
    legacyId: number;
    createdAt: Date;
    createdByAccount: AccountHoverCardFieldsFragment;
    draft?: {
      recipientNote?: string;
    };
    permissions: {
      canDeclineExpenseInvite?: boolean;
    };
  };
  draftKey?: string;
};

export default function ExpenseInviteWelcome(props: ExpenseInviteWelcomeProps) {
  return (
    <React.Fragment>
      <div className="mb-4 items-center gap-4 rounded-md border border-[#DCDDE0] px-6 py-3 md:flex">
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
          {props.expense.permissions.canDeclineExpenseInvite && (
            <div className="mt-2">
              <DeclineExpenseInviteButton expense={props.expense} draftKey={props.draftKey} />
            </div>
          )}
        </div>
      </div>

      {props.expense.draft?.recipientNote && (
        <div className="mb-4 rounded-md border border-[#DCDDE0] px-6 py-3">
          <div className="mb-3 text-lg font-bold">
            <FormattedMessage defaultMessage="Invitation note" id="WcjKTY" />
          </div>

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
      )}
    </React.Fragment>
  );
}
