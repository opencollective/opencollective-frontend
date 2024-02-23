import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import type { Account, Host } from '../../lib/graphql/types/v2/graphql';

import { Flex, Grid } from '../Grid';
import StyledCard from '../StyledCard';
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

export default function FeaturedFiscalHostResults({
  hosts,
  collective,
  onHostApplyClick,
}: {
  hosts: Pick<Host, 'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent'>[];
  collective: Pick<Account, 'slug'>;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  return (
    <StyledCard padding={4} bg="#F1F6FF" borderRadius="24px" borderStyle="none">
      <Flex flexWrap="wrap">
        <P mr={3} fontSize="24px" lineHeight="32px" fontWeight="700" color="black.900">
          <FormattedMessage defaultMessage="Recommended Hosts" />
        </P>
        <P fontSize="14px" lineHeight="32px" fontWeight="400" color="black.900">
          <FormattedMessage
            defaultMessage="{ hostCount, plural, one {# host} other {# hosts} } found"
            values={{
              hostCount: hosts.length,
            }}
          />
        </P>
      </Flex>
      <P fontSize="14px" lineHeight="20px" fontWeight="500" color="black.900">
        <FormattedMessage defaultMessage="Our most trusted hosts" />
      </P>
      <HostCardContainer mt={3}>
        {hosts.map(host => {
          return (
            <ApplyToHostCard key={host.slug} host={host} collective={collective} onHostApplyClick={onHostApplyClick} />
          );
        })}
      </HostCardContainer>
    </StyledCard>
  );
}
