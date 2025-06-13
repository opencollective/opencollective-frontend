import React from 'react';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const schema = z.enum(['ALL', 'ORGANIZATION', 'HOSTED']).default('ALL');

export const hostContextFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  //   toVariables: (value, key) => ({ [key]: { slug: value } }),
  filter: {
    static: true,
    StandaloneComponent: HostContextFilter,
  },
};

function HostContextFilter({ value, onChange }: FilterComponentProps<string>) {
  //   const intl = useIntl();

  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="h-9">
        <TabsTrigger className="h-7" value={'ALL'}>
          All
        </TabsTrigger>
        <TabsTrigger className="h-7" value={'ORGANIZATION'}>
          Organization
        </TabsTrigger>
        <TabsTrigger className="h-7" value={'HOSTED'}>
          Hosted
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
