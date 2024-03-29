import React from 'react';
import { FormattedMessage } from 'react-intl';

import { getPayoutProfiles } from '../../lib/expenses';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import DateTime from '../DateTime';
import ExpenseAmountBreakdown from '../expenses/ExpenseAmountBreakdown';
import ExpenseAttachedFiles from '../expenses/ExpenseAttachedFiles';
import PayoutMethodData from '../expenses/PayoutMethodData';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LinkCollective from '../LinkCollective';
import LocationAddress from '../LocationAddress';
import { PayoutMethodLabel } from '../PayoutMethodLabel';
import UploadedFilePreview from '../UploadedFilePreview';

import { InvitedPayeeLabel } from './InvitedPayeeLabel';
import { ExpenseForm, ExpenseItem } from './useExpenseForm';

type ExpenseSummaryFormProps = {
  form: ExpenseForm;
  slug: string;
};

export function ExpenseSummaryForm(props: ExpenseSummaryFormProps) {
  const loggedInAccount = props.form.options.loggedInAccount;
  const payoutMethod = React.useMemo(() => {
    const profiles = getPayoutProfiles(loggedInAccount);
    const selectedProfile = profiles.find(p => p.slug === props.form.values.payeeSlug);
    return selectedProfile?.payoutMethods?.find(p => p.id === props.form.values.payoutMethodId);
  }, [loggedInAccount, props.form.values.payoutMethodId, props.form.values.payeeSlug]);

  const account = props.form.options.account;
  const payee = props.form.options.payee;
  const expenseCategory =
    account && 'host' in account && account.host
      ? account.host.accountingCategories.nodes.find(c => c.id === props.form.values.accountingCategoryId)
      : null;

  const submitter = props.form.options.submitter;

  const invitePayee = props.form.values.invitePayee;
  const invitePayoutMethod = invitePayee && 'payoutMethod' in invitePayee ? invitePayee.payoutMethod : null;

  const taxes = React.useMemo(
    () => (props.form.values.tax ? [{ ...props.form.values.tax, type: props.form.options.taxType }] : []),
    [props.form.values.tax, props.form.options.taxType],
  );

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage defaultMessage="Expense details" />
      </h1>
      <div className="rounded-lg border border-slate-200 p-8">
        <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">{props.form.values.title}</h1>

        <div className="mb-4 flex items-center gap-2">
          {expenseCategory && (
            <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs text-slate-800">
              {expenseCategory.friendlyName || expenseCategory.name}
            </span>
          )}

          {expenseCategory && props.form.values.tags?.length > 0 && <div className="h-6 border-l-2 border-slate-200" />}

          {props.form.values.tags?.length > 0 &&
            props.form.values.tags.map(tag => (
              <span
                key={tag}
                className="rounded-xl rounded-es-none rounded-ss-none bg-slate-100 px-3 py-1 text-xs text-slate-800"
              >
                {tag}
              </span>
            ))}
        </div>

        <div className="mb-8 flex gap-2">
          <div>
            <FormattedMessage
              id="Expense.SubmittedBy"
              defaultMessage="Submitted by {name}"
              values={{
                name: (
                  <AccountHoverCard
                    account={submitter}
                    trigger={
                      <span>
                        <LinkCollective collective={submitter} noTitle>
                          <span className="font-medium text-foreground underline hover:text-primary">
                            {submitter ? (
                              submitter.name
                            ) : (
                              <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />
                            )}
                          </span>
                        </LinkCollective>
                      </span>
                    }
                  />
                ),
              }}
            />
          </div>
          <div className="text-slate-700">•</div>
          <div>
            <DateTime value={new Date()} dateStyle="medium" />
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <span className="font-bold">
            <FormattedMessage defaultMessage="Expense items" />
          </span>
          <hr className="flex-grow border-neutral-300" />
        </div>

        <div className="mb-8 flex flex-col gap-2 text-sm">
          {(props.form.values.expenseItems || []).map((ei, i) => (
            // index is the only stable key available here
            // eslint-disable-next-line react/no-array-index-key
            <ExpenseItemSummary key={i} expenseItem={ei} />
          ))}
        </div>

        <div className="mb-8">
          <ExpenseAmountBreakdown
            currency={props.form.values.expenseCurrency}
            items={(props.form.values.expenseItems || []).map(ei => ({ ...ei, amountV2: ei.amount }))}
            taxes={taxes}
          />
        </div>

        {props.form.values.expenseAttachedFiles?.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="font-bold">
                <FormattedMessage id="Expense.Attachments" defaultMessage="Attachments" />
              </span>
              <hr className="flex-grow border-neutral-300" />
            </div>

            <ExpenseAttachedFiles files={props.form.values.expenseAttachedFiles} openFileViewer={() => {}} />
          </div>
        )}

        <div className="mb-4 flex items-center gap-2">
          <span className="font-bold">
            <FormattedMessage defaultMessage="Additional information" />
          </span>
          <hr className="flex-grow border-neutral-300" />
        </div>

        <div className="grid grid-flow-col grid-cols-1 grid-rows-3 gap-1 sm:grid-cols-3 sm:grid-rows-1">
          <div className="flex-1 rounded border border-slate-200 p-4">
            <div className="mb-3 text-xs font-medium uppercase text-slate-700">
              <FormattedMessage defaultMessage="Who is paying?" />
            </div>
            <span className="mb-3 flex items-center gap-2 text-sm font-medium leading-5 text-slate-800">
              <Avatar collective={account} radius={24} />
              {account?.name}
            </span>
            <div className="text-sm font-bold text-slate-700">
              <FormattedMessage defaultMessage="Collective balance" />
            </div>
            <div className="text-sm">
              <FormattedMoneyAmount
                amountStyles={{ fontWeight: 'normal' }}
                amount={account?.stats?.balance?.valueInCents}
                currency={account?.stats?.balance?.currency}
              />
            </div>
          </div>

          <div className="flex-1 rounded border border-slate-200 p-4">
            <div className="mb-3 text-xs font-medium uppercase text-slate-700">
              <FormattedMessage id="Expense.PayTo" defaultMessage="Pay to" />
            </div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium leading-5 text-slate-800">
              {payee ? (
                <React.Fragment>
                  <Avatar collective={payee} radius={24} />
                  {payee?.name}
                </React.Fragment>
              ) : invitePayee ? (
                <InvitedPayeeLabel invitePayee={invitePayee} />
              ) : null}
            </div>
            {payee?.location && (
              <React.Fragment>
                <div>
                  <span className="mb-3 text-sm font-bold text-slate-700">
                    <FormattedMessage defaultMessage="Private address" /> <PrivateInfoIcon />
                  </span>
                </div>
                <div>
                  <LocationAddress location={payee?.location} />
                </div>
              </React.Fragment>
            )}
          </div>

          {(payoutMethod || invitePayoutMethod) && (
            <div className="flex-1 rounded border border-slate-200 p-4">
              <div className="mb-3 text-xs font-medium uppercase text-slate-700">
                <FormattedMessage id="SecurityScope.PayoutMethod" defaultMessage="Payout Method" />
              </div>
              <div className="mb-3 overflow-hidden text-ellipsis">
                <PayoutMethodLabel showIcon payoutMethod={payoutMethod || invitePayoutMethod} />
              </div>
              <div>
                <span className="mb-3 text-sm font-bold text-slate-700">
                  <FormattedMessage id="Details" defaultMessage="Details" /> <PrivateInfoIcon />
                </span>
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                <PayoutMethodData showLabel={false} payoutMethod={payoutMethod || invitePayoutMethod} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExpenseItemSummary(props: { expenseItem: ExpenseItem }) {
  return (
    <div className="flex justify-between gap-4">
      {props.expenseItem.url && (
        <div className="h-[64px] w-[64px]">
          <UploadedFilePreview
            className="inline-block h-[112px] w-[112px]"
            size={64}
            url={props.expenseItem.url}
            maxHeight={64}
          />
        </div>
      )}

      <div className="flex flex-grow flex-col justify-between">
        <div className="">{props.expenseItem.description}</div>
        <div>
          <DateTime value={props.expenseItem.incurredAt} dateStyle="medium" />
        </div>
      </div>
      <div className="self-center">
        <FormattedMoneyAmount
          amount={props.expenseItem.amount.valueInCents}
          currency={props.expenseItem.amount.currency}
        />
      </div>
    </div>
  );
}
