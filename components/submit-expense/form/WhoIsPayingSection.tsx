import React from 'react';
import { uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';

import CollectivePickerAsync from '../../CollectivePickerAsync';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import { RadioGroup, RadioGroupCard } from '../../ui/RadioGroup';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { ExpenseAccountItem } from './ExpenseAccountItem';
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
            <RadioGroupCard key={a.slug} value={a.slug}>
              <ExpenseAccountItem account={a} />
            </RadioGroupCard>
          ))}

        {props.form.initialLoading && (
          <RadioGroupCard value="" disabled>
            <LoadingPlaceholder height={24} width={1} />
          </RadioGroupCard>
        )}

        <RadioGroupCard
          value="__find"
          disabled={props.form.initialLoading}
          checked={!props.form.initialLoading && isFindSelected}
          showSubcontent={!props.form.initialLoading && isFindSelected}
          subContent={
            <CollectivePickerAsync
              autoFocus
              isSearchable
              filterResults={collectives => collectives.filter(c => c.type !== CollectiveType.ORGANIZATION || c.isHost)}
              inputId="collective-expense-picker"
              types={[
                CollectiveType.COLLECTIVE,
                CollectiveType.EVENT,
                CollectiveType.FUND,
                CollectiveType.ORGANIZATION,
                CollectiveType.PROJECT,
              ]}
              collective={props.form.values.accountSlug === '__find' ? null : props.form.options.account}
              onChange={e => setFieldValue('accountSlug', e.value.slug)}
            />
          }
        >
          <FormattedMessage defaultMessage="Find account" id="m2G3Nh" />
        </RadioGroupCard>
      </RadioGroup>
    </FormSectionContainer>
  );
}
