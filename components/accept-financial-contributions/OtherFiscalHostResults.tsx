import React from 'react';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';

import type { Account, Host } from '../../lib/graphql/types/v2/graphql';

import { Grid } from '../Grid';

import ApplyToHostCard from './ApplyToHostCard';

const HostCardContainer = styled(Grid).attrs({
  justifyItems: 'center',
  gridGap: '30px',
  gridTemplateColumns: ['repeat(auto-fill, minmax(250px, 1fr))'],
  gridAutoRows: ['1fr'],
})`
  & > * {
    padding: 0;
  }
`;

export default function OtherFiscalHostResults({
  hosts,
  totalCount,
  collective,
}: {
  hosts: Pick<Host, 'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent'>[];
  totalCount: number;
  collective: Pick<Account, 'slug'>;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-bold">
          <FormattedMessage defaultMessage="Other Hosts" id="8DxsHx" />
        </h1>
        <p>
          <FormattedMessage
            defaultMessage="{ hostCount, plural, one {# host} other {# hosts} } found"
            id="PB3Bh9"
            values={{
              hostCount: totalCount,
            }}
          />
        </p>
      </div>
      <HostCardContainer mt={3}>
        {hosts.map(host => {
          return <ApplyToHostCard key={host.slug} host={host} collective={collective} />;
        })}
      </HostCardContainer>
    </div>
  );
}
