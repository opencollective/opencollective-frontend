import React from 'react';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import AccountingCategorySelect from '../../../components/AccountingCategorySelect';

import HTMLContent from '../../HTMLContent';
import StyledInputFormikField from '../../StyledInputFormikField';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/Collapsible';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';
import { FormField } from '@/components/FormField';

type ExpenseCategorySectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function ExpenseCategorySection(props: ExpenseCategorySectionProps) {
  const accountingCategoryId = props.form.values.accountingCategoryId;
  const { LoggedInUser } = useLoggedInUser();

  const accountingCategories = React.useMemo(
    () => props.form.options.accountingCategories || [],
    [props.form.options.accountingCategories],
  );

  const selectedAccountingCategory = accountingCategoryId
    ? accountingCategories.find(a => a.id === accountingCategoryId)
    : null;
  const instructions = selectedAccountingCategory?.instructions;
  const { setFieldValue } = props.form;

  const host = props.form.options.host;
  const isHostAdmin = Boolean(LoggedInUser?.isAdminOfCollective(host));

  return (
    <FormSectionContainer
      title={<FormattedMessage defaultMessage="Select expense category" id="oNW1LD" />}
      form={props.form}
      step={Step.EXPENSE_CATEGORY}
      inViewChange={props.inViewChange}
    >
      <FormField name="accountingCategoryId">
        {({ field }) => (
          <AccountingCategorySelect
            {...field}
            id="accountingCategoryId"
            kind="EXPENSE"
            onChange={value => setFieldValue('accountingCategoryId', value?.id)}
            host={host}
            showCode={isHostAdmin}
            expenseType={props.form.values.expenseTypeOption}
            account={props.form.options.account}
            selectedCategory={selectedAccountingCategory}
            allowNone={!props.form.options.isAccountingCategoryRequired}
            buttonClassName="max-w-full w-full"
          />
        )}
      </FormField>

      {instructions && (
        <Collapsible asChild defaultOpen>
          <div className="group mt-4 rounded-md border border-[#DCDDE0] p-4">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center text-start text-sm font-bold">
                <div className="flex-grow">
                  {' '}
                  <FormattedMessage defaultMessage="Expense category instructions" id="QVX2sp" />
                </div>
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
