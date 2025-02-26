import React from 'react';
import { pick, uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';

import { Skeleton } from '@/components/ui/Skeleton';

import CollectivePickerAsync from '../../CollectivePickerAsync';
import { RadioGroup, RadioGroupCard } from '../../ui/RadioGroup';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { ExpenseAccountItem } from './ExpenseAccountItem';
import { FormSectionContainer } from './FormSectionContainer';
import { memoWithGetFormProps } from './helper';

type WhoIsPayingSectionProps = {
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
  lockPayee?: boolean;
} & ReturnType<typeof getFormProps>;

function getFormProps(form: ExpenseForm) {
  return {
    setFieldValue: form.setFieldValue,
    setFieldTouched: form.setFieldTouched,
    initialLoading: form.initialLoading,
    ...pick(form.options, ['recentlySubmittedExpenses', 'account', 'canChangeAccount']),
    ...pick(form.values, ['accountSlug']),
    accountSlugTouched: form.touched.accountSlug,
    isSubmitting: form.isSubmitting,
  };
}

// eslint-disable-next-line prefer-arrow-callback
export const WhoIsPayingSection = memoWithGetFormProps(function WhoIsPayingSection(props: WhoIsPayingSectionProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const lastSubmittedExpense = props.recentlySubmittedExpenses?.nodes?.at?.(0);
  const lastSubmittedAccount = lastSubmittedExpense && lastSubmittedExpense.account;
  const recentlySubmittedAccounts = React.useMemo(
    () => uniqBy((props.recentlySubmittedExpenses?.nodes || []).map(e => e?.account).filter(Boolean), 'slug'),
    [props.recentlySubmittedExpenses],
  );

  const { setFieldValue, setFieldTouched } = props;
  React.useEffect(() => {
    if (lastSubmittedAccount && !props.accountSlug && !props.accountSlugTouched) {
      setFieldValue('accountSlug', lastSubmittedAccount.slug);
    }

    if (!props.initialLoading) {
      setIsLoading(false);
    }
  }, [
    lastSubmittedAccount,
    setFieldValue,
    props.accountSlug,
    props.accountSlugTouched,
    props.initialLoading,
    setFieldTouched,
  ]);

  const isFindSelected =
    !props.accountSlug ||
    recentlySubmittedAccounts.length === 0 ||
    !recentlySubmittedAccounts.find(a => a.slug === props.accountSlug);

  return (
    <FormSectionContainer
      step={Step.WHO_IS_PAYING}
      inViewChange={props.inViewChange}
      title={<FormattedMessage defaultMessage="Who are you submitting the expense to?" id="bn8pIi" />}
    >
      <RadioGroup
        id="accountSlug"
        disabled={!props.canChangeAccount || props.isSubmitting}
        value={props.accountSlug}
        onValueChange={accountSlug => {
          setFieldValue('accountSlug', accountSlug);
          setFieldTouched('accountSlug', true);
        }}
      >
        {!isLoading &&
          props.canChangeAccount &&
          recentlySubmittedAccounts.map(a => (
            <RadioGroupCard key={a.slug} value={a.slug} disabled={props.isSubmitting}>
              <ExpenseAccountItem account={a} />
            </RadioGroupCard>
          ))}

        {isLoading && (
          <RadioGroupCard value="" disabled>
            <Skeleton className="h-6 w-full" />
          </RadioGroupCard>
        )}

        {!isLoading && props.canChangeAccount && (
          <RadioGroupCard
            value="__find"
            checked={isFindSelected}
            showSubcontent={isFindSelected}
            disabled={props.isSubmitting}
            subContent={
              <CollectivePickerAsync
                disabled={props.isSubmitting}
                autoFocus
                isSearchable
                filterResults={collectives =>
                  collectives.filter(c => c.type !== CollectiveType.ORGANIZATION || c.isHost)
                }
                inputId="collective-expense-picker"
                types={[
                  CollectiveType.COLLECTIVE,
                  CollectiveType.EVENT,
                  CollectiveType.FUND,
                  CollectiveType.ORGANIZATION,
                  CollectiveType.PROJECT,
                ]}
                collective={props.accountSlug === '__find' ? null : props.account}
                onChange={e => setFieldValue('accountSlug', e.value.slug)}
              />
            }
          >
            <FormattedMessage defaultMessage="Find account" id="m2G3Nh" />
          </RadioGroupCard>
        )}

        {!isLoading && !props.canChangeAccount && props.account && (
          <RadioGroupCard value={props.account.slug} disabled={props.isSubmitting}>
            <ExpenseAccountItem account={props.account} />
          </RadioGroupCard>
        )}
      </RadioGroup>
    </FormSectionContainer>
  );
}, getFormProps);
