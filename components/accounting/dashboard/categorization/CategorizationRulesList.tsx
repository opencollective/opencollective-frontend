import React from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useFormikContext } from 'formik';
import { get } from 'lodash';
import { Plus } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { HostContributionCategoryRulesQuery } from '@/lib/graphql/types/v2/graphql';

import type { ContributionCategorizationRule } from '@/components/accounting/dashboard/categorization/contributions';
import { ContributionField } from '@/components/accounting/dashboard/categorization/contributions';
import { Op } from '@/components/accounting/dashboard/categorization/rules';
import { Button } from '@/components/ui/Button';

import { RuleCard } from './RuleCard';

function generateId() {
  return `new-rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type CategorizationRulesListProps = {
  host: HostContributionCategoryRulesQuery['host'];
};

export function CategorizationRulesList(props: CategorizationRulesListProps) {
  const formikContext = useFormikContext();
  const rules = get(formikContext.values, 'rules', []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = rules.findIndex(r => r.id === (active.id as string));
    const newIndex = rules.findIndex(r => r.id === (over.id as string));
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    const newRules = arrayMove(rules, oldIndex, newIndex);
    formikContext.setFieldValue('rules', newRules);
    formikContext.setFieldTouched('rules', false);
  };

  const onCopy = React.useCallback(
    (rule: ContributionCategorizationRule, index: number) => {
      formikContext.setFieldValue('rules', [
        ...rules.slice(0, index + 1),
        {
          ...rule,
          name: `${rule.name} (Copy)`,
          id: generateId(),
        },
        ...rules.slice(index + 1),
      ]);
      formikContext.setFieldTouched('rules', false);
    },
    [formikContext, rules],
  );

  const onDelete = React.useCallback(
    (rule: ContributionCategorizationRule, index: number) => {
      formikContext.setFieldValue(
        'rules',
        rules.filter((_, i) => i !== index),
      );
      formikContext.setFieldTouched('rules', false);
    },
    [formikContext, rules],
  );

  const onAddRuleClick = React.useCallback(() => {
    formikContext.setFieldValue('rules', [
      ...rules,
      {
        id: generateId(),
        name: '',
        predicates: [
          {
            subject: ContributionField.description,
            operator: Op.contains,
            value: '',
          },
        ],
        categoryId: '',
      },
    ]);
  }, [formikContext, rules]);

  return (
    <div className="space-y-4">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <RuleCard
                index={index}
                key={rule.id}
                formikPrefix={`rules.${index}`}
                host={props.host}
                onCopy={() => onCopy(rule, index)}
                onDelete={() => onDelete(rule, index)}
                error={get(formikContext.errors, `rules.${index}`, false) as boolean}
                touched={get(formikContext.touched, `rules.${index}`, false) as boolean}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button className="w-full" variant="outline" onClick={onAddRuleClick}>
        <Plus className="mr-2 size-4" />
        <FormattedMessage id="CategorizationRule.addRule" defaultMessage="Add rule" />
      </Button>
    </div>
  );
}
