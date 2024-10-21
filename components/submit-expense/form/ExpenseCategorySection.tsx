import React from 'react';
import { ChevronDown, ChevronsUpDown } from 'lucide-react';

import { cn } from '../../../lib/utils';

import HTMLContent from '../../HTMLContent';
import { Button } from '../../ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/Collapsible';
import { Command, CommandInput, CommandItem, CommandList } from '../../ui/Command';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';

type ExpenseCategorySectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function ExpenseCategorySection(props: ExpenseCategorySectionProps) {
  const accountingCategoryId = props.form.values.accountingCategoryId;
  const [isExpenseCategoryPickerOpen, setIsExpenseCategoryPickerOpen] = React.useState(false);

  const accountingCategories = React.useMemo(
    () => props.form.options.accountingCategories || [],
    [props.form.options.accountingCategories],
  );

  const selectedAccountingCategory = accountingCategoryId
    ? accountingCategories.find(a => a.id === accountingCategoryId)
    : null;
  const instructions = selectedAccountingCategory?.instructions;
  const { setFieldValue } = props.form;

  return (
    <FormSectionContainer
      id={Step.EXPENSE_CATEGORY}
      inViewChange={props.inViewChange}
      title={'Select expense category'}
    >
      <Button
        variant="outline"
        size="sm"
        className={cn('mb-4 w-full justify-between', {
          'mb-0 rounded-b-none border-b-0': isExpenseCategoryPickerOpen,
        })}
        onClick={() => setIsExpenseCategoryPickerOpen(!isExpenseCategoryPickerOpen)}
      >
        {selectedAccountingCategory ? (
          selectedAccountingCategory.name
        ) : (
          <span className="text-muted-foreground">Choose a category</span>
        )}
        <ChevronsUpDown className="ml-2 opacity-50" size={16} />
      </Button>
      {isExpenseCategoryPickerOpen && (
        <div className="mb-4 rounded-md rounded-t-none border border-gray-200">
          <Command>
            <CommandInput autoFocus />
            <CommandList>
              {accountingCategories.map(a => (
                <CommandItem
                  key={a.id}
                  value={`${a.id}-${a.name}`}
                  onSelect={() => {
                    setFieldValue('accountingCategoryId', a.id);
                    setIsExpenseCategoryPickerOpen(false);
                  }}
                >
                  <div className="flex-grow">{a.name}</div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </div>
      )}

      {instructions && (
        <Collapsible asChild defaultOpen>
          <div className="group mb-4 rounded-md border border-[#DCDDE0] p-4">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center text-start text-sm font-bold">
                <div className="flex-grow">Expense category instructions</div>
                <div className="group-data-[state=open]:rotate-180">
                  <ChevronDown size={16} />
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4">
                <HTMLContent content={instructions} />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </FormSectionContainer>
  );
}
