import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { getPayoutProfiles } from '../../lib/expenses';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { ExpenseSummaryStepQuery, ExpenseSummaryStepQueryVariables } from '../../lib/graphql/types/v2/graphql';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import DateTime from '../DateTime';
import ExpenseAttachedFiles from '../expenses/ExpenseAttachedFiles';
import { loggedInAccountExpensePayoutFieldsFragment } from '../expenses/graphql/fragments';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LinkCollective from '../LinkCollective';
import Loading from '../Loading';
import LocationAddress from '../LocationAddress';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { StepListItem } from '../ui/StepList';
import UploadedFilePreview from '../UploadedFilePreview';

import { ExpenseItem } from './ExpenseItemsForm';
import { PaymentMethodDetails, PayoutMethodLabel } from './PickPaymentMethodStep';
import { ExpenseStepDefinition } from './Steps';
import { ExpenseForm } from './useExpenseForm';

type ExpenseSummaryFormProps = {
  form: ExpenseForm;
  slug: string;
};

export const ExpenseSummaryStep: ExpenseStepDefinition = {
  Form: ExpenseSummaryForm,
  StepListItem: ExpenseSummaryStepListItem,
  hasError() {
    return false;
  },
};

function ExpenseSummaryForm(props: ExpenseSummaryFormProps) {
  const query = useQuery<ExpenseSummaryStepQuery, ExpenseSummaryStepQueryVariables>(
    gql`
      query ExpenseSummaryStep($collectiveSlug: String!, $slug: String!, $payeeSlug: String!) {
        account(slug: $collectiveSlug) {
          id
          name
          imageUrl
          slug
          stats {
            balance {
              valueInCents
              currency
            }
          }
          ... on AccountWithHost {
            host {
              ...HostFields
            }
          }
          ... on Organization {
            host {
              ...HostFields
            }
          }
        }

        submitter: account(slug: $slug) {
          id
          slug
          name
          imageUrl
        }

        payee: account(slug: $payeeSlug) {
          id
          slug
          name
          imageUrl
          location {
            address
            country
          }
        }

        loggedInAccount {
          id
          ...LoggedInAccountExpensePayoutFields
        }
      }

      fragment HostFields on Host {
        id
        name
        slug
        expensePolicy
        accountingCategories(kind: EXPENSE) {
          nodes {
            id
            name
            kind
            expensesTypes
            friendlyName
            code
            instructions
          }
        }
      }

      ${loggedInAccountExpensePayoutFieldsFragment}
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        collectiveSlug: props.form.values.collectiveSlug,
        slug: props.slug,
        payeeSlug: props.form.values.payeeSlug,
      },
    },
  );

  const loggedInAccount = query.data?.loggedInAccount;
  const payoutMethod = React.useMemo(() => {
    const profiles = getPayoutProfiles(loggedInAccount);
    const selectedProfile = profiles.find(p => p.slug === props.form.values.payeeSlug);
    return selectedProfile?.payoutMethods?.find(p => p.id === props.form.values.payoutMethodId);
  }, [loggedInAccount, props.form.values.payoutMethodId, props.form.values.payeeSlug]);

  if (query.loading) {
    return <Loading />;
  }

  if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  const account = query.data?.account;
  const expenseCategory =
    account && 'host' in account && account.host
      ? account.host.accountingCategories.nodes.find(c => c.id === props.form.values.accountingCategoryId)
      : null;

  const submitter = query.data?.submitter;

  const totalAmount = props.form.values.expenseItems.reduce((acc, i) => acc + i.amount.valueInCents, 0);

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
          {props.form.values.expenseItems.map((ei, i) => (
            // index is the only stable key available here
            // eslint-disable-next-line react/no-array-index-key
            <ExpenseItemSummary key={i} expenseItem={ei} />
          ))}
        </div>

        <div className="mb-8 text-right text-sm font-medium">
          <FormattedMessage
            defaultMessage="Total amount ({currency}): {amount}"
            values={{
              currency: props.form.values.expenseCurrency,
              amount: <FormattedMoneyAmount amount={totalAmount} currency={props.form.values.expenseCurrency} />,
            }}
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

        <div className="grid grid-flow-col grid-cols-3 gap-1">
          <div className="flex-1 rounded border border-slate-200 p-4">
            <div className="mb-3 text-xs font-medium uppercase text-slate-700">
              <FormattedMessage id="Collective" defaultMessage="Collective" />
            </div>
            <span className="mb-3 flex items-center gap-2 text-sm font-medium leading-5 text-slate-800">
              <Avatar collective={query.data?.account} radius={24} />
              {query.data?.account?.name}
            </span>
            <div className="text-sm font-bold text-slate-700">
              <FormattedMessage defaultMessage="Collective balance" />
            </div>
            <div className="text-sm">
              <FormattedMoneyAmount
                amountStyles={{ fontWeight: 'normal' }}
                amount={query.data?.account.stats.balance.valueInCents}
                currency={query.data?.account.stats.balance.currency}
              />
            </div>
          </div>

          <div className="flex-1 rounded border border-slate-200 p-4">
            <div className="mb-3 text-xs font-medium uppercase text-slate-700">
              <FormattedMessage id="Expense.PayTo" defaultMessage="Pay to" />
            </div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium leading-5 text-slate-800">
              <Avatar collective={query.data?.payee} radius={24} />
              {query.data?.payee?.name}
            </div>
            <div>
              <span className="mb-3 text-sm font-bold text-slate-700">
                <FormattedMessage defaultMessage="Private address" /> <PrivateInfoIcon />
              </span>
            </div>
            <div>
              <LocationAddress location={query.data?.payee?.location} />
            </div>
          </div>

          <div className="flex-1 rounded border border-slate-200 p-4">
            <div className="mb-3 text-xs font-medium uppercase text-slate-700">
              <FormattedMessage id="SecurityScope.PayoutMethod" defaultMessage="Payout Method" />
            </div>
            <div className="mb-3 overflow-hidden text-ellipsis">
              <PayoutMethodLabel payoutMethod={payoutMethod} />
            </div>
            <div>
              <span className="mb-3 text-sm font-bold text-slate-700">
                <FormattedMessage id="Details" defaultMessage="Details" /> <PrivateInfoIcon />
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <PaymentMethodDetails payoutMethod={payoutMethod} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseSummaryStepListItem(props: { className?: string; form: ExpenseForm; current: boolean }) {
  return (
    <StepListItem
      className={props.className}
      title={<FormattedMessage id="Summary" defaultMessage="Summary" />}
      completed={props.current}
      current={props.current}
    />
  );
}

function ExpenseItemSummary(props: { expenseItem: ExpenseItem }) {
  return (
    <div className="flex justify-between gap-4">
      <div className="h-[64px] w-[64px]">
        {props.expenseItem.url && (
          <UploadedFilePreview
            className="inline-block h-[112px] w-[112px]"
            size={64}
            url={props.expenseItem.url}
            maxHeight={64}
          />
        )}
      </div>
      <div className="flex flex-grow flex-col justify-between">
        <div className="">{props.expenseItem.description}</div>
        <div>
          <DateTime value={props.expenseItem.date} dateStyle="medium" />
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
