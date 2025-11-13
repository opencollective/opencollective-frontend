import React from 'react';
import { DashboardContext } from './DashboardContext';
import { HostContextFilter } from './filters/HostContextFilter';
import { HostContext } from '@/lib/graphql/types/v2/graphql';

export function TitleHostContext({ title }) {
  const { account } = React.useContext(DashboardContext);

  const [hostContext, setHostContext] = React.useState(HostContext.ALL);
  if (!account.isHost) {
    return title;
  }
  return (
    <div className="flex items-center justify-between gap-4">
      {title}
      <HostContextFilter value={hostContext} onChange={val => setHostContext(val as HostContext)} />
    </div>
  );
}
