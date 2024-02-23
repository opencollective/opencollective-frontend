import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import type { Account, Host } from '../../lib/graphql/types/v2/graphql';

import { Box, Flex, Grid } from '../Grid';
import { P } from '../Text';

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
  onHostApplyClick,
}: {
  hosts: Pick<Host, 'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent'>[];
  totalCount: number;
  collective: Pick<Account, 'slug'>;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  return (
    <Box>
      <Flex>
        <P mr={3} fontSize="24px" lineHeight="32px" fontWeight="700" color="black.900">
          <FormattedMessage defaultMessage="Other Hosts" />
        </P>
        <P fontSize="14px" lineHeight="32px" fontWeight="400" color="black.900">
          <FormattedMessage
            defaultMessage="{ hostCount, plural, one {# host} other {# hosts} } found"
            values={{
              hostCount: totalCount,
            }}
          />
        </P>
      </Flex>
      <HostCardContainer mt={3}>
        {hosts.map(host => {
          return (
            <ApplyToHostCard key={host.slug} host={host} collective={collective} onHostApplyClick={onHostApplyClick} />
          );
        })}
      </HostCardContainer>
    </Box>
  );
}
