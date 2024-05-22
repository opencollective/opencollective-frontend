import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import {
  ArrowDown10,
  ArrowDownWideNarrow,
  ArrowDownZA,
  ArrowUp01,
  ArrowUpAZ,
  ArrowUpNarrowWide,
  ChevronDown,
} from 'lucide-react';
import { defineMessages, FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';
import { z } from 'zod';

import { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { DateTimeField, OrderByFieldType, OrderDirection } from '../../../lib/graphql/types/v2/graphql';

import { parseChronologicalOrderInput } from '../../expenses/filters/ExpensesOrder';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/Popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../../ui/Select';

const i18nFieldLabels = defineMessages({
  [DateTimeField.EFFECTIVE_DATE]: { defaultMessage: 'Effective Date', id: 'Gh3Obs' },
  [OrderByFieldType.BALANCE]: { defaultMessage: 'Balance', id: 'Balance' },
  [OrderByFieldType.CREATED_AT]: { defaultMessage: 'Date', id: 'expense.incurredAt' },
  [OrderByFieldType.NAME]: { defaultMessage: 'Name', id: 'Fields.name' },
});

const i18nDefaultDirectionLabels = defineMessages({
  [OrderDirection.DESC]: { defaultMessage: 'Descending', id: 'SortDirection.Descending' },
  [OrderDirection.ASC]: { defaultMessage: 'Ascending', id: 'SortDirection.Ascending' },
});

const i18nFieldDirectionLabels = {
  [OrderByFieldType.CREATED_AT]: defineMessages({
    [OrderDirection.DESC]: { defaultMessage: 'Newest to Oldest', id: 'SortDirection.NewestToOldest' },
    [OrderDirection.ASC]: { defaultMessage: 'Oldest to Newest', id: 'SortDirection.OldestToNewest' },
  }),
  [DateTimeField.EFFECTIVE_DATE]: defineMessages({
    [OrderDirection.DESC]: { defaultMessage: 'Newest to Oldest', id: 'SortDirection.NewestToOldest' },
    [OrderDirection.ASC]: { defaultMessage: 'Oldest to Newest', id: 'SortDirection.OldestToNewest' },
  }),
  [OrderByFieldType.NAME]: defineMessages({
    [OrderDirection.DESC]: { defaultMessage: 'Z to A', id: 'SortDirection.ZtoA' },
    [OrderDirection.ASC]: { defaultMessage: 'A to Z', id: 'SortDirection.AtoZ' },
  }),
  [OrderByFieldType.BALANCE]: defineMessages({
    [OrderDirection.DESC]: { defaultMessage: 'Highest to Lowest', id: 'SortDirection.HighestToLowest' },
    [OrderDirection.ASC]: { defaultMessage: 'Lowest to Highest', id: 'SortDirection.LowestToHighest' },
  }),
};

const FieldIconTypes = {
  [DateTimeField.EFFECTIVE_DATE]: 'NUMERICAL',
  [OrderByFieldType.ACTIVITY]: 'NUMERICAL',
  [OrderByFieldType.BALANCE]: 'NUMERICAL',
  [OrderByFieldType.CREATED_AT]: 'NUMERICAL',
  [OrderByFieldType.HOSTED_COLLECTIVES_COUNT]: 'NUMERICAL',
  [OrderByFieldType.HOST_RANK]: 'NUMERICAL',
  [OrderByFieldType.NAME]: 'ALPHABETIC',
  [OrderByFieldType.RANK]: 'NUMERICAL',
  [OrderByFieldType.TOTAL_CONTRIBUTED]: 'NUMERICAL',
};

const Icons = {
  ALPHABETIC: {
    ASC: ArrowUpAZ,
    DESC: ArrowDownZA,
  },
  NUMERICAL: {
    ASC: ArrowUp01,
    DESC: ArrowDown10,
  },
  DEFAULT: {
    ASC: ArrowUpNarrowWide,
    DESC: ArrowDownWideNarrow,
  },
};

const i18nSortFieldLabel = (intl, field, i18nCustomLabels?: Record<string, MessageDescriptor>) => {
  if (i18nCustomLabels && i18nCustomLabels[field]) {
    return intl.formatMessage(i18nCustomLabels[field]);
  }
  return i18nFieldLabels[field] ? intl.formatMessage(i18nFieldLabels[field]) : field;
};

const i18nSortDirectionLabel = (intl, direction, field) => {
  if (!field || !i18nFieldDirectionLabels[field]) {
    return intl.formatMessage(i18nDefaultDirectionLabels[direction]);
  }
  return intl.formatMessage(i18nFieldDirectionLabels[field][direction]);
};

const sortDirectionSchema = z.enum(['ASC', 'DESC']);

export function buildSortFilter({
  fieldSchema,
  defaultValue,
  i18nCustomLabels,
}: {
  fieldSchema: z.ZodEnum<any>;
  defaultValue: any;
  i18nCustomLabels?: Record<string, MessageDescriptor>;
}): FilterConfig<
  z.infer<
    z.ZodObject<{
      field: typeof fieldSchema;
      direction: typeof sortDirectionSchema;
    }>
  >
> {
  return {
    schema: z
      .object({
        field: fieldSchema,
        direction: sortDirectionSchema,
      })
      .default(defaultValue),
    filter: {
      static: true,
      StandaloneComponent: buildSortFilterComponent(fieldSchema, i18nCustomLabels),
    },
  };
}
const getIcon = (direction, field) => Icons[FieldIconTypes[field]][direction] ?? Icons.DEFAULT[direction];

function buildSortFilterComponent(
  fieldSchema: z.ZodEnum<any>,
  i18nCustomLabels?: Record<string, MessageDescriptor>,
): React.FunctionComponent<
  FilterComponentProps<
    z.infer<
      z.ZodObject<{
        field: typeof fieldSchema;
        direction: typeof sortDirectionSchema;
      }>
    >
  >
> {
  return function SortFilter({ onChange, value }) {
    const intl = useIntl();
    const Icon = getIcon(value.direction, value.field);
    const simpleList = true;

    if (simpleList) {
      return (
        <Select
          value={`${value.field},${value.direction}`}
          onValueChange={value => onChange(parseChronologicalOrderInput(value))}
        >
          <SelectPrimitive.Trigger asChild>
            <Button className="gap-1.5 rounded-full" variant="outline" size="sm">
              <span>
                <span className="text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="Sort by <SortField>{sortField}</SortField>"
                    id="SortFilter.SortByField"
                    values={{
                      sortField: i18nSortFieldLabel(intl, value.field, i18nCustomLabels),
                      SortField: parts => <span className="text-foreground">{parts}</span>,
                    }}
                  />
                </span>
              </span>

              <Icon size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
            </Button>
          </SelectPrimitive.Trigger>
          <SelectContent align="end">
            {fieldSchema.options.map((field, i) => (
              <SelectGroup key={field}>
                {i !== 0 && <SelectSeparator />}

                <SelectLabel className="font-medium">{i18nSortFieldLabel(intl, field, i18nCustomLabels)}</SelectLabel>
                {sortDirectionSchema.options.map(direction => {
                  const Icon = getIcon(direction, field);
                  return (
                    <SelectItem
                      key={direction}
                      value={`${field},${direction}`}
                      onSelect={() => onChange({ field, direction })}
                      className=""
                      asChild
                    >
                      <div className="flex w-full flex-1 items-center justify-between gap-2">
                        <span>{i18nSortDirectionLabel(intl, direction, field)}</span>
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Popover>
        <PopoverTrigger>
          <Button className="gap-1 rounded-full" variant="outline" size="sm">
            <Icon className="-ml-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="text-muted-foreground">Sort by</span>{' '}
            {i18nSortFieldLabel(intl, value.field, i18nCustomLabels)}
            <ChevronDown size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="max-w-52 p-3">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>
                <FormattedMessage defaultMessage="Sort by" id="hDI+JM" />
              </Label>
              <Select onValueChange={field => onChange({ ...value, field })} value={value.field}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {fieldSchema.options.map(field => (
                    <SelectItem value={field} key={field}>
                      {i18nSortFieldLabel(intl, field, i18nCustomLabels)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>
                <FormattedMessage defaultMessage="Direction" id="DZ2Koj" />
              </Label>
              <Select
                value={value.direction}
                onValueChange={direction =>
                  onChange({ ...value, direction: direction as z.infer<typeof sortDirectionSchema> })
                }
              >
                <SelectTrigger>
                  <div className="flex gap-2">
                    <Icon className="-ml-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {sortDirectionSchema.options.map(direction => (
                    <SelectItem key={direction} value={direction}>
                      {i18nSortDirectionLabel(intl, direction, value.field)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };
}
