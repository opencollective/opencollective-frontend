import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import type { Account, Host } from '../../lib/graphql/types/v2/graphql';
import { VirtualCardRequestStatus } from '../../lib/graphql/types/v2/graphql';
import { VirtualCardRequestStatusI18n } from '../../lib/i18n/virtual-card-request';

import CollectivePickerAsync from '../CollectivePickerAsync';
import { Box, Flex } from '../Grid';
import { StyledSelectFilter } from '../StyledSelectFilter';

const FilterContainer = styled.div`
  min-width: 150px;
  margin-bottom: 8px;
  flex: 1 1 120px;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  font-size: 9px;
  line-height: 14px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #9d9fa3;
`;

type VirtualCardRequestStatusProps = {
  selectedCollective: Account;
  onSelectedCollectiveChange: (c: Account) => void;

  virtualCardRequestStatusFilter: string[];
  onVirtualCardRequestStatusFilter: (c: string[]) => void;
  loading: boolean;

  host: Pick<Host, 'legacyId'>;
};

export default function VirtualCardRequestFilter(props: VirtualCardRequestStatusProps) {
  const intl = useIntl();
  return (
    <Box width="100%">
      <Flex justifyContent="center" flexWrap="wrap" gap="16px" my="16px">
        <FilterContainer>
          <FilterLabel htmlFor="virtual-card-request.collectives.filter">
            <FormattedMessage id="Collective" defaultMessage="Collective" />
          </FilterLabel>
          <CollectivePickerAsync
            isLoading={props.loading}
            inputId="virtual-card-request.collectives.filter"
            styles={{ control: { borderRadius: '100px', padding: '0 16px' } }}
            isClearable
            hostCollectiveIds={props.loading ? [] : [props.host?.legacyId]}
            collective={props.selectedCollective}
            onChange={v => props.onSelectedCollectiveChange(v?.value)}
          />
        </FilterContainer>
        <FilterContainer>
          <FilterLabel htmlFor="virtual-card-request.status.filter">
            <FormattedMessage id="virtual-card-request.status.filter" defaultMessage="Status" />
          </FilterLabel>
          <StyledSelectFilter
            intl={intl}
            inputId="virtual-card-request.status.filter"
            onChange={(newValue: { value: VirtualCardRequestStatus }[]) =>
              props.onVirtualCardRequestStatusFilter(newValue.map(v => v.value))
            }
            isMulti={true}
            isLoading={props.loading}
            value={props.virtualCardRequestStatusFilter.map(c => ({
              value: c,
              label: intl.formatMessage(VirtualCardRequestStatusI18n[c]),
            }))}
            options={Object.values(VirtualCardRequestStatus).map(c => ({
              value: c,
              label: intl.formatMessage(VirtualCardRequestStatusI18n[c]),
            }))}
          />
        </FilterContainer>
      </Flex>
    </Box>
  );
}
