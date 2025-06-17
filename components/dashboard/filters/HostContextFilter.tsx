import React from 'react';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const schema = z.enum(['ALL', 'ORGANIZATION', 'HOSTED']).default('ALL');

export const hostContextFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  filter: {
    static: true,
    StandaloneComponent: HostContextFilter,
  },
};

function HostContextFilter({ value, onChange }: FilterComponentProps<string>) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="h-9">
        <TabsTrigger className="h-7" value={'ALL'}>
          <FormattedMessage defaultMessage="All" id="zQvVDJ" />
        </TabsTrigger>
        <TabsTrigger className="h-7" value={'ORGANIZATION'}>
          <FormattedMessage defaultMessage="Organization" id="Tags.ORGANIZATION" />
        </TabsTrigger>
        <TabsTrigger className="h-7" value={'HOSTED'}>
          <FormattedMessage defaultMessage="Hosted" id="HostContextFilter.Hosted" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
