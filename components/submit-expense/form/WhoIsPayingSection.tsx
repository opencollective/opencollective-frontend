import React from 'react';
import { uniqBy } from 'lodash';

import LoadingPlaceholder from '../../LoadingPlaceholder';
import { Label } from '../../ui/Label';
import { RadioGroup, RadioGroupCard, RadioGroupItem } from '../../ui/RadioGroup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/Tabs';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { ExpenseAccountItem } from './ExpenseAccountItem';
import { ExpenseAccountSearchInput } from './ExpenseAccountSearchInput';
import { WhoIsPayingOption } from './experiment';
import { FormSectionContainer } from './FormSectionContainer';

type WhoIsPayingSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function WhoIsPayingSection(props: WhoIsPayingSectionProps) {
  const loading = !props.form.options.recentlySubmittedExpenses;
  const lastSubmittedExpense = props.form.options.recentlySubmittedExpenses?.nodes?.at?.(0);
  const lastSubmittedAccount = lastSubmittedExpense && lastSubmittedExpense.account;

  const recentlySubmittedAccounts = React.useMemo(
    () =>
      uniqBy(
        (props.form.options.recentlySubmittedExpenses?.nodes || []).map(e => e.account),
        'slug',
      ),
    [props.form.options.recentlySubmittedExpenses],
  );

  const { setFieldValue } = props.form;
  React.useEffect(() => {
    if (lastSubmittedAccount && !props.form.values.recentExpenseAccount) {
      setFieldValue('lastExpenseAccountSlug', lastSubmittedAccount.slug);
      setFieldValue('recentExpenseAccount', lastSubmittedAccount.slug);
    }
  }, [lastSubmittedAccount, setFieldValue, props.form.values.recentExpenseAccount]);

  React.useEffect(() => {
    if (!loading && !lastSubmittedAccount) {
      setFieldValue('whoIsPayingOption', WhoIsPayingOption.SEARCH);
    }
  }, [loading, lastSubmittedAccount, setFieldValue]);
  return (
    <FormSectionContainer
      id={Step.WHO_IS_PAYING}
      inViewChange={props.inViewChange}
      title={'Who are you submitting the expense to?'}
      subtitle={'Select the profile whom you are requesting money from'}
    >
      {/* <Tabs
        value={props.form.values.whoIsPayingOption}
        onValueChange={newValue => setFieldValue('whoIsPayingOption', newValue as WhoIsPayingOption)}
      >
        <TabsList>
          <TabsTrigger value={WhoIsPayingOption.RECENT}>
            {recentlySubmittedAccounts.length > 0 ? 'Recent' : 'Last Submitted'}
          </TabsTrigger>
          <TabsTrigger value={WhoIsPayingOption.SEARCH}>Search</TabsTrigger>
        </TabsList>
        <TabsContent value={WhoIsPayingOption.LAST_SUBMITTED}> */}
      {loading ? (
        <LoadingPlaceholder />
      ) : (
        <RadioGroup id="recentExpenseAccount" value={props.form.values.lastExpenseAccountSlug}>
          {/* <div className="flex items-center space-x-2 rounded-md border border-gray-200 p-4">
            <RadioGroupItem value={props.form.values.lastExpenseAccountSlug}></RadioGroupItem>
            <RadioGroupCardLabel className="flex-grow" htmlFor={props.form.values.lastExpenseAccountSlug}>
              <ExpenseAccountItem slug={props.form.values.lastExpenseAccountSlug} />
            </RadioGroupCardLabel>
          </div> */}
          {recentlySubmittedAccounts
            // .filter(a => a.slug !== props.form.values.lastExpenseAccountSlug)
            .map(a => (
              <RadioGroupCard key={a.slug} value={a.slug}>
                <ExpenseAccountItem slug={a.slug} />
              </RadioGroupCard>
            ))}
          <RadioGroupCard
            value="newAccount"
            // className="flex items-center space-x-2 rounded-md border border-gray-200 p-4"
          >
            Find account
          </RadioGroupCard>
          {/* <ExpenseAccountSearchInput form={props.form} /> */}
        </RadioGroup>
      )}
    </FormSectionContainer>
  );
}
