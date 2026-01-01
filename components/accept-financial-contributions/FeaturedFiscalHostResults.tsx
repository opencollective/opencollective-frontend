import React from 'react';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';

import type { Account, Host } from '../../lib/graphql/types/v2/schema';

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

export default function FeaturedFiscalHostResults({
  hosts,
  collective,
}: {
  hosts: Pick<Host, 'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent'>[];
  collective: Pick<Account, 'slug'>;
}) {
  return (
    <div className="rounded-3xl bg-[#F1F6FF] p-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-bold">
          <FormattedMessage defaultMessage="OFi Consortium Members" id="zJv9HH" />
        </h1>
        <p>
          <FormattedMessage
            defaultMessage="{ hostCount, plural, one {# host} other {# hosts} } found"
            id="PB3Bh9"
            values={{
              hostCount: hosts.length,
            }}
          />
        </p>
      </div>
      <p>
        <FormattedMessage
          defaultMessage="They represent thousands of Collectives and guide our platform's strategic direction."
          id="tDuKL5"
        />
      </p>
      <HostCardContainer mt={3}>
        {hosts.map(host => {
          return <ApplyToHostCard key={host.slug} host={host} collective={collective} />;
        })}
      </HostCardContainer>
    </div>
  );
}
