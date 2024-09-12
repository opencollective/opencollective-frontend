import React from 'react';
import { FormattedMessage } from 'react-intl';

import Image from '../Image';
import MessageBox from '../MessageBox';

import DeclineExpenseInviteButton from './DeclineExpenseInviteButton';

type ExpenseInviteWelcomeProps = {
  expense: {
    id: string;
    legacyId: number;
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
    <div className="mb-4 flex gap-4 rounded-md border border-[#DCDDE0] px-6 py-3">
      <div>
        <Image alt="" src="/static/images/pidgeon.png" width={132} height={132} />
      </div>
      <div className="grow">
        <div className="mb-2 text-sm font-medium">
          <FormattedMessage defaultMessage="You have been invited to submit an expense" id="wyn788" />
        </div>
        <div className="mb-2 text-sm">
          <FormattedMessage
            defaultMessage="Fill out the form bellow to complete your information and get paid."
            id="RUMC/J"
          />
        </div>
        {props.expense.draft?.recipientNote && (
          <div className="mb-4 mt-4 text-sm">
            <div className="mb-2 text-sm font-medium">
              <FormattedMessage defaultMessage="A note was added by the expense inviter" id="XK55rP" />
            </div>

            <MessageBox type="info">
              <div>{props.expense.draft.recipientNote}</div>
            </MessageBox>
          </div>
        )}
        {props.expense.permissions.canDeclineExpenseInvite && (
          <div className="mt-4">
            <DeclineExpenseInviteButton expense={props.expense} draftKey={props.draftKey} />
          </div>
        )}
      </div>
    </div>
  );
}
