import React from 'react';
import { ChevronDown } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { RecurringExpenseIntervals } from '../../../lib/i18n/expense';

import { expenseTagsQuery } from '../../dashboard/filters/ExpenseTagsFilter';
import { AutocompleteEditTags } from '../../EditTags';
import ExpenseTypeTag from '../../expenses/ExpenseTypeTag';
import HTMLContent from '../../HTMLContent';
import MessageBox from '../../MessageBox';
import { Button } from '../../ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/Collapsible';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';
import { Step } from '../SubmitExpenseFlowSteps';
import { type ExpenseForm, getCollectiveSlug, RecurrenceFrequencyOption } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';

type AdditionalDetailsSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function AdditionalDetailsSection(props: AdditionalDetailsSectionProps) {
  const expenseTags = props.form.values.tags;
  const expenseTypeOption = props.form.values.expenseTypeOption;
  const collectiveSlug = getCollectiveSlug(props.form.values);

  return (
    <FormSectionContainer id={Step.EXPENSE_TITLE} inViewChange={props.inViewChange} title={'Additional Details'}>
      <Label className="mb-2" htmlFor="expenseTitle">
        Expense title
      </Label>
      <Input id="expenseTitle" placeholder="Mention a brief expense title" {...props.form.getFieldProps('title')} />

      <Collapsible asChild>
        <div className="group mb-4 mt-4 rounded-md border border-[#DCDDE0] p-4">
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center text-start text-sm font-bold">
              <div className="flex-grow">Host Instructions for titles</div>
              <div className="group-data-[state=open]:rotate-180">
                <ChevronDown size={16} />
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4">
              <HTMLContent content="Mention specific details of your expense like the date or month etc." />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <RecurrenceOptionBox form={props.form} />

      <Label className="mb-2 mt-4">Tag your expense</Label>
      <div className="flex items-center gap-1">
        <ExpenseTypeTag type={expenseTypeOption} mb={0} mr={0} />
        {collectiveSlug && (
          <AutocompleteEditTags
            query={expenseTagsQuery}
            variables={{ account: { slug: collectiveSlug } }}
            onChange={tags =>
              props.form.setFieldValue(
                'tags',
                tags.map(t => t.value.toLowerCase()),
              )
            }
            value={expenseTags}
          />
        )}
      </div>
    </FormSectionContainer>
  );
}

function RecurrenceOptionBox(props: { form: ExpenseForm }) {
  const intl = useIntl();
  const [isEditingRecurrence, setIsEdittingRecurrence] = React.useState(false);
  const [recurrenceFrequencyEdit, setRecurrenceFrequencyEdit] = React.useState(props.form.values.recurrenceFrequency);
  const [recurrenceEndAtEdit, setRecurrenceEndAtEdit] = React.useState(props.form.values.recurrenceEndAt);

  const recurrenceFrequency = isEditingRecurrence ? recurrenceFrequencyEdit : props.form.values.recurrenceFrequency;
  const recurrenceEndAt = isEditingRecurrence ? recurrenceEndAtEdit : props.form.values.recurrenceEndAt;

  return (
    <div>
      <MessageBox type="info">
        <div className="mb-4 font-bold">Expense Recurrence</div>
        {!recurrenceFrequency ||
          (recurrenceFrequency === 'none' && (
            <div>
              This expense will be submitted as a one-time expense. To make this a recurring expense, please specify the
              frequency.
            </div>
          ))}

        {recurrenceFrequency && recurrenceFrequency !== 'none' && (
          <div>
            <span>
              <FormattedMessage
                defaultMessage="Once submitted, you will also be prompted to review and submit a copy of this expense every {recurrenceFrequency, select, week {week} month {month} quarter {quarter} year {year} other {}}."
                id="I3xpNh"
                values={{
                  recurrenceFrequency: recurrenceFrequency,
                }}
              />
            </span>
            {recurrenceEndAt && (
              <span>
                &nbsp;
                <FormattedMessage
                  defaultMessage="The prompts will stop on {date}."
                  id="LiFjWf"
                  values={{
                    date: <FormattedDate dateStyle="medium" value={recurrenceEndAt} />,
                  }}
                />
              </span>
            )}
          </div>
        )}
        {!isEditingRecurrence && (
          <Button onClick={() => setIsEdittingRecurrence(true)} className="mt-2 p-0 text-sm" size="xs" variant="link">
            Edit recurrence frequency
          </Button>
        )}

        {isEditingRecurrence && (
          <div>
            <div className="my-4 border-t border-dotted border-gray-400" />
            <Label className="mb-2">Frequency</Label>
            <Select
              value={recurrenceFrequency}
              onValueChange={newValue => setRecurrenceFrequencyEdit(newValue as RecurrenceFrequencyOption)}
            >
              <SelectTrigger data-cy="language-switcher">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="truncate">
                    <SelectValue placeholder={intl.formatMessage({ defaultMessage: 'Select one', id: 'aJxdzZ' })} />
                  </span>
                </div>
              </SelectTrigger>

              <SelectContent className="relative max-h-80 max-w-full">
                <SelectItem value={RecurrenceFrequencyOption.NONE}>None</SelectItem>
                <SelectItem value={RecurrenceFrequencyOption.WEEK}>{RecurringExpenseIntervals.week}</SelectItem>
                <SelectItem value={RecurrenceFrequencyOption.MONTH}>{RecurringExpenseIntervals.month}</SelectItem>
                <SelectItem value={RecurrenceFrequencyOption.QUARTER}>{RecurringExpenseIntervals.quarter}</SelectItem>
                <SelectItem value={RecurrenceFrequencyOption.YEAR}>{RecurringExpenseIntervals.year}</SelectItem>
              </SelectContent>
            </Select>

            {recurrenceFrequency && recurrenceFrequency !== 'none' && (
              <React.Fragment>
                <Label className="mb-2 mt-4">End Date</Label>
                <Input type="date" value={recurrenceEndAt} onChange={e => setRecurrenceEndAtEdit(e.target.value)} />
              </React.Fragment>
            )}

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  props.form.setFieldValue('recurrenceEndAt', recurrenceEndAtEdit);
                  props.form.setFieldValue('recurrenceFrequency', recurrenceFrequencyEdit);
                  setIsEdittingRecurrence(false);
                }}
                variant="outline"
              >
                Save changes
              </Button>
              <Button
                onClick={() => {
                  setRecurrenceEndAtEdit(props.form.values.recurrenceEndAt);
                  setRecurrenceFrequencyEdit(props.form.values.recurrenceFrequency);
                  setIsEdittingRecurrence(false);
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </MessageBox>
    </div>
  );
}
