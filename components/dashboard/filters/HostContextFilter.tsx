import React from 'react';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { HostContext } from '@/lib/graphql/types/v2/graphql';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const schema = z.nativeEnum(HostContext).default(HostContext.ALL);

export const hostContextFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  filter: {
    static: true,
    StandaloneComponent: HostContextFilter,
  },
};

export function HostContextFilter({ value, onChange }: FilterComponentProps<z.infer<typeof schema>>) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="h-9">
        <TabsTrigger className="h-7" value={HostContext.ALL}>
          <FormattedMessage defaultMessage="All" id="zQvVDJ" />
        </TabsTrigger>
        <TabsTrigger className="h-7" value={HostContext.INTERNAL}>
          <FormattedMessage defaultMessage="Organization" id="Tags.ORGANIZATION" />
        </TabsTrigger>
        <TabsTrigger className="h-7" value={HostContext.HOSTED}>
          <FormattedMessage defaultMessage="Hosted" id="HostContextFilter.Hosted" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
