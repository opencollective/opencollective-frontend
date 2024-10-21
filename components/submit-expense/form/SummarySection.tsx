import React from 'react';
import { groupBy, sumBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { AccountHoverCard } from '../../AccountHoverCard';
import DateTime from '../../DateTime';
import ExpenseTypeTag from '../../expenses/ExpenseTypeTag';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import LinkCollective from '../../LinkCollective';
import { Label } from '../../ui/Label';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';

type SummarySectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};
export function SummarySection(props: SummarySectionProps) {
  const expenseItems = props.form.values.expenseItems;

  const itemsByCurrency = groupBy(expenseItems, 'amount.currency');
  const totalByCurrency = Object.entries(itemsByCurrency).reduce(
    (acc, [currency, items]) => {
      return {
        ...acc,
        [currency]: sumBy(items, 'amount.valueInCents'),
      };
    },
    {} as Record<string, number>,
  );

  return (
    <FormSectionContainer id={Step.SUMMARY} inViewChange={props.inViewChange} title={'Review Expense'}>
      <div className="rounded-md border border-gray-300 p-4 text-sm">
        <div className="mb-4 flex justify-between">
          <div className="text-base font-bold">
            {props.form.values.title || <span className="text-muted-foreground">Expense title</span>}
          </div>
          {props.form.values.recurrenceFrequency && props.form.values.recurrenceFrequency !== 'none' && (
            <span className="rounded-xl bg-slate-100 px-3 py-1 font-mono text-xs uppercase text-muted-foreground">
              Recurring
            </span>
          )}
        </div>
        <div>
          <ExpenseTypeTag type={props.form.values.expenseTypeOption} mb={0} mr={0} />
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
        <div className="mt-2 flex gap-2 text-xs">
          <div>
            <FormattedMessage
              id="Expense.SubmittedBy"
              defaultMessage="Submitted by {name}"
              values={{
                name: (
                  <AccountHoverCard
                    account={props.form.options.submitter}
                    trigger={
                      <span>
                        <LinkCollective collective={props.form.options.submitter} noTitle>
                          <span className="font-medium text-foreground underline hover:text-primary">
                            {props.form.options.submitter ? (
                              props.form.options.submitter.name
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
      </div>
      <div className="mt-4 rounded-md border border-gray-300 p-4 text-sm">
        <Label className="mb-4 font-bold">Invoice items</Label>
        {props.form.values.expenseItems.map((ei, i) => (
          <div
            key={i}
            className="mb-2 flex items-center justify-between gap-4 border-b border-dotted border-gray-300 pb-2 text-sm last:mb-0 last:border-b-0"
          >
            <div>
              <div>{ei.description || <span className="text-muted-foreground">Item description</span>}</div>
              <div className="text-xs">{ei.incurredAt && <DateTime value={ei.incurredAt} dateStyle="medium" />}</div>
            </div>
            <div>
              <FormattedMoneyAmount
                amount={ei.amount.valueInCents}
                currency={ei.amount.currency}
                showCurrencyCode
                amountClassName="font-bold"
              />
            </div>
          </div>
        ))}

        <div className="mt-2">
          {Object.entries(totalByCurrency).map(([currency, total]) => (
            <div key={currency} className="text-right">
              <FormattedMoneyAmount currency={currency} showCurrencyCode amount={total} amountClassName="font-bold" />
            </div>
          ))}
        </div>
      </div>
      <div className='flex gap-2'>
        <div className="basis-0 flex-grow mt-4 rounded-md border border-gray-300 p-4 text-sm">
          <div className='font-bold'>Who is paying?</div>
        </div>
        <div className="basis-0 flex-grow mt-4 rounded-md border border-gray-300 p-4 text-sm">
          <div className='font-bold'>Who is getting paid?</div>
        </div>
        <div className="basis-0 flex-grow mt-4 rounded-md border border-gray-300 p-4 text-sm">
          <div className='font-bold'>Payout Method</div>
        </div>
      </div>
      <div className="h-[200px]"></div>
    </FormSectionContainer>
  );
}
