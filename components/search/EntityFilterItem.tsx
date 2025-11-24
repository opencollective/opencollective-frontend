import React, { useCallback } from 'react';
import { FormattedMessage, type IntlShape } from 'react-intl';

import { type useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';
import { i18nSearchEntity } from '@/lib/i18n/search';
import { cn } from '@/lib/utils';

import type { entityFilterOptions, schema } from './filters';
import { SearchCommandItem } from './SearchCommandItem';

type EntityOption = (typeof entityFilterOptions)[keyof typeof entityFilterOptions];

interface EntityFilterItemProps {
  opt: EntityOption;
  queryFilter: useQueryFilterReturnType<typeof schema, any>;
  intl: IntlShape;
}

const EntityFilterItemInner = ({ opt, queryFilter, intl }: EntityFilterItemProps) => {
  const entityLabel = i18nSearchEntity(intl, opt.value);

  const handleSelect = useCallback(() => {
    queryFilter.setFilter('entity', opt.value);
  }, [queryFilter, opt.value]);

  return (
    <SearchCommandItem
      key={opt.value}
      onSelect={handleSelect}
      value={opt.value}
      actionLabel={intl.formatMessage(
        { defaultMessage: 'Search in {entity}', id: 'UHj+h/' },
        { entity: entityLabel.toLowerCase() },
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn('flex size-9 items-center justify-center rounded-md', opt.className)}>
          <opt.icon />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground group-hover:text-foreground">{entityLabel}</span>
          <span className="text-xs text-muted-foreground">
            {queryFilter.values.workspace ? (
              <FormattedMessage
                defaultMessage="Find {entities} in your workspace."
                id="SnHGJH"
                values={{ entities: entityLabel }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Find any {entities} on the platform."
                id="HplALu"
                values={{ entities: entityLabel }}
              />
            )}
          </span>
        </div>
      </div>
    </SearchCommandItem>
  );
};

export const EntityFilterItem = React.memo(EntityFilterItemInner);
