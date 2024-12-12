import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { expenseTagsQuery } from '../../dashboard/filters/ExpenseTagsFilter';
import { AutocompleteEditTags } from '../../EditTags';
import ExpenseTypeTag from '../../expenses/ExpenseTypeTag';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledInputFormikField from '../../StyledInputFormikField';
import { Label } from '../../ui/Label';
import { Step } from '../SubmitExpenseFlowSteps';
import { type ExpenseForm } from '../useExpenseForm';

import { ExpensePolicyContainer } from './ExpensePolicyContainer';
import { FormSectionContainer } from './FormSectionContainer';

type AdditionalDetailsSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function AdditionalDetailsSection(props: AdditionalDetailsSectionProps) {
  const intl = useIntl();
  const expenseTags = props.form.values.tags;
  const expenseTypeOption = props.form.values.expenseTypeOption;
  const collectiveSlug = props.form.values.accountSlug;

  return (
    <FormSectionContainer form={props.form} step={Step.EXPENSE_TITLE} inViewChange={props.inViewChange}>
      <StyledInputFormikField
        disabled={props.form.initialLoading}
        name="title"
        placeholder={intl.formatMessage({ defaultMessage: 'Mention a brief expense title', id: 'Te2Yc2' })}
      />

      {!props.form.initialLoading &&
        props.form.options.host?.policies?.EXPENSE_POLICIES?.titlePolicy &&
        props.form.options.host?.slug !== props.form.options.account?.slug && (
          <div className="mt-4">
            <ExpensePolicyContainer
              title={<FormattedMessage defaultMessage="Host Instructions for titles" id="R7O6Sr" />}
              policy={props.form.options.host?.policies?.EXPENSE_POLICIES?.titlePolicy}
              checked={props.form.values.acknowledgedHostTitleExpensePolicy}
              onAcknowledgedChanged={v => props.form.setFieldValue('acknowledgedHostTitleExpensePolicy', v)}
            />
          </div>
        )}

      {!props.form.initialLoading && props.form.options.account?.policies?.EXPENSE_POLICIES?.titlePolicy && (
        <div className="mt-4">
          <ExpensePolicyContainer
            title={<FormattedMessage defaultMessage="Collective Instructions for titles" id="ZcXTLk" />}
            policy={props.form.options.account?.policies?.EXPENSE_POLICIES?.titlePolicy}
            checked={props.form.values.acknowledgedCollectiveTitleExpensePolicy}
            onAcknowledgedChanged={v => props.form.setFieldValue('acknowledgedCollectiveTitleExpensePolicy', v)}
          />
        </div>
      )}

      <Label className="mb-2 mt-4">
        <FormattedMessage defaultMessage="Tag your expense" id="EosA8s" />
      </Label>
      <div className="flex items-center gap-1">
        {props.form.initialLoading ? (
          <LoadingPlaceholder height={20} width={50} />
        ) : (
          expenseTypeOption && <ExpenseTypeTag type={expenseTypeOption} mb={0} mr={0} />
        )}
        {!props.form.initialLoading && collectiveSlug && (
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
        {props.form.initialLoading && <LoadingPlaceholder height={20} width={70} />}
      </div>
    </FormSectionContainer>
  );
}
