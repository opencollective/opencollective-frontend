import React from 'react';
import { pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { ExpenseLockableFields } from '@/lib/graphql/types/v2/graphql';

import { FormField } from '@/components/FormField';
import { Skeleton } from '@/components/ui/Skeleton';

import { expenseTagsQuery } from '../../dashboard/filters/ExpenseTagsFilter';
import { AutocompleteEditTags } from '../../EditTags';
import ExpenseTypeTag from '../../expenses/ExpenseTypeTag';
import RichTextEditor from '../../RichTextEditor';
import { Label } from '../../ui/Label';
import { Step } from '../SubmitExpenseFlowSteps';
import { type ExpenseForm } from '../useExpenseForm';

import { ExpensePolicyContainer } from './ExpensePolicyContainer';
import { FormSectionContainer } from './FormSectionContainer';
import { memoWithGetFormProps } from './helper';

type AdditionalDetailsSectionProps = {
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
} & ReturnType<typeof getFormProps>;

function getFormProps(form: ExpenseForm) {
  return {
    ...pick(form, ['setFieldValue', 'initialLoading', 'isSubmitting']),
    ...pick(form.options, ['host', 'account', 'lockedFields']),
    ...pick(form.values, [
      'expenseTypeOption',
      'tags',
      'accountSlug',
      'privateMessage',
      'acknowledgedHostTitleExpensePolicy',
      'acknowledgedCollectiveTitleExpensePolicy',
    ]),
  };
}

// eslint-disable-next-line prefer-arrow-callback
export const AdditionalDetailsSection = memoWithGetFormProps(function AdditionalDetailsSection(
  props: AdditionalDetailsSectionProps,
) {
  const intl = useIntl();
  const expenseTags = props.tags;
  const expenseTypeOption = props.expenseTypeOption;
  const collectiveSlug = props.accountSlug;

  return (
    <FormSectionContainer step={Step.ADDITIONAL_DETAILS} inViewChange={props.inViewChange}>
      <FormField
        disabled={
          props.initialLoading ||
          props.lockedFields?.includes?.(ExpenseLockableFields.DESCRIPTION) ||
          props.isSubmitting
        }
        name="title"
        placeholder={intl.formatMessage({ defaultMessage: 'Mention a brief expense title', id: 'Te2Yc2' })}
        label={<FormattedMessage defaultMessage="Title" id="Title" />}
      />

      {!props.initialLoading &&
        props.host?.policies?.EXPENSE_POLICIES?.titlePolicy &&
        props.host?.slug !== props.account?.slug && (
          <div className="mt-4">
            <ExpensePolicyContainer
              title={<FormattedMessage defaultMessage="Host Instructions for titles" id="R7O6Sr" />}
              policy={props.host?.policies?.EXPENSE_POLICIES?.titlePolicy}
              checked={props.acknowledgedHostTitleExpensePolicy}
              onAcknowledgedChanged={v => props.setFieldValue('acknowledgedHostTitleExpensePolicy', v)}
            />
          </div>
        )}

      {!props.initialLoading && props.account?.policies?.EXPENSE_POLICIES?.titlePolicy && (
        <div className="mt-4">
          <ExpensePolicyContainer
            title={<FormattedMessage defaultMessage="Collective Instructions for titles" id="ZcXTLk" />}
            policy={props.account?.policies?.EXPENSE_POLICIES?.titlePolicy}
            checked={props.acknowledgedCollectiveTitleExpensePolicy}
            onAcknowledgedChanged={v => props.setFieldValue('acknowledgedCollectiveTitleExpensePolicy', v)}
          />
        </div>
      )}

      <Label className="mt-4 mb-3 block">
        <FormattedMessage defaultMessage="Tag your expense" id="EosA8s" />
      </Label>
      <div className="flex items-center gap-1">
        {props.initialLoading ? (
          <Skeleton className="h-5 w-12" />
        ) : (
          expenseTypeOption && <ExpenseTypeTag type={expenseTypeOption} mb={0} mr={0} />
        )}
        {!props.initialLoading && collectiveSlug && (
          <AutocompleteEditTags
            disabled={props.isSubmitting}
            query={expenseTagsQuery}
            variables={{ account: { slug: collectiveSlug } }}
            onChange={tags =>
              props.setFieldValue(
                'tags',
                tags.map(t => t.value.toLowerCase()),
              )
            }
            value={expenseTags}
          />
        )}
        {props.initialLoading && <Skeleton className="h-5 w-16" />}
      </div>

      <div className="mt-6">
        <FormField
          name="privateMessage"
          label={<FormattedMessage defaultMessage="Additional notes" id="xqG0ln" />}
          hint={
            <FormattedMessage
              defaultMessage="Share any important information that hasn't been covered in the previous sections."
              id="expense.notes.hint"
            />
          }
          isPrivate
          required={false}
          privateMessage={
            <FormattedMessage
              defaultMessage="This will only be visible to you, the Collective admins and its Fiscal Host"
              id="734IeW"
            />
          }
        >
          {({ field }) =>
            !props.initialLoading && (
              <RichTextEditor
                id={field.id}
                withBorders
                version="simplified"
                inputName={field.name}
                editorMinHeight={72}
                onChange={e => props.setFieldValue('privateMessage', e.target.value)}
                disabled={props.isSubmitting}
                defaultValue={props.privateMessage}
                fontSize="13px"
                data-cy="ExpenseNotesEditor"
              />
            )
          }
        </FormField>
      </div>
    </FormSectionContainer>
  );
}, getFormProps);
