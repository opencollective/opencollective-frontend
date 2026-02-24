import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFormikContext } from 'formik';
import { get } from 'lodash';
import { ChevronUp, Copy, GripVertical, Trash2 } from 'lucide-react';

import type { HostContributionCategoryRulesQuery } from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

import { Switch } from '@/components/ui/Switch';

import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Card, CardContent, CardHeader } from '../../../ui/Card';

import { RuleForm } from './RuleForm';

type RuleCardProps = {
  host: HostContributionCategoryRulesQuery['host'];
  onCopy: () => void;
  onDelete: () => void;
  index: number;
  formikPrefix: string;
  error: boolean;
  touched: boolean;
};

export function RuleCard(props: RuleCardProps) {
  const formikContext = useFormikContext();

  const rule = get(formikContext.values, props.formikPrefix);
  const [isCollapsed, setIsCollapsed] = React.useState(!rule.id?.startsWith?.('new-rule'));

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const selectedCategory = props.host.accountingCategories.nodes.find(c => c.id === rule.categoryId);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(isDragging ? 'opacity-60' : undefined, props.touched && props.error ? 'border-red-500' : undefined)}
    >
      <CardHeader className="flex flex-row flex-wrap items-center gap-2 py-2">
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span
          className={cn(
            'shrink-0 text-sm text-muted-foreground',
            rule.enabled === false && 'pointer-events-none opacity-50 select-none',
          )}
        >
          #{props.index + 1}
        </span>
        <div
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2',
            rule.enabled === false && 'pointer-events-none opacity-50 select-none',
          )}
        >
          <p className="truncate font-medium">{rule.name}</p>
          {selectedCategory && (
            <Badge type="neutral" size="xs" round className="max-w-[200px] truncate px-3 py-1">
              <span className="text-muted-foreground">{selectedCategory.code}</span> {selectedCategory.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Switch
            checked={rule.enabled !== false}
            onCheckedChange={value => {
              formikContext.setFieldValue(`${props.formikPrefix}.enabled`, value);
            }}
          />
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={props.onCopy}>
          <Copy className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={props.onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsCollapsed(!isCollapsed)}>
          <ChevronUp className={cn('size-4', isCollapsed ? 'rotate-180' : undefined)} />
        </Button>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="border-t pt-6">
          <RuleForm formikPrefix={props.formikPrefix} host={props.host} />
        </CardContent>
      )}
    </Card>
  );
}
