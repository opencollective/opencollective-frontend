import React from 'react';
import { uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { AccountType } from '../../../lib/graphql/types/v2/graphql';
import { cn } from '../../../lib/utils';

import LoadingPlaceholder from '../../LoadingPlaceholder';
import { Label } from '../../ui/Label';
import { RadioGroup, RadioGroupItem } from '../../ui/RadioGroup';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { ExpenseAccountItem } from './ExpenseAccountItem';
import { ExpenseAccountSearchInput } from './ExpenseAccountSearchInput';
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
      uniqBy((props.form.options.recentlySubmittedExpenses?.nodes || []).map(e => e?.account).filter(Boolean), 'slug'),
    [props.form.options.recentlySubmittedExpenses],
  );

  const { setFieldValue, setFieldTouched } = props.form;
  React.useEffect(() => {
    if (lastSubmittedAccount && !props.form.values.accountSlug && !props.form.touched.accountSlug) {
      setFieldValue('accountSlug', lastSubmittedAccount.slug);
    }
  }, [
    lastSubmittedAccount,
    setFieldValue,
    props.form.values.accountSlug,
    props.form.touched.accountSlug,
    loading,
    setFieldTouched,
  ]);

  const isFindSelected =
    !props.form.values.accountSlug ||
    recentlySubmittedAccounts.length === 0 ||
    !recentlySubmittedAccounts.find(a => a.slug === props.form.values.accountSlug);

  return (
    <FormSectionContainer
      step={Step.WHO_IS_PAYING}
      form={props.form}
      inViewChange={props.inViewChange}
      title={<FormattedMessage defaultMessage="Who are you submitting the expense to?" id="bn8pIi" />}
    >
      <RadioGroup
        id="accountSlug"
        value={props.form.values.accountSlug}
        onValueChange={accountSlug => {
          setFieldValue('accountSlug', accountSlug);
          setFieldTouched('accountSlug', true);
        }}
      >
        {!props.form.initialLoading &&
          recentlySubmittedAccounts.map(a => (
            <div
              key={a.slug}
              className="flex items-center rounded-md border border-gray-200 has-[:checked]:border-blue-300"
            >
              <RadioGroupItem className="ml-4" value={a.slug}></RadioGroupItem>
              <Label className="flex-grow p-4" htmlFor={a.slug}>
                <ExpenseAccountItem account={a} />
              </Label>
            </div>
          ))}

        {props.form.initialLoading && (
          <div className="rounded-md border border-gray-200">
            <div className="flex items-center">
              <RadioGroupItem className="ml-4" value="" disabled></RadioGroupItem>
              <Label className={cn('flex min-h-16 flex-grow items-center p-4')}>
                <LoadingPlaceholder height={24} width={1} />
              </Label>
            </div>
          </div>
        )}

        <div className="rounded-md border border-gray-200 has-[:checked]:flex-col has-[:checked]:items-start has-[:checked]:gap-2 has-[:checked]:border-blue-300">
          <div className="flex items-center">
            <RadioGroupItem
              className="ml-4"
              value="__find"
              disabled={props.form.initialLoading}
              checked={!props.form.initialLoading && isFindSelected}
            ></RadioGroupItem>
            <Label className={cn('flex min-h-16 flex-grow items-center p-4')} htmlFor="__find">
              <FormattedMessage defaultMessage="Find account" id="m2G3Nh" />
            </Label>
          </div>
          <div
            className={cn({
              'p-4 pt-0': !props.form.initialLoading && isFindSelected,
            })}
          >
            {!props.form.initialLoading && isFindSelected && (
              <ExpenseAccountSearchInput
                showAdmins
                accountTypes={[
                  AccountType.COLLECTIVE,
                  AccountType.ORGANIZATION,
                  AccountType.PROJECT,
                  AccountType.EVENT,
                  AccountType.FUND,
                ]}
                value={props.form.values.accountSlug !== '__find' ? props.form.values.accountSlug : null}
                onChange={slug => setFieldValue('accountSlug', !slug ? '__find' : slug)}
              />
            )}
          </div>
        </div>
      </RadioGroup>
    </FormSectionContainer>
  );
}
