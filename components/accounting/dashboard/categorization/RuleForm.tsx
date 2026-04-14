import React from 'react';
import { useFormikContext } from 'formik';
import { get } from 'lodash';
import { Plus, Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { HostContributionCategoryRulesQuery } from '@/lib/graphql/types/v2/graphql';
import { AccountingCategoryKind } from '@/lib/graphql/types/v2/schema';

import type { ContributionPredicate } from '@/components/accounting/dashboard/categorization/contributions';
import {
  ContributionField,
  ContributionSubjectDefinitions,
} from '@/components/accounting/dashboard/categorization/contributions';
import { Op, OpLabels } from '@/components/accounting/dashboard/categorization/rules';
import AccountingCategorySelect from '@/components/AccountingCategorySelect';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const EMPTY_PREDICATE: ContributionPredicate = {
  subject: ContributionField.description,
  operator: Op.contains,
  value: '',
};

type RuleFormProps = {
  host: HostContributionCategoryRulesQuery['host'];
  formikPrefix: string;
};

export function RuleForm(props: RuleFormProps) {
  const formikContext = useFormikContext();

  const intl = useIntl();

  const prefix = props.formikPrefix?.length ? `${props.formikPrefix}.` : '';

  const touched = get(formikContext.touched, `${props.formikPrefix}`, false);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}name`}>
          <FormattedMessage id="CategorizationRule.ruleName" defaultMessage="Rule Name" />
        </Label>
        <Input
          id={`${prefix}name`}
          value={get(formikContext.values, `${prefix}name`)}
          onChange={e => formikContext.setFieldValue(`${prefix}name`, e.target.value)}
          placeholder={intl.formatMessage({
            defaultMessage: 'e.g. Recurring donations',
            id: 'CategorizationRule.namePlaceholder',
          })}
          error={touched && get(formikContext.errors, `${prefix}name`)}
        />
        {touched &&
          get(formikContext.errors, `${prefix}name`) &&
          typeof get(formikContext.errors, `${prefix}name`) === 'string' && (
            <p className="text-sm text-red-500">{get(formikContext.errors, `${prefix}name`)}</p>
          )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <FormattedMessage id="CategorizationRule.ifAllConditionsMatch" defaultMessage="If all conditions match:" />
        </p>
        <div className="mt-3 space-y-3">
          {get(formikContext.values, `${prefix}predicates`, []).map((pred: ContributionPredicate, index: number) => (
            <ConditionRow
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              condition={pred}
              connector={index === 0 ? 'if' : 'and'}
              onChange={patch => {
                formikContext.setFieldValue(`${prefix}predicates.${index}`, patch);
              }}
              onDelete={() =>
                formikContext.setFieldValue(
                  `${prefix}predicates`,
                  get(formikContext.values, `${prefix}predicates`, []).filter((_, i) => i !== index),
                )
              }
              error={get(formikContext.errors, `${prefix}predicates.${index}.value`, '') as string}
              touched={touched}
              canRemove={get(formikContext.values, `${prefix}predicates`, []).length > 1}
              intl={intl}
              host={props.host}
            />
          ))}
          {touched &&
            get(formikContext.errors, `${prefix}predicates`) &&
            typeof get(formikContext.errors, `${prefix}predicates`) === 'string' && (
              <p className="text-sm text-red-500">{get(formikContext.errors, `${prefix}predicates`)}</p>
            )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              formikContext.setFieldValue(`${prefix}predicates`, [
                ...get(formikContext.values, `${prefix}predicates`, []),
                EMPTY_PREDICATE,
              ])
            }
          >
            <Plus className="mr-2 size-4" />
            <FormattedMessage id="CategorizationRule.addCondition" defaultMessage="Add condition" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          <FormattedMessage
            id="CategorizationRule.thenAssignCategory"
            defaultMessage="Then assign accounting category:"
          />
        </Label>
        <AccountingCategorySelect
          host={props.host}
          kind={AccountingCategoryKind.CONTRIBUTION}
          selectedCategory={props.host?.accountingCategories?.nodes?.find(
            c => c.id === get(formikContext.values, `${prefix}categoryId`),
          )}
          onChange={value => formikContext.setFieldValue(`${prefix}categoryId`, value?.id)}
          allowNone={false}
          showCode
        />
        {touched && get(formikContext.errors, `${prefix}categoryId`) && (
          <p className="text-sm text-red-500">{get(formikContext.errors, `${prefix}categoryId`)}</p>
        )}
      </div>
    </div>
  );
}

type ConditionRowProps = {
  error?: string;
  condition: ContributionPredicate;
  connector: 'if' | 'and';
  touched?: boolean;
  onChange: (patch: ContributionPredicate) => void;
  onDelete: () => void;
  canRemove: boolean;
  intl: ReturnType<typeof useIntl>;
  host: HostContributionCategoryRulesQuery['host'];
};

function ConditionRow(props: ConditionRowProps) {
  const def = ContributionSubjectDefinitions[props.condition.subject];
  const operators = def?.operators ?? [Op.contains];
  const subject = props.condition.subject;

  const InputComponent = def?.InputComponent;
  if (!InputComponent) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex flex-wrap gap-2">
        <span className="w-8 shrink-0 pt-2 text-sm text-muted-foreground capitalize">
          {props.connector === 'if' ? (
            <FormattedMessage id="CategorizationRule.if" defaultMessage="If" />
          ) : (
            <FormattedMessage id="CategorizationRule.and" defaultMessage="And" />
          )}
        </span>
        <Select
          value={subject}
          onValueChange={v => {
            const field = v as ContributionField;
            const ops = ContributionSubjectDefinitions[field]?.operators;
            props.onChange({
              subject: field,
              operator: ops?.includes(props.condition.operator) ? props.condition.operator : ops?.[0],
              value: null,
            });
          }}
        >
          <SelectTrigger className="w-fit min-w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ContributionSubjectDefinitions) as ContributionField[]).map(f => (
              <SelectItem key={f} value={f}>
                {ContributionSubjectDefinitions[f].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={props.condition.operator}
          onValueChange={v => {
            if (!v) {
              return;
            }
            props.onChange({ subject, operator: v as Op, value: props.condition.value });
          }}
        >
          <SelectTrigger className="w-fit min-w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map(op => (
              <SelectItem key={op} value={op}>
                {OpLabels[op] ?? op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grow">
          <InputComponent
            className="w-full"
            value={props.condition.value}
            onChange={v => {
              props.onChange({ subject, operator: props.condition.operator, value: v });
            }}
            operator={props.condition.operator}
            host={props.host}
            error={props.touched ? props.error : undefined}
          />
          <div>{props.touched && props.error && <p className="text-sm text-red-500">{props.error}</p>}</div>
        </div>

        {props.canRemove && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={props.onDelete}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
