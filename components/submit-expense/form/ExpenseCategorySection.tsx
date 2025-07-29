import React from 'react';
import { isNil, pick } from 'lodash';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { MemoizedAccountingCategorySelect } from '../../../components/AccountingCategorySelect';
import { FormField } from '@/components/FormField';

import HTMLContent from '../../HTMLContent';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/Collapsible';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';
import { memoWithGetFormProps } from './helper';

type ExpenseCategorySectionProps = {
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
} & ReturnType<typeof getFormProps>;

function getFormProps(form: ExpenseForm) {
  return {
    ...pick(form, 'setFieldValue', 'isSubmitting'),
    ...pick(form.values, ['accountingCategoryId', 'expenseTypeOption']),
    ...pick(form.options, ['accountingCategories', 'host', 'account', 'isAccountingCategoryRequired']),
  };
}

// eslint-disable-next-line prefer-arrow-callback
export const ExpenseCategorySection = memoWithGetFormProps(function ExpenseCategorySection(
  props: ExpenseCategorySectionProps,
) {
  const accountingCategoryId = props.accountingCategoryId;
  const { LoggedInUser } = useLoggedInUser();

  const accountingCategories = React.useMemo(() => props.accountingCategories || [], [props.accountingCategories]);

  // Passing along either `null` (representing "I don't know") or `undefined` (representing unset value)
  const selectedAccountingCategory = isNil(accountingCategoryId)
    ? accountingCategoryId
    : accountingCategories.find(a => a.id === accountingCategoryId);

  const instructions = selectedAccountingCategory?.instructions;
  const { setFieldValue } = props;

  const host = props.host;
  const isHostAdmin = Boolean(LoggedInUser?.isAdminOfCollective(host));

  const onAccountingCategorySelectChange = React.useCallback(
    value => {
      setFieldValue('accountingCategoryId', value ? value.id : null);
    },
    [setFieldValue],
  );

  return (
    <FormSectionContainer
      title={<FormattedMessage defaultMessage="Select expense category" id="oNW1LD" />}
      step={Step.EXPENSE_CATEGORY}
      inViewChange={props.inViewChange}
    >
      <FormField name="accountingCategoryId">
        {({ field }) => (
          <MemoizedAccountingCategorySelect
            {...field}
            id="accountingCategoryId"
            kind="EXPENSE"
            disabled={props.isSubmitting}
            onChange={onAccountingCategorySelectChange}
            host={host}
            showCode={isHostAdmin}
            expenseType={props.expenseTypeOption}
            account={props.account}
            selectedCategory={selectedAccountingCategory}
            allowNone={true}
            buttonClassName="max-w-full w-full"
          />
        )}
      </FormField>

      {instructions && (
        <Collapsible asChild defaultOpen>
          <div className="group mt-4 rounded-md border border-[#DCDDE0] p-4">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center text-start text-sm font-bold">
                <div className="grow">
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
}, getFormProps);
